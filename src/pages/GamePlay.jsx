import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useGame } from "../context/GameContext";
import { Section } from "../components/UI";
import { phrase } from "../utils/gameLogic";

const DYNAMIC_SPIN_MS = 3000;
const STATIC_FADE_MS = 280;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const makeDynamic = (text, options = [], role = "dynamic") => ({
    type: "dynamic",
    text,
    options: options.length ? options : [text],
    duration: DYNAMIC_SPIN_MS,
    role,
});

const makeStatic = (text, isVariable = false) => ({ type: "static", text, duration: STATIC_FADE_MS, isVariable });

const fmtDurationParts = (seconds) => {
    if (seconds >= 60) {
        const mins = Math.floor(seconds / 60);
        const remainingSecs = seconds % 60;
        return { mins, remainingSecs };
    }
    return { secs: seconds };
};

const buildNumberOptions = (min, max) => {
    if (!min || !max) return [];
    if (max - min <= 6) {
        return Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
    }
    const mid = Math.floor((min + max) / 2);
    return [min, min + 1, mid, max - 1, max].map((n) => String(n));
};

const buildTokens = (dare, players, permanent, consents = {}, prefs = {}, inventory = []) => {
    if (!dare) return [];
    const { meta } = dare;
    const act = permanent.activities.find((a) => a.slug === meta.activity) || {};
    const tool = meta.tool ? permanent.tools.find((t) => t.slug === meta.tool) : null;
    const body = meta.bodyPart ? permanent.body_parts.find((b) => b.slug === meta.bodyPart) : null;

    const tokens = [];

    // Options for Giver (all players)
    const playerOptions = players.map((p) => p.name);

    // Options for Verb (all activities)
    const verbOptions = permanent.activities.map((a) => a.verb);

    // Options for Receiver (filtered by consent and prefs)
    const giverId = meta.giver.id;
    const validReceivers = players.filter(p => {
        if (p.id === giverId) return false;
        const consentAB = consents[`${giverId}|${p.id}`];
        const consentBA = consents[`${p.id}|${giverId}`];
        if (!consentAB || !consentBA) return false;
        const pR = prefs[p.id]?.[meta.activity] || "nope";
        return pR === "receive" || pR === "both";
    });
    const receiverOptions = validReceivers.map(p => p.name);

    // Options for Body Part (filtered by activity and gender)
    const allowedBodyParts = permanent.activity_body_parts?.[meta.activity] || act.default_targets || [];
    const validBodyParts = allowedBodyParts
        .map(slug => permanent.body_parts.find(b => b.slug === slug))
        .filter(b => b && (b.genders.includes(meta.receiver.gender) || b.genders.includes("Any")));
    const bodyOptions = validBodyParts.map(b => b.name);

    // Options for Tool (filtered by activity and inventory)
    const allowedToolSlugs = permanent.activity_tools?.[meta.activity] || permanent.tools.filter(t => t.allowed_activities?.includes(meta.activity)).map(t => t.slug);
    const inventorySet = new Set([...(inventory || []), ...permanent.tools.filter(t => t.always_available).map(t => t.slug)]);
    const validTools = allowedToolSlugs
        .filter(slug => inventorySet.has(slug))
        .map(slug => permanent.tools.find(t => t.slug === slug))
        .filter(t => t);
    const toolOptions = validTools.map(t => t.name);

    tokens.push(makeDynamic(meta.giver.name, playerOptions, "giver"));
    tokens.push(makeStatic("must"));
    tokens.push(makeDynamic(act.verb || "do", verbOptions, "verb"));

    if (receiverOptions.length <= 1) {
        tokens.push(makeStatic(meta.receiver.name, true));
    } else {
        tokens.push(makeDynamic(meta.receiver.name, receiverOptions, "receiver"));
    }

    if (meta.bodyPart && body) {
        const bodyPhrase = phrase(meta.activity, meta.bodyPart);
        const bodyName = body.name;
        let prep = (act.preposition || "on the").trim();
        if (bodyPhrase && bodyName) {
            const lowerPhrase = bodyPhrase.toLowerCase();
            const lowerName = bodyName.toLowerCase();
            const idx = lowerPhrase.lastIndexOf(lowerName);
            if (idx > 0) {
                prep = bodyPhrase.slice(0, idx).trim();
            }
        }
        tokens.push(makeStatic(prep));

        if (bodyOptions.length <= 1) {
            tokens.push(makeStatic(bodyName, true));
        } else {
            tokens.push(makeDynamic(bodyName, bodyOptions, "body"));
        }
    }

    if (tool && !tool.implicit) {
        tokens.push(makeStatic(act.with_word || "with"));
        if (tool.name === "hand") {
            tokens.push(makeStatic("their"));
        }

        if (toolOptions.length <= 1) {
            tokens.push(makeStatic(tool.name, true));
        } else {
            tokens.push(makeDynamic(tool.name, toolOptions, "tool"));
        }
    }

    if (meta.repetitions) {
        const actDef = permanent.activities.find((a) => a.slug === meta.activity);
        const repOpts = buildNumberOptions(actDef?.min_reps || meta.repetitions, actDef?.max_reps || meta.repetitions);
        tokens.push(makeDynamic(String(meta.repetitions), repOpts, "reps"));
        tokens.push(makeStatic(meta.repetitions === 1 ? "time" : "times"));
    }

    if (meta.seconds) {
        const actDef = permanent.activities.find((a) => a.slug === meta.activity);
        const durOpts = buildNumberOptions(actDef?.min_seconds || meta.seconds, actDef?.max_seconds || meta.seconds);
        tokens.push(makeStatic("for"));
        const durParts = fmtDurationParts(meta.seconds);
        if (durParts.mins) {
            tokens.push(makeDynamic(String(durParts.mins), durOpts, "minutes"));
            tokens.push(makeStatic(durParts.mins === 1 ? "minute" : "minutes"));
            if (durParts.remainingSecs) {
                tokens.push(makeStatic("and"));
                tokens.push(makeDynamic(String(durParts.remainingSecs), durOpts, "seconds"));
                tokens.push(makeStatic(durParts.remainingSecs === 1 ? "second" : "seconds"));
            }
        } else if (durParts.secs !== undefined) {
            tokens.push(makeDynamic(String(durParts.secs), durOpts, "seconds"));
            tokens.push(makeStatic(durParts.secs === 1 ? "second" : "seconds"));
        }
    }

    tokens.push(makeStatic("."));
    return tokens;
};

