import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase bootstrap (optional; falls back to offline defaults) ─────────────────
const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || ""; // e.g. https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY || "";
const sb = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ── Offline defaults (permanent data) ────────────────────────────────────────────
const defaultPermanent = {
    activities: [
        { slug: "spank", name: "Spanking", verb: "spank", preposition: "'s", with_word: "with", has_body_part: true, has_duration: false, has_repetitions: true, min_reps: 1, max_reps: 20 },
        { slug: "kiss", name: "Kissing", verb: "kiss", preposition: "on the", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 10, max_seconds: 60, has_repetitions: false },
        { slug: "tickle", name: "Tickling", verb: "tickle", preposition: "in the", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 10, max_seconds: 120, has_repetitions: false },
        { slug: "restrain", name: "Restrain", verb: "restrain", preposition: "by the", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 60, max_seconds: 600, has_repetitions: false },
        { slug: "pinch", name: "Nipple Pinching", verb: "pinch", preposition: "on the", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 10, max_seconds: 60, has_repetitions: false },
        { slug: "lick", name: "Licking", verb: "lick", preposition: "on the", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 10, max_seconds: 120, has_repetitions: false },
        { slug: "drink", name: "Drinking", verb: "drink from", preposition: "'s", with_word: "with", has_body_part: true, has_duration: false, has_repetitions: false },
        { slug: "slap", name: "Slapping", verb: "slap", preposition: "on the", with_word: "", has_body_part: true, has_duration: false, has_repetitions: true, min_reps: 1, max_reps: 10 },
        { slug: "write", name: "Writing", verb: "write something on", preposition: "'s", with_word: "with", has_body_part: true, has_duration: false, has_repetitions: false },
        { slug: "gag", name: "Gagging", verb: "gag", preposition: "'s", with_word: "with", has_body_part: true, has_duration: true, min_seconds: 30, max_seconds: 300, has_repetitions: false },
        { slug: "punch", name: "Punching", verb: "punch", preposition: "on the", with_word: "", has_body_part: true, has_duration: false, has_repetitions: true, min_reps: 1, max_reps: 10 },
        { slug: "oral", name: "Give Oral Pleasure", verb: "give oral pleasure to", preposition: "on the", with_word: "using their", has_body_part: false, has_duration: true, min_seconds: 60, max_seconds: 300, has_repetitions: false },
        { slug: "fuck", name: "Fucking", verb: "fuck", preposition: "in the", with_word: "with their", has_body_part: true, has_duration: true, min_seconds: 60, max_seconds: 600, has_repetitions: false },
        { slug: "masturbate", name: "Masturbate", verb: "masturbate", preposition: "'s", with_word: "with their", has_body_part: true, has_duration: true, min_seconds: 60, max_seconds: 300, has_repetitions: false },
    ],
    body_parts: [
        // head: ears, cheeks, lips
        { slug: "ears", name: "ears", genders: ["M", "F"] },
        { slug: "cheeks", name: "cheeks", genders: ["M", "F"] },
        { slug: "lips", name: "lips", genders: ["M", "F"] },
        { slug: "mouth", name: "mouth", genders: ["M", "F"] },
        { slug: "face", name: "face", genders: ["M", "F"] },
        // torso: neck, shoulders, arms, chest, breasts, nipples, belly, ribs
        { slug: "neck", name: "neck", genders: ["M", "F"] },
        { slug: "shoulders", name: "shoulders", genders: ["M", "F"] },
        { slug: "arms", name: "arms", genders: ["M", "F"] },
        { slug: "armpits", name: "armpits", genders: ["M", "F"] },
        { slug: "chest", name: "chest", genders: ["M"] },
        { slug: "breasts", name: "breasts", genders: ["F"] },
        { slug: "nipples", name: "nipples", genders: ["M", "F"] },
        { slug: "belly", name: "belly", genders: ["M", "F"] },
        { slug: "ribs", name: "ribs", genders: ["M", "F"] },
        // genitals: dick, pussy, clitoris, ass
        { slug: "dick", name: "dick", genders: ["M"] },
        { slug: "pussy", name: "pussy", genders: ["F"] },
        { slug: "clitoris", name: "clitoris", genders: ["F"] },
        { slug: "ass", name: "ass", genders: ["M", "F"] },
        // lower body: thighs, legs, feet
        { slug: "thighs", name: "thighs", genders: ["M", "F"] },
        { slug: "legs", name: "legs", genders: ["M", "F"] },
        { slug: "feet", name: "feet", genders: ["M", "F"] },
    ],
    activity_body_parts: {
        spank: ["ass", "thighs", "belly", "breasts", "chest", "pussy"],
        kiss: ["ears", "cheeks", "lips", "neck", "chest", "breasts", "nipples", "belly", "dick", "pussy", "clitoris", "ass", "thighs"],
        tickle: ["neck", "armpits", "nipples", "breasts", "belly", "ribs", "pussy", "clitoris", "ass", "thighs"],
        restrain: ["arms", "legs"],
        pinch: ["nipples"],
        lick: ["ears", "neck", "chest", "breasts", "nipples", "belly", "dick", "pussy", "clitoris", "ass", "thighs"],
        drink: ["belly"],
        slap: ["face"],
        write: ["cheeks", "arms", "chest", "breasts", "belly", "ribs", "ass", "thighs", "legs"],
        gag: ["mouth"],
        punch: ["ass", "thighs"],
        oral: ["dick", "pussy", "clitoris", "ass"],
        fuck: ["pussy", "ass", "mouth"],
        masturbate: ["dick", "pussy"],
    },
    tools: [
        // Basic tools
        { slug: "hand", name: "hand", always_available: true, implicit: false },
        { slug: "mouth", name: "mouth", always_available: true, implicit: true },
        { slug: "tongue", name: "tongue", always_available: true, implicit: false },
        // Spanking tools
        { slug: "belt", name: "belt", always_available: false, implicit: false },
        { slug: "paddle", name: "paddle", always_available: false, implicit: false },
        { slug: "crop", name: "crop", always_available: false, implicit: false },
        { slug: "whip", name: "whip", always_available: false, implicit: false },
        { slug: "flogger", name: "flogger", always_available: false, implicit: false },
        // Tickling tools
        { slug: "feather", name: "feather", always_available: false, implicit: false },
        { slug: "brush", name: "brush", always_available: false, implicit: false },
        { slug: "wartenberg_wheel", name: "wartenberg wheel", always_available: false, implicit: false },
        // Restrain tools
        { slug: "handcuffs", name: "handcuffs", always_available: false, implicit: false },
        { slug: "rope", name: "rope", always_available: false, implicit: false },
        { slug: "tape", name: "tape", always_available: false, implicit: false },
        { slug: "bands", name: "bands", always_available: false, implicit: false },
        // Pinching tools
        { slug: "nipple_clamps", name: "nipple clamps", always_available: false, implicit: false },
        // Writing tools: lipstick, marker
        { slug: "lipstick", name: "lipstick", always_available: false, implicit: false },
        { slug: "marker", name: "marker", always_available: false, implicit: false },
        // Gagging tools: ball_gag, ring_gag, dildo_gag, panties
        { slug: "ball_gag", name: "ball gag", always_available: false, implicit: false },
        { slug: "ring_gag", name: "ring gag", always_available: false, implicit: false },
        { slug: "dildo_gag", name: "dildo gag", always_available: false, implicit: false },
        { slug: "underwear", name: "their underwear", always_available: true, implicit: false },
        // Sexual toys
        { slug: "dildo", name: "dildo", always_available: false, implicit: false },
        { slug: "vibrator", name: "vibrator", always_available: false, implicit: false },
        { slug: "butt_plug", name: "butt plug", always_available: false, implicit: false },
    ],
    activity_tools: {
        spank: ["hand", "belt", "paddle", "crop", "whip", "flogger"],
        kiss: ["mouth"],
        tickle: ["feather", "hand", "tongue", "brush", "wartenberg_wheel"],
        restrain: ["handcuffs", "rope", "tape", "bands"],
        pinch: ["hand", "nipple_clamps"],
        lick: ["mouth"],
        drink: ["mouth"],
        slap: [],
        write: ["lipstick", "marker"],
        gag: ["ball_gag", "ring_gag", "dildo_gag", "underwear", "tape"],
        punch: [],
        oral: [],
        fuck: ["dick", "dildo"],
        masturbate: ["hand", "vibrator"],
    },
};

