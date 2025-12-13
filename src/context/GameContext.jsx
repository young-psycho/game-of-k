import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import defaultPermanent from "../data/defaultSettings.json";
import { uid, buildDare } from "../utils/gameLogic";
import { loadSession, saveSession, loadSettings, saveSettings } from "../utils/storage";

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

// ── Supabase bootstrap (optional; falls back to offline defaults) ─────────────────
const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || ""; // e.g. https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY || "";
const sb = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export function GameProvider({ children }) {
    const restored = useMemo(loadSession, []);
    const [sessionName, setSessionName] = useState(restored?.sessionName || "Private Session");
    const [players, setPlayers] = useState(restored?.players || []);
    const [consents, setConsents] = useState(restored?.consents || {}); // key: "a|b" => true
    const [prefs, setPrefs] = useState(restored?.prefs || {}); // { playerId: { activitySlug: "give|receive|both|nope" } }
    const [inventory, setInventory] = useState(restored?.inventory || []); // array of tool slugs
    const [permanent, setPermanent] = useState(() => loadSettings() || defaultPermanent);
    const [step, setStep] = useState(restored?.step || 0);
    const [lastDare, setLastDare] = useState(null);
    const [error, setError] = useState("");
    const [noRepeatTurns, setNoRepeatTurns] = useState(restored?.noRepeatTurns ?? 10);
    const [dareHistory, setDareHistory] = useState(restored?.dareHistory || []); // array of dare signatures
    const [timers, setTimers] = useState(restored?.timers || []); // array of { id, dareText, totalSeconds, timeRemaining, isActive, isCurrent }
    const [wizardState, setWizardState] = useState(restored?.wizardState || null);
    const [navOverride, setNavOverride] = useState(null); // { onBack, onNext, backLabel, nextLabel, canBack, canNext }

    // Fetch permanent data from Supabase if configured
    useEffect(() => {
        if (loadSettings()) return;
        let cancelled = false;
        async function fetchPermanent() {
            if (!sb) return; // keep offline defaults
            try {
                const [acts, bps, abp, tls, at] = await Promise.all([
                    sb.from("activities").select("slug,name,verb,preposition,with_word,has_body_part,has_duration,min_seconds,max_seconds,has_repetitions,min_reps,max_reps").order("name"),
                    sb.from("body_parts").select("slug,name,allowed_genders"),
                    sb.from("activity_body_parts").select("activity_slug,body_part_slug"),
                    sb.from("tools").select("slug,name,always_available,implicit").order("name"),
                    sb.from("activity_tools").select("activity_slug,tool_slug"),
                ]);
                if ([acts.error, bps.error, abp.error, tls.error, at.error].some(Boolean)) throw new Error("Supabase fetch error");
                const activity_body_parts = {};
                for (const row of abp.data) {
                    activity_body_parts[row.activity_slug] = activity_body_parts[row.activity_slug] || [];
                    activity_body_parts[row.activity_slug].push(row.body_part_slug);
                }
                const activity_tools = {};
                for (const row of at.data) {
                    activity_tools[row.activity_slug] = activity_tools[row.activity_slug] || [];
                    activity_tools[row.activity_tools].push(row.tool_slug);
                }
                const perm = {
                    activities: acts.data,
                    body_parts: bps.data.map((b) => ({ slug: b.slug, name: b.name, genders: b.allowed_genders })),
                    activity_body_parts,
                    tools: tls.data,
                    activity_tools,
                };
                if (!cancelled) setPermanent(perm);
            } catch (e) {
                console.warn("Using offline defaults due to Supabase error:", e.message);
            }
        }
        fetchPermanent();
        return () => { cancelled = true; };
    }, []);

    // Persist session
    useEffect(() => {
        saveSession({ sessionName, players, consents, prefs, inventory, step, noRepeatTurns, dareHistory, timers, wizardState });
    }, [sessionName, players, consents, prefs, inventory, step, noRepeatTurns, dareHistory, timers, wizardState]);

    // Timer countdown effect for all active timers
    useEffect(() => {
        const activeTimers = timers.filter(t => t.isActive && t.timeRemaining > 0);
        if (activeTimers.length === 0) return;

        const interval = setInterval(() => {
            setTimers(prev => prev.map(timer => {
                if (!timer.isActive || timer.timeRemaining <= 0) return timer;

                const newTimeRemaining = timer.timeRemaining - 1;
                return {
                    ...timer,
                    timeRemaining: newTimeRemaining,
                    isActive: newTimeRemaining > 0
                };
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, [timers]);

    // Derived helpers
    const canAdvance = () => {
        if (step === 0) return players.length >= 2; // need at least two players
        if (step === 1) return true; // consents editable always
        if (step === 2) return true; // Preferences are optional/complex
        if (step === 3) return true; // inventory optional
        return true;
    };

    // Player CRUD
    const addPlayer = (name, gender) => {
        const p = { id: uid(), name: name.trim(), gender };
        setPlayers((ps) => [...ps, p]);
    };
    const removePlayer = (id) => {
        setPlayers((ps) => ps.filter((p) => p.id !== id));
        setConsents((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !k.startsWith(id + "|") && !k.endsWith("|" + id))));
        setPrefs((pf) => { const n = { ...pf }; delete n[id]; return n; });
    };

    const importPlayer = (playerData) => {
        const newId = uid();
        const newPlayer = { id: newId, name: playerData.name, gender: playerData.gender };
        setPlayers(prev => [...prev, newPlayer]);
        if (playerData.prefs) {
            setPrefs(prev => ({ ...prev, [newId]: playerData.prefs }));
        }
    };

    const toggleConsent = (a, b) => setConsents((c) => ({ ...c, [`${a}|${b}`]: !c[`${a}|${b}`] }));

    const setAllConsentsForPlayer = (playerId, value) => {
        setConsents((c) => {
            const newConsents = { ...c };
            players.forEach((other) => {
                if (other.id === playerId) return;
                newConsents[`${playerId}|${other.id}`] = value;
            });
            return newConsents;
        });
    };

    const updatePlayerPref = (playerId, activitySlug, type, field, value) => {
        setPrefs(prev => {
            const pPrefs = prev[playerId] || {};

            // Find activity to get defaults
            const activity = permanent.activities.find(a => a.slug === activitySlug);
            const defaultTargets = activity?.default_targets || [];

            const actPrefs = pPrefs[activitySlug] || {
                give: { enabled: false, tools: [], targets: defaultTargets, tool_constraints: {} },
                receive: { enabled: false, tools: [], targets: defaultTargets, tool_constraints: {} }
            };

            const newActPrefs = {
                ...actPrefs,
                [type]: {
                    ...actPrefs[type],
                    [field]: value
                }
            };

            return { ...prev, [playerId]: { ...pPrefs, [activitySlug]: newActPrefs } };
        });
    };

    const setPref = (pid, act, val) => { }; // Deprecated
    const setAllPrefsForPlayer = (playerId, value) => { }; // Deprecated


    const toggleInventory = (slug) => setInventory((arr) => arr.includes(slug) ? arr.filter((s) => s !== slug) : [...arr, slug]);


    const spin = () => {
        // Create signature for recent dares to avoid
        const recentSignatures = new Set(dareHistory.slice(-noRepeatTurns));

        const res = buildDare({ players, consents, prefs, inventory }, permanent, recentSignatures);
        if (res.error) {
            setError(res.error);
            setLastDare(null);
        } else {
            setError("");
            setLastDare(res);
            // Add dare signature to history
            const signature = `${res.meta.giver.id}|${res.meta.receiver.id}|${res.meta.activity}`;
            setDareHistory(prev => [...prev, signature]);

            // Remove inactive timers (passed dares) and mark remaining as not current
            setTimers(prev => prev
                .filter(t => t.isActive) // Keep only running timers
                .map(t => ({ ...t, isCurrent: false })) // Mark them as not current
            );

            // Add new timer if dare has duration
            if (res.meta.seconds) {
                const newTimer = {
                    id: uid(),
                    dareText: res.text,
                    totalSeconds: res.meta.seconds,
                    timeRemaining: res.meta.seconds,
                    isActive: false,
                    isCurrent: true
                };
                setTimers(prev => [...prev, newTimer]);
            }
        }
    };

    const startTimer = (timerId) => {
        setTimers(prev => prev.map(t =>
            t.id === timerId ? { ...t, isActive: true } : t
        ));
    };

    const stopTimer = (timerId) => {
        setTimers(prev => prev.map(t =>
            t.id === timerId ? { ...t, isActive: false } : t
        ));
    };

    const resetTimer = (timerId) => {
        setTimers(prev => prev.map(t =>
            t.id === timerId ? { ...t, timeRemaining: t.totalSeconds, isActive: false } : t
        ));
    };

    const removeTimer = (timerId) => {
        setTimers(prev => prev.filter(t => t.id !== timerId));
    };

    const resetSession = () => {
        setPlayers([]);
        setConsents({});
        setPrefs({});
        setInventory([]);
        setLastDare(null);
        setStep(0);
        setDareHistory([]);
        setNoRepeatTurns(10);
        setTimers([]);
        setWizardState(null);
    };

    const updatePermanent = (newData) => {
        setPermanent(newData);
        saveSettings(newData);
    };

    const resetPermanent = () => {
        setPermanent(defaultPermanent);
        saveSettings(defaultPermanent);
    };

    const value = {
        sessionName, setSessionName,
        players, addPlayer, removePlayer,
        consents, toggleConsent, setAllConsentsForPlayer,
        prefs, setPref, setAllPrefsForPlayer, updatePlayerPref,
        inventory, toggleInventory, setInventory,
        permanent, updatePermanent, resetPermanent,
        resetSession,
        step, setStep,
        lastDare, spin,
        error,
        noRepeatTurns, setNoRepeatTurns,
        dareHistory,
        timers, startTimer, stopTimer, resetTimer, removeTimer,
        canAdvance,
        importPlayer,
        wizardState, setWizardState,
        navOverride, setNavOverride
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}