export default function GamePlay() {
    const {
        spin, lastDare, error,
        noRepeatTurns, setNoRepeatTurns,
        dareHistory,
        timers, startTimer, stopTimer, resetTimer, removeTimer,
        players, permanent, consents, prefs, inventory,
    } = useGame();

    const [animationComplete, setAnimationComplete] = useState(false);

    const handleSpin = () => {
        setAnimationComplete(false);
        spin();
    };

    const handleAnimationComplete = useCallback(() => {
        setAnimationComplete(true);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Section title="Play">
            <div className="flex flex-col items-center gap-6 mb-8">
                <button
                    onClick={handleSpin}
                    className="w-full sm:w-auto px-12 py-6 rounded-none bg-gradient-to-b from-crimson-800 to-crimson-900 hover:from-crimson-700 hover:to-crimson-800 text-white text-2xl font-display font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(220,20,60,0.4)] hover:shadow-[0_0_40px_rgba(220,20,60,0.6)] border border-crimson-500/50 active:scale-95"
                >
                    Spin
                </button>
                <span className="text-zinc-500 text-xs uppercase tracking-wider opacity-70">Uses mutual consents, preferences, and inventory.</span>
            </div>
            {error && <div className="text-red-400 text-sm mb-4 p-4 bg-red-950/20 border border-red-900/50 rounded-none uppercase tracking-wide">{error}</div>}
            {lastDare && (
                <div className="text-xl sm:text-2xl lg:text-3xl font-serif bg-dark-elevated border border-crimson-900/30 rounded-none p-6 sm:p-8 leading-relaxed mb-6 shadow-inner text-zinc-200">
                    <AnimatedDareText
                        dare={lastDare}
                        players={players}
                        permanent={permanent}
                        consents={consents}
                        prefs={prefs}
                        inventory={inventory}
                        onComplete={handleAnimationComplete}
                    />
                </div>
            )}
            {timers.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-crimson-500 uppercase tracking-widest border-b border-crimson-900/20 pb-2">Active Timers</h3>
                    {[...timers].reverse().map((timer) => {
                        if (timer.isCurrent && !animationComplete) return null;
                        return (
                            <div key={timer.id} className={`bg-dark-elevated border rounded-none p-4 sm:p-6 transition-all ${timer.isCurrent ? 'border-crimson-600 shadow-[0_0_10px_rgba(220,20,60,0.1)]' : 'border-zinc-800'}`}>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-crimson-400 mb-1 uppercase tracking-widest font-bold">
                                            {timer.isCurrent ? 'Current Dare' : 'Previous Dare'}
                                        </div>
                                        <div className="text-sm text-zinc-400 line-clamp-2 font-serif italic">{timer.dareText}</div>
                                    </div>
                                    {!timer.isCurrent && (
                                        <button
                                            onClick={() => removeTimer(timer.id)}
                                            className="text-zinc-600 hover:text-crimson-500 text-lg transition-colors flex-shrink-0"
                                            title="Remove timer"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-center sm:text-left">
                                        <div className={`text-4xl sm:text-5xl font-bold font-mono transition-colors ${timer.timeRemaining === 0 ? 'text-crimson-500' :
                                            timer.timeRemaining <= 10 && timer.isActive ? 'text-red-500 animate-pulse' :
                                                'text-zinc-200'
                                            }`}>
                                            {formatTime(timer.timeRemaining)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!timer.isActive ? (
                                            <button
                                                onClick={() => startTimer(timer.id)}
                                                disabled={timer.timeRemaining === 0}
                                                className="px-4 py-2 rounded-none bg-crimson-900/60 hover:bg-crimson-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider transition-colors border border-crimson-800"
                                            >
                                                Start
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => stopTimer(timer.id)}
                                                className="px-4 py-2 rounded-none bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 text-xs font-bold uppercase tracking-wider transition-colors border border-amber-900/50"
                                            >
                                                Pause
                                            </button>
                                        )}
                                        <button
                                            onClick={() => resetTimer(timer.id)}
                                            className="px-4 py-2 rounded-none border border-zinc-700 hover:border-crimson-900 hover:text-crimson-400 text-zinc-400 text-xs font-bold uppercase tracking-wider transition-colors"
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
                        );
                    })}
                </div>
            )}
            {dareHistory.length > 0 && (
                <div className="mt-4 text-xs text-zinc-500">
                    Total dares: {dareHistory.length}
                </div>
            )}
        </Section>
    );
}

function AnimatedDareText({ dare, players, permanent, consents, prefs, inventory, onComplete }) {
    const tokens = useMemo(() => buildTokens(dare, players, permanent, consents, prefs, inventory), [dare, players, permanent, consents, prefs, inventory]);
    const [visibleTokens, setVisibleTokens] = useState([]);
    const [seqId, setSeqId] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setVisibleTokens([]);
        setSeqId(s => s + 1);
        if (!dare) return undefined;

        async function runSequence() {
            for (let i = 0; i < tokens.length; i++) {
                if (cancelled) return;
                const token = tokens[i];
                const tokensToAdd = [token];
                let skipNext = false;

                // For numeric spinners, show the unit immediately with the spinner
                if (["reps", "minutes", "seconds"].includes(token.role)) {
                    if (i + 1 < tokens.length && tokens[i + 1].type === "static") {
                        tokensToAdd.push(tokens[i + 1]);
                        skipNext = true;
                    }
                }

                setVisibleTokens((prev) => [...prev, ...tokensToAdd]);

                if (skipNext) i++;
                await sleep(token.duration);
            }
            if (!cancelled && onComplete) onComplete();
        }

        runSequence();
        return () => { cancelled = true; };
    }, [dare, tokens, onComplete]);

    if (!dare) return null;

    return (
        <div className="flex flex-wrap items-center gap-y-2 leading-snug">
            {visibleTokens.map((token, idx) => {
                const needsSpace = idx !== 0 && token.text !== ".";
                return (
                    <span key={`${seqId}-${token.type}-${token.text}-${idx}`} className="inline-flex items-center">
                        {needsSpace && <span className="select-none">&nbsp;</span>}
                        {token.type === "static" ? (
                            <StaticToken token={token} />
                        ) : (
                            <SpinnerToken token={token} />
                        )}
                    </span>
                );
            })}
        </div>
    );
}