// ── Local storage helpers ────────────────────────────────────────────────────────
const LS_KEY = "kinkdare.session.v1";
const loadSession = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; }
};
const saveSession = (s) => localStorage.setItem(LS_KEY, JSON.stringify(s));

// ── Small utilities ──────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Grammar niceties per activity/body-part
function phrase(activitySlug, bodyPartSlug) {
    const override = {
        tickle: { armpits: "in the armpits" },
    };
    const table = override[activitySlug] || {};
    if (table[bodyPartSlug]) return table[bodyPartSlug];
    // sensible defaults
    const def = defaultPermanent.activities.find((b) => b.slug === activitySlug)?.preposition || "on the";
    const part = defaultPermanent.body_parts.find((b) => b.slug === bodyPartSlug)?.name || bodyPartSlug;
    return `${def} ${part}`;
}

// Dare generator with constraints
function buildDare(session, permanent, recentSignatures = new Set()) {
    const { players, consents, prefs, inventory } = session;
    const { activities, body_parts, activity_body_parts, tools, activity_tools } = permanent;


    // Precompute helper indexes
    const toolBySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));
    const activityBySlug = Object.fromEntries(activities.map((a) => [a.slug, a]));
    const bodyBySlug = Object.fromEntries(body_parts.map((b) => [b.slug, b]));


    // Build all eligible combinations, then sample one
    const combos = [];
    const freshCombos = []; // combos not in recent history
    for (const giver of players) {
        for (const receiver of players) {
            if (giver.id === receiver.id) continue;
            // mutual consent and mutual gender interest
            const consentAB = !!consents[`${giver.id}|${receiver.id}`];
            const consentBA = !!consents[`${receiver.id}|${giver.id}`];
            if (!consentAB || !consentBA) continue;
            if (!giver.interests.includes(receiver.gender)) continue;
            if (!receiver.interests.includes(giver.gender)) continue;


            for (const act of activities) {
                const pG = prefs[giver.id]?.[act.slug] || "nope";
                const pR = prefs[receiver.id]?.[act.slug] || "nope";
                const giverOK = pG === "give" || pG === "both";
                const recOK = pR === "receive" || pR === "both";
                if (!giverOK || !recOK) continue;

                // Check if this combo was recent
                const signature = `${giver.id}|${receiver.id}|${act.slug}`;
                const isRecent = recentSignatures.has(signature);


                const allowedParts = act.has_body_part ? (activity_body_parts[act.slug] || []) : [null];
                const partsFiltered = allowedParts.filter((bp) => {
                    if (!bp) return true;
                    const b = bodyBySlug[bp];
                    return b && (b.genders.includes(receiver.gender) || b.genders.includes("Any"));
                });
                if (act.has_body_part && partsFiltered.length === 0) continue;


                const toolSlugs = activity_tools[act.slug] || [];
                const inventorySet = new Set([...(inventory || []), ...tools.filter(t => t.always_available).map(t => t.slug)]);
                const usableTools = toolSlugs.filter((ts) => inventorySet.has(ts));
                // If an activity defines tools but none usable, skip
                if (toolSlugs.length > 0 && usableTools.length === 0) continue;


                const combo = { giver, receiver, act, parts: partsFiltered, tools: usableTools.length ? usableTools : [null] };
                combos.push(combo);
                if (!isRecent) freshCombos.push(combo);
            }
        }
    }


    if (combos.length === 0) return { error: "No eligible dares. Adjust consents, preferences, or inventory." };

    // Prefer fresh combos, but fall back to all if no fresh ones available
    const poolToUse = freshCombos.length > 0 ? freshCombos : combos;


    const pick = sample(poolToUse);
    const part = pick.act.has_body_part ? sample(pick.parts) : null;
    const toolSlug = sample(pick.tools);
    const tool = toolSlug ? toolBySlug[toolSlug] : null;

    // Decide between duration or repetitions if both are available
    let secs = null;
    let reps = null;

    if (pick.act.has_duration && pick.act.has_repetitions) {
        // Randomly choose between duration or repetitions
        if (Math.random() < 0.5) {
            secs = rand(pick.act.min_seconds, pick.act.max_seconds);
        } else {
            reps = rand(pick.act.min_reps, pick.act.max_reps);
        }
    } else if (pick.act.has_duration) {
        secs = rand(pick.act.min_seconds, pick.act.max_seconds);
    } else if (pick.act.has_repetitions) {
        reps = rand(pick.act.min_reps, pick.act.max_reps);
    }


    // Build phrase
    const bodyFrag = part ? ` ${phrase(pick.act.slug, part)}` : "";
    const withFrag = tool && !tool.implicit ? ` ${pick.act.with_word} ${tool.name === "hand" ? "their " : ""}${tool.name}` : "";

    // Format duration
    let durFrag = "";
    if (secs) {
        if (secs >= 60) {
            const mins = Math.floor(secs / 60);
            const remainingSecs = secs % 60;
            if (remainingSecs === 0) {
                durFrag = ` for ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
            } else {
                durFrag = ` for ${mins} ${mins === 1 ? 'minute' : 'minutes'} and ${remainingSecs} ${remainingSecs === 1 ? 'second' : 'seconds'}`;
            }
        } else {
            durFrag = ` for ${secs} ${secs === 1 ? 'second' : 'seconds'}`;
        }
    }

    // Format repetitions
    let repFrag = "";
    if (reps) {
        repFrag = ` ${reps} ${reps === 1 ? 'time' : 'times'}`;
    }


    return {
        text: `${pick.giver.name} must ${pick.act.verb} ${pick.receiver.name}${bodyFrag}${withFrag}${repFrag}${durFrag}.`,
        meta: { giver: pick.giver, receiver: pick.receiver, activity: pick.act.slug, bodyPart: part, tool: toolSlug, seconds: secs, repetitions: reps },
    };
}

// ── UI Components ────────────────────────────────────────────────────────────
function Section({ title, children }) {
    return (
        <div className="rounded-xl sm:rounded-2xl bg-zinc-900/40 border border-zinc-800 p-3 sm:p-4 lg:p-6 shadow-lg">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 text-zinc-100">{title}</h2>
            {children}
        </div>
    );
}


function Pill({ active, onClick, children }) {
    return (
        <button onClick={onClick} className={`px-2 sm:px-3 py-1 rounded-full border text-xs sm:text-sm transition-colors whitespace-nowrap ${active ? "bg-emerald-600 border-emerald-600 text-white" : "border-zinc-700 text-zinc-200 hover:bg-zinc-800"}`}>
            {children}
        </button>
    );
}

// ── Main App ────────────────────────────────────────────────────────────────────
export default function KinkDareApp() {
    const restored = useMemo(loadSession, []);
    const [sessionName, setSessionName] = useState(restored?.sessionName || "Private Session");
    const [players, setPlayers] = useState(restored?.players || []);
    const [consents, setConsents] = useState(restored?.consents || {}); // key: "a|b" => true
    const [prefs, setPrefs] = useState(restored?.prefs || {}); // { playerId: { activitySlug: "give|receive|both|nope" } }
    const [inventory, setInventory] = useState(restored?.inventory || []); // array of tool slugs
    const [permanent, setPermanent] = useState(defaultPermanent);
    const [step, setStep] = useState(restored?.step || 0);
    const [lastDare, setLastDare] = useState(null);
    const [error, setError] = useState("");
    const [noRepeatTurns, setNoRepeatTurns] = useState(restored?.noRepeatTurns ?? 10);
    const [dareHistory, setDareHistory] = useState(restored?.dareHistory || []); // array of dare signatures
    const [timers, setTimers] = useState(restored?.timers || []); // array of { id, dareText, totalSeconds, timeRemaining, isActive, isCurrent }

    // Fetch permanent data from Supabase if configured
    useEffect(() => {
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
                    activity_tools[row.activity_slug].push(row.tool_slug);
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
        saveSession({ sessionName, players, consents, prefs, inventory, step, noRepeatTurns, dareHistory, timers });
    }, [sessionName, players, consents, prefs, inventory, step, noRepeatTurns, dareHistory, timers]);

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
        if (step === 2) return players.every((p) => permanent.activities.every((a) => (prefs[p.id]?.[a.slug] ?? "nope") !== undefined));
        if (step === 3) return true; // inventory optional
        return true;
    };

    // Player CRUD
    const addPlayer = (name, gender, interests) => {
        const p = { id: uid(), name: name.trim(), gender, interests: [...interests] };
        setPlayers((ps) => [...ps, p]);
    };
    const removePlayer = (id) => {
        setPlayers((ps) => ps.filter((p) => p.id !== id));
        setConsents((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !k.startsWith(id + "|") && !k.endsWith("|" + id))));
        setPrefs((pf) => { const n = { ...pf }; delete n[id]; return n; });
    };

    const toggleConsent = (a, b) => setConsents((c) => ({ ...c, [`${a}|${b}`]: !c[`${a}|${b}`] }));

    const setAllConsentsForPlayer = (playerId, value) => {
        setConsents((c) => {
            const newConsents = { ...c };
            const player = players.find(p => p.id === playerId);
            if (!player) return c;

            players.forEach((other) => {
                if (other.id === playerId) return;
                // Check if combination is eligible based on interests
                const eligible = player.interests.some(i => other.interests.includes(i));
                if (eligible) {
                    newConsents[`${playerId}|${other.id}`] = value;
                }
            });
            return newConsents;
        });
    };

    const setPref = (pid, act, val) => setPrefs((pf) => ({ ...pf, [pid]: { ...(pf[pid] || {}), [act]: val } }));

    const setAllPrefsForPlayer = (playerId, value) => {
        setPrefs((pf) => {
            const newPrefs = { ...pf };
            newPrefs[playerId] = {};
            permanent.activities.forEach((activity) => {
                newPrefs[playerId][activity.slug] = value;
            });
            return newPrefs;
        });
    };


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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    };

    // ── UI ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                <header className="mb-4 sm:mb-6 lg:mb-8">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">Kink Dare — Private Session</h1>
                    <p className="text-zinc-400 text-xs sm:text-sm lg:text-base mt-1">Consent‑first, preference‑aware dares. Use a safeword and play nice.</p>
                </header>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <input value={sessionName} onChange={(e) => setSessionName(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 w-full text-sm sm:text-base" placeholder="Session name" />
                    <button onClick={resetSession} className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-sm sm:text-base whitespace-nowrap transition-colors">Reset</button>
                </div>

                <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4 sm:mb-6">
                    {[
                        "Players",
                        "Consents",
                        "Preferences",
                        "Inventory",
                        "Play",
                    ].map((label, i) => (
                        <button key={label} onClick={() => setStep(i)} className={`rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm border transition-colors ${step === i ? "bg-emerald-700 border-emerald-700 text-white" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}`}>{i + 1}. {label}</button>
                    ))}
                </nav>

                {step === 0 && (
                    <Section title="Players">
                        <AddPlayerForm onAdd={addPlayer} />
                        <ul className="mt-4 divide-y divide-zinc-800">
                            {players.map((p) => (
                                <li key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm sm:text-base truncate">{p.name} <span className="text-xs text-zinc-400">({p.gender})</span></div>
                                        <div className="text-xs text-zinc-400">interested in: {p.interests.join(", ") || "—"}</div>
                                    </div>
                                    <button onClick={() => removePlayer(p.id)} className="text-red-400 hover:text-red-300 text-xs sm:text-sm self-start sm:self-auto transition-colors">Remove</button>
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}

                {step === 1 && (
                    <Section title="Consents (mutual)">
                        {players.length < 2 ? <p className="text-zinc-400 text-sm">Add at least two players first.</p> : (
                            <div className="overflow-x-auto -mx-2 sm:mx-0">
                                <div className="inline-block min-w-full align-middle px-2 sm:px-0">
                                    <table className="min-w-full text-xs sm:text-sm">
                                        <thead>
                                            <tr>
                                                <th className="text-left p-1 sm:p-2 sticky left-0 bg-zinc-900/90 backdrop-blur-sm z-10"></th>
                                                {players.map(p => <th key={p.id} className="text-left p-1 sm:p-2 whitespace-nowrap">{p.name}</th>)}
                                                <th className="text-left p-1 sm:p-2 whitespace-nowrap">All</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {players.map((a) => (
                                                <tr key={a.id}>
                                                    <td className="p-1 sm:p-2 font-medium sticky left-0 bg-zinc-900/90 backdrop-blur-sm z-10 whitespace-nowrap">{a.name}</td>
                                                    {players.map((b) => (
                                                        <td key={b.id} className="p-1 sm:p-2">
                                                            {a.id === b.id ? <span className="text-zinc-600">—</span> : (
                                                                (a.interests.includes(b.gender)) ? (
                                                                    <button onClick={() => toggleConsent(a.id, b.id)} className={`px-2 py-1 rounded border text-xs transition-colors ${consents[`${a.id}|${b.id}`] ? "bg-emerald-700 border-emerald-600" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}`}>
                                                                        {consents[`${a.id}|${b.id}`] ? "Yes" : "No"}
                                                                    </button>
                                                                ) : <span className="text-zinc-600">n/a</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="p-1 sm:p-2">
                                                        <div className="flex gap-1">
                                                            <button onClick={() => setAllConsentsForPlayer(a.id, true)} className="px-2 py-1 rounded border text-xs bg-emerald-700 border-emerald-600 hover:bg-emerald-600 transition-colors">
                                                                Yes
                                                            </button>
                                                            <button onClick={() => setAllConsentsForPlayer(a.id, false)} className="px-2 py-1 rounded border text-xs bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors">
                                                                No
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </Section>
                )}

                {step === 2 && (
                    <Section title="Preferences by player & activity">
                        {players.length === 0 ? <p className="text-zinc-400 text-sm">Add players first.</p> : (
                            <div className="grid gap-4 sm:gap-6">
                                {players.map((p) => {
                                    // Check if all preferences for this player match a specific value
                                    const allPrefsMatch = (value) => {
                                        return permanent.activities.every((activity) => {
                                            const pref = prefs[p.id]?.[activity.slug] || "nope";
                                            return pref === value;
                                        });
                                    };

                                    return (
                                        <div key={p.id} className="border border-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                                <div className="font-semibold text-sm sm:text-base">{p.name}</div>
                                                <div className="flex gap-1 flex-wrap">
                                                    <button onClick={() => setAllPrefsForPlayer(p.id, "give")} className={`px-2 py-1 rounded border text-xs transition-colors ${allPrefsMatch("give") ? "bg-emerald-700 border-emerald-600 hover:bg-emerald-600" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}`}>
                                                        Give All
                                                    </button>
                                                    <button onClick={() => setAllPrefsForPlayer(p.id, "receive")} className={`px-2 py-1 rounded border text-xs transition-colors ${allPrefsMatch("receive") ? "bg-emerald-700 border-emerald-600 hover:bg-emerald-600" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}`}>
                                                        Receive All
                                                    </button>
                                                    <button onClick={() => setAllPrefsForPlayer(p.id, "both")} className={`px-2 py-1 rounded border text-xs transition-colors ${allPrefsMatch("both") ? "bg-emerald-700 border-emerald-600 hover:bg-emerald-600" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}`}>
                                                        Both All
                                                    </button>
                                                    <button onClick={() => setAllPrefsForPlayer(p.id, "nope")} className={`px-2 py-1 rounded border text-xs transition-colors ${allPrefsMatch("nope") ? "bg-emerald-700 border-emerald-600 hover:bg-emerald-600" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}`}>
                                                        Nope All
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {permanent.activities.map((a) => (
                                                    <div key={a.slug} className="space-y-2">
                                                        <div className="text-xs text-zinc-400 font-medium">{a.name}</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {[
                                                                ["nope", "Nope"],
                                                                ["give", "Give"],
                                                                ["receive", "Receive"],
                                                                ["both", "Both"],
                                                            ].map(([val, label]) => (
                                                                <Pill key={val} active={(prefs[p.id]?.[a.slug] || "nope") === val} onClick={() => setPref(p.id, a.slug, val)}>{label}</Pill>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Section>
                )}

                {step === 3 && (
                    <Section title="Inventory (available tools)">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {permanent.tools.map((t) => (
                                <label key={t.slug} className={`px-3 py-2 rounded-lg sm:rounded-xl border cursor-pointer text-sm transition-colors ${t.always_available ? "opacity-70" : ""} ${inventory.includes(t.slug) || t.always_available ? "bg-emerald-700 border-emerald-600" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"}`}>
                                    <input type="checkbox" className="hidden" disabled={t.always_available} checked={t.always_available || inventory.includes(t.slug)} onChange={() => toggleInventory(t.slug)} />
                                    <span className="block truncate">{t.name}{t.always_available ? " (always)" : ""}</span>
                                </label>
                            ))}
                        </div>
                    </Section>
                )}

                {step === 4 && (
                    <Section title="Play">
                        <div className="mb-4 pb-4 border-b border-zinc-800">
                            <label className="block text-xs sm:text-sm text-zinc-400 mb-2 font-medium">
                                No repeats within: <span className="text-emerald-400">{noRepeatTurns}</span> turns
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                value={noRepeatTurns}
                                onChange={(e) => setNoRepeatTurns(parseInt(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                <span>0 (off)</span>
                                <span>20</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <button onClick={spin} className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-base font-medium transition-colors">Spin</button>
                            <span className="text-zinc-400 text-xs sm:text-sm">Uses mutual consents, preferences, and inventory.</span>
                        </div>
                        {error && <div className="text-red-400 text-sm mb-3 p-3 bg-red-950/30 border border-red-900 rounded-lg">{error}</div>}
                        {lastDare && (
                            <div className="text-lg sm:text-xl lg:text-2xl font-semibold bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 leading-relaxed mb-4">
                                {lastDare.text}
                            </div>
                        )}
                        {timers.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-zinc-400">Active Timers</h3>
                                {[...timers].reverse().map((timer) => (
                                    <div key={timer.id} className={`bg-zinc-900 border rounded-xl p-4 sm:p-5 ${timer.isCurrent ? 'border-emerald-600' : 'border-zinc-800'}`}>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-zinc-500 mb-1">
                                                    {timer.isCurrent ? '✨ Current Dare' : 'Previous Dare'}
                                                </div>
                                                <div className="text-sm text-zinc-300 line-clamp-2">{timer.dareText}</div>
                                            </div>
                                            {!timer.isCurrent && (
                                                <button
                                                    onClick={() => removeTimer(timer.id)}
                                                    className="text-red-400 hover:text-red-300 text-xs transition-colors flex-shrink-0"
                                                    title="Remove timer"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <div className="text-center sm:text-left">
                                                <div className={`text-3xl sm:text-4xl font-bold font-mono transition-colors ${timer.timeRemaining === 0 ? 'text-emerald-400' :
                                                    timer.timeRemaining <= 10 && timer.isActive ? 'text-red-400' :
                                                        'text-zinc-100'
                                                    }`}>
                                                    {formatTime(timer.timeRemaining)}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!timer.isActive ? (
                                                    <button
                                                        onClick={() => startTimer(timer.id)}
                                                        disabled={timer.timeRemaining === 0}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                                                    >
                                                        Start
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => stopTimer(timer.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-xs font-medium transition-colors"
                                                    >
                                                        Pause
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => resetTimer(timer.id)}
                                                    className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium transition-colors"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        </div>
                                        {timer.timeRemaining === 0 && (
                                            <div className="mt-2 text-center text-emerald-400 text-xs font-medium">
                                                Time's up! 🎉
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {dareHistory.length > 0 && (
                            <div className="mt-4 text-xs text-zinc-500">
                                Total dares: {dareHistory.length}
                            </div>
                        )}
                    </Section>
                )}

                <div className="mt-4 sm:mt-6 flex justify-between gap-2">
                    <button disabled={step <= 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-colors">Back</button>
                    <button disabled={!canAdvance() || step >= 4} onClick={() => setStep((s) => Math.min(4, s + 1))} className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-colors">Next</button>
                </div>

                <footer className="mt-6 sm:mt-8 lg:mt-10 text-xs text-zinc-500 text-center">
                    Safety first: negotiate boundaries, safeword, aftercare.
                </footer>
            </div>
        </div>
    );
}

function AddPlayerForm({ onAdd }) {
    const [name, setName] = useState("");
    const [gender, setGender] = useState("M");
    const [interests, setInterests] = useState(["F"]);
    const canAdd = name.trim().length >= 1 && (gender === "M" || gender === "F") && interests.length >= 1;
    const toggleInterest = (g) => setInterests((arr) => arr.includes(g) ? arr.filter(x => x !== g) : [...arr, g]);
    const submit = () => { if (!canAdd) return; onAdd(name, gender, interests); setName(""); };
    return (
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-end gap-3">
            <div className="flex-1 sm:col-span-2 lg:col-span-1">
                <label className="block text-xs sm:text-sm text-zinc-400 mb-1 font-medium">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-shadow" placeholder="Player name" />
            </div>
            <div>
                <label className="block text-xs sm:text-sm text-zinc-400 mb-1 font-medium">Gender</label>
                <div className="flex gap-1 sm:gap-2">
                    {(["M", "F"]).map((g) => (
                        <Pill key={g} active={gender === g} onClick={() => setGender(g)}>{g}</Pill>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-xs sm:text-sm text-zinc-400 mb-1 font-medium">Interested in</label>
                <div className="flex gap-1 sm:gap-2">
                    {(["M", "F"]).map((g) => (
                        <Pill key={g} active={interests.includes(g)} onClick={() => toggleInterest(g)}>{g}</Pill>
                    ))}
                </div>
            </div>
            <button onClick={submit} disabled={!canAdd} className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium transition-colors">Add</button>
        </div>
    );
}