function StaticToken({ token }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setShow(true), 50);
        return () => clearTimeout(t);
    }, []);

    return (
        <span
            className={`inline-block transition-opacity ease-out ${token.isVariable ? 'text-crimson-400' : ''}`}
            style={{
                opacity: show ? 1 : 0,
                transitionDuration: `${token.duration}ms`
            }}
        >
            {token.text}
        </span>
    );
}

function SpinnerToken({ token }) {
    const { options = [], text, role } = token;

    const sequence = useMemo(() => {
        const count = 12;

        // Handle numeric roles with sequential logic
        if (["reps", "minutes", "seconds"].includes(role)) {
            const targetNum = parseInt(text, 10);
            if (!isNaN(targetNum)) {
                const seq = [];
                if (targetNum > count) {
                    // Ascending to target
                    for (let i = 0; i < count; i++) {
                        seq.push(String(targetNum - (count - 1) + i));
                    }
                } else {
                    // Descending to target
                    for (let i = 0; i < count; i++) {
                        seq.push(String(targetNum + (count - 1) - i));
                    }
                }
                return seq;
            }
        }

        if (!options.length) return [text];

        let targetIndex = options.indexOf(text);
        const safeTargetIndex = targetIndex === -1 ? 0 : targetIndex;

        const seq = [];
        const len = options.length;

        for (let i = 0; i < count; i++) {
            let idx = (safeTargetIndex - (count - 1) + i) % len;
            if (idx < 0) idx += len;
            seq.push(options[idx]);
        }

        if (targetIndex === -1) {
            seq[count - 1] = text;
        }

        return seq;
    }, [options, text, role]);

    const longestText = useMemo(() => {
        return sequence.reduce((a, b) => a.length > b.length ? a : b, text);
    }, [sequence, text]);

    const [offset, setOffset] = useState(0);
    const [isSpinning, setIsSpinning] = useState(true);

    useEffect(() => {
        setIsSpinning(true);
        const t = requestAnimationFrame(() => {
            setOffset(sequence.length - 1);
        });

        const timer = setTimeout(() => {
            setIsSpinning(false);
        }, token.duration);

        return () => {
            cancelAnimationFrame(t);
            clearTimeout(timer);
        };
    }, [sequence, token.duration]);

    const widthClass = role === "minutes" || role === "seconds" || role === "reps" ? "min-w-[2.75ch]" : "min-w-[3.5ch]";

    const [show, setShow] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setShow(true), 50);
        return () => clearTimeout(t);
    }, []);

    return (
        <span
            className={`relative inline-flex h-8 items-center justify-center overflow-hidden align-middle ${widthClass} text-crimson-400 transition-all duration-500 ease-out`}
            style={{ opacity: show ? 1 : 0 }}
        >
            <div
                className="flex flex-col items-center absolute left-0 right-0 top-0"
                style={{
                    transform: `translateY(calc(-${offset} * 3rem - 0.5rem))`,
                    transition: `transform ${token.duration}ms cubic-bezier(0.39, 0.575, 0.565, 1)`
                }}
            >
                {sequence.map((item, i) => (
                    <span key={i} className="h-12 flex items-center justify-center whitespace-nowrap w-full">
                        {item}
                    </span>
                ))}
            </div>
            <span className="invisible h-8 flex items-center whitespace-nowrap">{isSpinning ? longestText : text}</span>
        </span>
    );
}
