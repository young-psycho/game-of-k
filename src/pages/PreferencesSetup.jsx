import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";
import { ChevronRight, ChevronLeft, Check, X, ArrowRight, Heart, Shield } from "lucide-react";

export default function PreferencesSetup() {
    const { players, prefs, updatePlayerPref, permanent, consents, toggleConsent, setAllConsentsForPlayer, wizardState, setWizardState, setNavOverride } = useGame();

    // State Machine
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(wizardState?.currentPlayerIndex || 0);
    const [step, setStep] = useState(wizardState?.step || 'CONSENT'); // 'CONSENT' | 'ACTIVITY' | 'FINISHED'
    const [activityIndex, setActivityIndex] = useState(wizardState?.activityIndex || 0);
    const [subStep, setSubStep] = useState(wizardState?.subStep || 'GIVE_ASK'); // 'GIVE_ASK' | 'GIVE_DETAILS' | 'RECEIVE_ASK' | 'RECEIVE_DETAILS'
    const [detailStep, setDetailStep] = useState(wizardState?.detailStep || 'TARGETS'); // 'TARGETS' | 'TOOLS' | 'TOOL_CONSTRAINTS'
    const [currentToolIndex, setCurrentToolIndex] = useState(wizardState?.currentToolIndex || 0);
    const [animating, setAnimating] = useState(false);

    // Sync state to context for persistence
    useEffect(() => {
        setWizardState({
            currentPlayerIndex,
            step,
            activityIndex,
            subStep,
            detailStep,
            currentToolIndex
        });
    }, [currentPlayerIndex, step, activityIndex, subStep, detailStep, currentToolIndex, setWizardState]);

    // Validate restored state against current data
    useEffect(() => {
        if (players.length > 0 && currentPlayerIndex >= players.length) {
            setCurrentPlayerIndex(0);
            setStep('CONSENT');
        }
        if (permanent.activities.length > 0 && activityIndex >= permanent.activities.length) {
            setActivityIndex(0);
        }
    }, [players.length, permanent.activities.length, currentPlayerIndex, activityIndex]);

    const currentPlayer = players[currentPlayerIndex] || players[0];
    const currentActivity = permanent.activities[activityIndex] || permanent.activities[0];

    // Helper to trigger animation
    const transition = (callback) => {
        setAnimating(true);
        setTimeout(() => {
            callback();
            setAnimating(false);
        }, 300);
    };

    const determineLastDetailStep = (type, activity, playerId) => {
        const pPref = prefs[playerId]?.[activity.slug];
        const hasTargets = activity.has_body_part;
        const hasTools = activity.has_tools !== false;
        const isEnforced = activity.enforced_targets?.length > 0 || activity.enforce_default_targets;
        const player = players.find(p => p.id === playerId);

        const availableTools = hasTools ? [
            ...permanent.tools.filter(t => t.allowed_activities?.includes(activity.slug)),
            ...permanent.body_parts.filter(b => b.is_actor && b.allowed_activities?.includes(activity.slug) && (type === 'give' ? (b.genders.includes(player.gender) || b.genders.includes("Any")) : true))
        ] : [];

        const hasToolsStep = availableTools.length > 0;
        const hasSelectedTools = pPref?.[type]?.tools?.length > 0;

        if (hasSelectedTools && hasTargets && !isEnforced) {
            return { step: 'TOOL_CONSTRAINTS', toolIndex: 0 };
        }
        if (hasToolsStep) {
            return { step: 'TOOLS' };
        }
        if (hasTargets && !isEnforced) {
            return { step: 'TARGETS' };
        }
        return null;
    };

    const back = () => {
        transition(() => {
            // 1. Handle SubStep: TOOL_CONSTRAINTS
            if (subStep.includes('_DETAILS') && detailStep === 'TOOL_CONSTRAINTS') {
                setDetailStep('TOOLS');
                return;
            }

            // 2. Handle SubStep: TOOLS
            if (subStep.includes('_DETAILS') && detailStep === 'TOOLS') {
                const isEnforced = currentActivity.enforced_targets?.length > 0 || currentActivity.enforce_default_targets;
                if (currentActivity.has_body_part && !isEnforced) {
                    setDetailStep('TARGETS');
                } else {
                    // If no targets, we came from ASK
                    if (subStep === 'GIVE_DETAILS') setSubStep('GIVE_ASK');
                    else setSubStep('RECEIVE_ASK');
                }
                return;
            }

            // 3. Handle SubStep: TARGETS
            if (subStep.includes('_DETAILS') && detailStep === 'TARGETS') {
                if (subStep === 'GIVE_DETAILS') setSubStep('GIVE_ASK');
                else setSubStep('RECEIVE_ASK');
                return;
            }

            // 4. Handle RECEIVE_ASK
            if (subStep === 'RECEIVE_ASK') {
                const pPref = prefs[currentPlayer.id]?.[currentActivity.slug];
                if (pPref?.give?.enabled) {
                    const result = determineLastDetailStep('give', currentActivity, currentPlayer.id);
                    if (result) {
                        setSubStep('GIVE_DETAILS');
                        setDetailStep(result.step);
                        if (result.toolIndex !== undefined) setCurrentToolIndex(result.toolIndex);
                    } else {
                        setSubStep('GIVE_ASK');
                    }
                } else {
                    setSubStep('GIVE_ASK');
                }
                return;
            }

            // 5. Handle GIVE_ASK
            if (subStep === 'GIVE_ASK') {
                if (activityIndex > 0) {
                    const prevActIndex = activityIndex - 1;
                    setActivityIndex(prevActIndex);
                    const prevAct = permanent.activities[prevActIndex];
                    const pPref = prefs[currentPlayer.id]?.[prevAct.slug];

                    if (pPref?.receive?.enabled) {
                        const result = determineLastDetailStep('receive', prevAct, currentPlayer.id);
                        if (result) {
                            setSubStep('RECEIVE_DETAILS');
                            setDetailStep(result.step);
                            if (result.toolIndex !== undefined) setCurrentToolIndex(result.toolIndex);
                        } else {
                            setSubStep('RECEIVE_ASK');
                        }
                    } else {
                        setSubStep('RECEIVE_ASK');
                    }
                } else {
                    setStep('CONSENT');
                }
                return;
            }

            // 6. Handle CONSENT
            if (step === 'CONSENT') {
                if (currentPlayerIndex > 0) {
                    const prevIdx = currentPlayerIndex - 1;
                    setCurrentPlayerIndex(prevIdx);
                    const lastActIndex = permanent.activities.length - 1;
                    setStep('ACTIVITY');
                    setActivityIndex(lastActIndex);

                    const lastAct = permanent.activities[lastActIndex];
                    const prevPlayerId = players[prevIdx].id;
                    const pPref = prefs[prevPlayerId]?.[lastAct.slug];

                    if (pPref?.receive?.enabled) {
                        const result = determineLastDetailStep('receive', lastAct, prevPlayerId);
                        if (result) {
                            setSubStep('RECEIVE_DETAILS');
                            setDetailStep(result.step);
                            if (result.toolIndex !== undefined) setCurrentToolIndex(result.toolIndex);
                        } else {
                            setSubStep('RECEIVE_ASK');
                        }
                    } else {
                        setSubStep('RECEIVE_ASK');
                    }
                }
                return;
            }

            // 7. Handle FINISHED
            if (step === 'FINISHED') {
                const lastIdx = players.length - 1;
                setCurrentPlayerIndex(lastIdx);
                const lastActIndex = permanent.activities.length - 1;
                setStep('ACTIVITY');
                setActivityIndex(lastActIndex);

                const lastAct = permanent.activities[lastActIndex];
                const lastPlayerId = players[lastIdx].id;
                const pPref = prefs[lastPlayerId]?.[lastAct.slug];

                if (pPref?.receive?.enabled) {
                    const result = determineLastDetailStep('receive', lastAct, lastPlayerId);
                    if (result) {
                        setSubStep('RECEIVE_DETAILS');
                        setDetailStep(result.step);
                        if (result.toolIndex !== undefined) setCurrentToolIndex(result.toolIndex);
                    } else {
                        setSubStep('RECEIVE_ASK');
                    }
                } else {
                    setSubStep('RECEIVE_ASK');
                }
            }
        });
    };

    // Navigation Logic
    const next = (overrideState = null) => {
        transition(() => {
            if (step === 'CONSENT') {
                if (permanent.activities.length > 0) {
                    setStep('ACTIVITY');
                    setActivityIndex(0);
                    setSubStep('GIVE_ASK');
                } else {
                    nextPlayer();
                }
                return;
            }

            if (step === 'ACTIVITY') {
                handleActivityFlow(overrideState);
            }
        });
    };

    const handleActivityFlow = (overrideState = null) => {
        const act = currentActivity;
        let pPref = prefs[currentPlayer.id]?.[act.slug] || { give: { enabled: false, tools: [], targets: [] }, receive: { enabled: false, tools: [], targets: [] } };

        if (overrideState) {
            if (overrideState.type === 'give') {
                pPref = { ...pPref, give: { ...pPref.give, enabled: overrideState.enabled } };
            } else if (overrideState.type === 'receive') {
                pPref = { ...pPref, receive: { ...pPref.receive, enabled: overrideState.enabled } };
            }
        }

        // Helper to check if we have tools/targets
        const hasTargets = act.has_body_part;
        const hasTools = act.has_tools !== false;
        const givingTools = hasTools ? [
            ...permanent.tools.filter(t => t.allowed_activities?.includes(act.slug)),
            ...permanent.body_parts.filter(b => b.is_actor && b.allowed_activities?.includes(act.slug) && (b.genders.includes(currentPlayer.gender) || b.genders.includes("Any")))
        ] : [];
        const receivingTools = hasTools ? [
            ...permanent.tools.filter(t => t.allowed_activities?.includes(act.slug)),
            ...permanent.body_parts.filter(b => b.is_actor && b.allowed_activities?.includes(act.slug))
        ] : [];

        const isEnforced = act.enforced_targets?.length > 0 || act.enforce_default_targets;

        // GIVE FLOW
        if (subStep === 'GIVE_ASK') {
            if (pPref.give.enabled && overrideState) {
                setSubStep('GIVE_DETAILS');
                if (hasTargets && !isEnforced) setDetailStep('TARGETS');
                else if (givingTools.length > 0) setDetailStep('TOOLS');
                else setSubStep('RECEIVE_ASK'); // Nothing to configure
            } else {
                setSubStep('RECEIVE_ASK');
            }
            return;
        }

        if (subStep === 'GIVE_DETAILS') {
            if (detailStep === 'TARGETS') {
                if (givingTools.length > 0) setDetailStep('TOOLS');
                else setSubStep('RECEIVE_ASK');
            } else if (detailStep === 'TOOLS') {
                const isEnforced = act.enforced_targets?.length > 0 || act.enforce_default_targets;
                if (hasTargets && hasTools && pPref.give.tools.length > 0 && !isEnforced) {
                    setDetailStep('TOOL_CONSTRAINTS');
                    setCurrentToolIndex(0);
                } else {
                    setSubStep('RECEIVE_ASK');
                }
            } else if (detailStep === 'TOOL_CONSTRAINTS') {
                setSubStep('RECEIVE_ASK');
            }
            return;
        }

        // RECEIVE FLOW
        if (subStep === 'RECEIVE_ASK') {
            if (pPref.receive.enabled && overrideState) {
                setSubStep('RECEIVE_DETAILS');
                if (hasTargets && !isEnforced) setDetailStep('TARGETS');
                else if (receivingTools.length > 0) setDetailStep('TOOLS');
                else nextActivity(); // Nothing to configure
            } else {
                nextActivity();
            }
            return;
        }

        if (subStep === 'RECEIVE_DETAILS') {
            if (detailStep === 'TARGETS') {
                if (receivingTools.length > 0) setDetailStep('TOOLS');
                else nextActivity();
            } else if (detailStep === 'TOOLS') {
                const isEnforced = act.enforced_targets?.length > 0 || act.enforce_default_targets;
                if (hasTargets && hasTools && pPref.receive.tools.length > 0 && !isEnforced) {
                    setDetailStep('TOOL_CONSTRAINTS');
                    setCurrentToolIndex(0);
                } else {
                    nextActivity();
                }
            } else if (detailStep === 'TOOL_CONSTRAINTS') {
                nextActivity();
            }
            return;
        }
    };

    const nextActivity = () => {
        if (activityIndex < permanent.activities.length - 1) {
            setActivityIndex(prev => prev + 1);
            setSubStep('GIVE_ASK');
        } else {
            nextPlayer();
        }
    };

    const nextPlayer = () => {
        if (currentPlayerIndex < players.length - 1) {
            setCurrentPlayerIndex(prev => prev + 1);
            setStep('CONSENT');
        } else {
            setStep('FINISHED');
        }
    };

    // Refs for stable callbacks to avoid infinite loop in useEffect
    const backRef = useRef(back);
    const nextRef = useRef(next);

    useEffect(() => {
        backRef.current = back;
        nextRef.current = next;
    });

    // Navigation Override for Layout
    useEffect(() => {
        const canGoBack = (step !== 'CONSENT' || currentPlayerIndex > 0);
        const canGoNext = step !== 'FINISHED';

        setNavOverride({
            onBack: canGoBack ? () => backRef.current() : null,
            onNext: canGoNext ? (arg) => nextRef.current(arg) : null,
            backLabel: "Back",
            nextLabel: step === 'CONSENT' ? "Start" : "Next"
        });

        return () => setNavOverride(null);
    }, [step, subStep, currentPlayerIndex, setNavOverride]);

    if (players.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500 uppercase tracking-widest">
                Add players first
            </div>
        );
    }

    if (step === 'FINISHED') {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                <div className="text-4xl font-bold text-crimson-500 font-display uppercase tracking-widest mb-4">All Done</div>
                <p className="text-zinc-400 mb-8">Preferences have been set for all players.</p>
            </div>
        );
    }

    // Progress Calculation
    const totalSteps = 1 + permanent.activities.length; // Consent + Activities
    const currentProgress = step === 'CONSENT' ? 0 : 1 + activityIndex;
    const progressPercent = (currentProgress / totalSteps) * 100;

    return (
        <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Configuring Player</div>
                <h2 className="text-3xl font-bold text-crimson-500 font-display uppercase tracking-widest mb-6">{currentPlayer.name}</h2>

                {/* Progress Bar */}
                <div className="h-1 bg-zinc-800 w-full rounded-full overflow-hidden">
                    <div
                        className="h-full bg-crimson-600 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 flex flex-col relative ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'} transition-all duration-300`}>

                {step === 'CONSENT' && (
                    <div className="flex-1 flex flex-col">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => nextPlayer()}
                                className="text-xs text-zinc-500 hover:text-crimson-400 uppercase tracking-wider border border-zinc-800 px-3 py-1 hover:border-crimson-900 transition-colors"
                            >
                                Skip Questionnaire
                            </button>
                        </div>

                        <h3 className="text-xl text-zinc-300 font-bold uppercase tracking-wider mb-6 text-center">Who do you want to play with?</h3>

                        <div className="flex justify-center gap-4 mb-8">
                            <button onClick={(e) => { e.stopPropagation(); setAllConsentsForPlayer(currentPlayer.id, true); }} className="text-xs text-zinc-500 hover:text-crimson-400 uppercase tracking-wider border border-zinc-800 px-3 py-1 hover:border-crimson-900">Select All</button>
                            <button onClick={(e) => { e.stopPropagation(); setAllConsentsForPlayer(currentPlayer.id, false); }} className="text-xs text-zinc-500 hover:text-crimson-400 uppercase tracking-wider border border-zinc-800 px-3 py-1 hover:border-crimson-900">Select None</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
                            {players.filter(p => p.id !== currentPlayer.id).map(other => (
                                <label key={other.id} onClick={(e) => e.stopPropagation()} className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${consents[`${currentPlayer.id}|${other.id}`] ? 'bg-crimson-900/20 border-crimson-500/50' : 'bg-dark-elevated border-zinc-800 hover:border-zinc-600'}`}>
                                    <span className={`font-bold uppercase tracking-wider ${consents[`${currentPlayer.id}|${other.id}`] ? 'text-crimson-200' : 'text-zinc-400'}`}>{other.name}</span>
                                    <div className={`w-6 h-6 border flex items-center justify-center ${consents[`${currentPlayer.id}|${other.id}`] ? 'bg-crimson-600 border-crimson-600 text-white' : 'border-zinc-600'}`}>
                                        {consents[`${currentPlayer.id}|${other.id}`] && <Check className="w-4 h-4" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={!!consents[`${currentPlayer.id}|${other.id}`]}
                                        onChange={() => toggleConsent(currentPlayer.id, other.id)}
                                    />
                                </label>
                            ))}
                            {players.length <= 1 && <p className="text-center text-zinc-500 italic col-span-full">No other players available.</p>}
                        </div>
                    </div>
                )}

                {step === 'ACTIVITY' && (
                    <div className="flex-1 flex flex-col">
                        <div className="text-center mb-8">
                            <div className="text-sm text-zinc-500 uppercase tracking-widest mb-1">Activity {activityIndex + 1} / {permanent.activities.length}</div>
                            <h3 className="text-2xl text-zinc-200 font-bold uppercase tracking-wider">{currentActivity.name}</h3>
                        </div>

                        {/* GIVE ASK */}
                        {subStep === 'GIVE_ASK' && (
                            <div className="flex flex-col items-center justify-center flex-1 relative">
                                <p className="text-xl text-zinc-300 mb-8 text-center max-w-md">
                                    Do you like <span className="text-crimson-400 font-bold">{currentActivity.giving_text || `to ${currentActivity.verb}`}</span>?
                                </p>
                                <div className="flex gap-6">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updatePlayerPref(currentPlayer.id, currentActivity.slug, 'give', 'enabled', false);
                                            next();
                                        }}
                                        className="w-32 py-4 bg-dark-elevated border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 uppercase tracking-widest font-bold transition-all"
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updatePlayerPref(currentPlayer.id, currentActivity.slug, 'give', 'enabled', true);
                                            next({ type: 'give', enabled: true });
                                        }}
                                        className="w-32 py-4 bg-dark-elevated border border-zinc-700 hover:border-crimson-500 hover:bg-crimson-900/20 text-zinc-300 hover:text-crimson-200 uppercase tracking-widest font-bold transition-all"
                                    >
                                        Yes
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* RECEIVE ASK */}
                        {subStep === 'RECEIVE_ASK' && (
                            <div className="flex flex-col items-center justify-center flex-1 relative">
                                <p className="text-xl text-zinc-300 mb-8 text-center max-w-md">
                                    Do you like to <span className="text-crimson-400 font-bold">{currentActivity.receiving_text || `be ${currentActivity.name.toLowerCase()}ed`}</span>?
                                </p>
                                <div className="flex gap-6">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updatePlayerPref(currentPlayer.id, currentActivity.slug, 'receive', 'enabled', false);
                                            next();
                                        }}
                                        className="w-32 py-4 bg-dark-elevated border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 uppercase tracking-widest font-bold transition-all"
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updatePlayerPref(currentPlayer.id, currentActivity.slug, 'receive', 'enabled', true);
                                            next({ type: 'receive', enabled: true });
                                        }}
                                        className="w-32 py-4 bg-dark-elevated border border-zinc-700 hover:border-crimson-500 hover:bg-crimson-900/20 text-zinc-300 hover:text-crimson-200 uppercase tracking-widest font-bold transition-all"
                                    >
                                        Yes
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* DETAILS (GIVE/RECEIVE) */}
                        {(subStep === 'GIVE_DETAILS' || subStep === 'RECEIVE_DETAILS') && (
                            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                                {detailStep === 'TARGETS' && (
                                    <div className="flex flex-col items-center justify-center flex-1 relative">
                                        <p className="text-xl text-zinc-300 mb-8 text-center max-w-md">
                                            Where do you like <span className="text-crimson-400 font-bold">{subStep === 'GIVE_DETAILS' ? (currentActivity.giving_text || `to ${currentActivity.verb}`) : (currentActivity.receiving_text || `be ${currentActivity.name.toLowerCase()}ed`)}</span>?
                                        </p>

                                        <div className="flex justify-center gap-4 mb-6">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const type = subStep === 'GIVE_DETAILS' ? 'give' : 'receive';
                                                    const available = permanent.body_parts.filter(bp => {
                                                        if (currentActivity.restrict_to_default_targets) {
                                                            if (!currentActivity.default_targets?.includes(bp.slug)) return false;
                                                        }
                                                        if (type === 'receive') {
                                                            return bp.genders.includes(currentPlayer.gender) || bp.genders.includes("Any");
                                                        }
                                                        return true;
                                                    }).map(bp => bp.slug);
                                                    updatePlayerPref(currentPlayer.id, currentActivity.slug, type, 'targets', available);
                                                }}
                                                className="text-xs text-zinc-500 hover:text-crimson-400 uppercase tracking-wider border border-zinc-800 px-3 py-1 hover:border-crimson-900"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const type = subStep === 'GIVE_DETAILS' ? 'give' : 'receive';
                                                    // Keep enforced targets
                                                    const enforced = permanent.body_parts.filter(bp =>
                                                        currentActivity.enforced_targets?.includes(bp.slug) || (currentActivity.enforce_default_targets && currentActivity.default_targets?.includes(bp.slug))
                                                    ).map(bp => bp.slug);
                                                    updatePlayerPref(currentPlayer.id, currentActivity.slug, type, 'targets', enforced);
                                                }}
                                                className="text-xs text-zinc-500 hover:text-crimson-400 uppercase tracking-wider border border-zinc-800 px-3 py-1 hover:border-crimson-900"
                                            >
                                                Select None
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-3">
                                            {permanent.body_parts.filter(bp => {
                                                if (currentActivity.restrict_to_default_targets) {
                                                    if (!currentActivity.default_targets?.includes(bp.slug)) return false;
                                                }
                                                if (subStep === 'RECEIVE_DETAILS') {
                                                    return bp.genders.includes(currentPlayer.gender) || bp.genders.includes("Any");
                                                }
                                                return true;
                                            }).map(bp => {
                                                const type = subStep === 'GIVE_DETAILS' ? 'give' : 'receive';
                                                const pPref = prefs[currentPlayer.id]?.[currentActivity.slug] || { give: { targets: [] }, receive: { targets: [] } };
                                                const isSelected = pPref[type].targets.includes(bp.slug);
                                                const isEnforced = currentActivity.enforced_targets?.includes(bp.slug) || (currentActivity.enforce_default_targets && currentActivity.default_targets?.includes(bp.slug));

                                                return (
                                                    <button
                                                        key={bp.slug}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isEnforced) return;
                                                            const current = pPref[type].targets || [];
                                                            const newVal = current.includes(bp.slug) ? current.filter(x => x !== bp.slug) : [...current, bp.slug];
                                                            updatePlayerPref(currentPlayer.id, currentActivity.slug, type, 'targets', newVal);
                                                        }}
                                                        className={`px-4 py-2 border text-sm uppercase tracking-wider transition-all ${isSelected || isEnforced ? 'bg-crimson-900/40 border-crimson-500 text-crimson-100' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'} ${isEnforced ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        {bp.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {detailStep === 'TOOLS' && (
                                    <div className="flex flex-col items-center justify-center flex-1 relative">
                                        <p className="text-xl text-zinc-300 mb-8 text-center max-w-md">
                                            With what do you like <span className="text-crimson-400 font-bold">{subStep === 'GIVE_DETAILS' ? (currentActivity.giving_text || `to ${currentActivity.verb}`) : (currentActivity.receiving_text || `be ${currentActivity.name.toLowerCase()}ed`)}</span>?
                                        </p>

                                        <div className="flex justify-center gap-4 mb-6">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const type = subStep === 'GIVE_DETAILS' ? 'give' : 'receive';
                                                    const available = (subStep === 'GIVE_DETAILS'
                                                        ? [
                                                            ...permanent.tools.filter(t => t.allowed_activities?.includes(currentActivity.slug)),
                                                            ...permanent.body_parts.filter(b => b.is_actor && b.allowed_activities?.includes(currentActivity.slug) && (b.genders.includes(currentPlayer.gender) || b.genders.includes("Any")))
                                                        ]
                                                        : [
                                                            ...permanent.tools.filter(t => t.allowed_activities?.includes(currentActivity.slug)),
                                                            ...permanent.body_parts.filter(b => b.is_actor && b.allowed_activities?.includes(currentActivity.slug))
                                                        ]
                                                    ).map(t => t.slug);
                                                    updatePlayerPref(currentPlayer.id, currentActivity.slug, type, 'tools', available);
                                                }}
                                                className="text-xs text-zinc-500 hover:text-crimson-400 uppercase tracking-wider border border-zinc-800 px-3 py-1 hover:border-crimson-900"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const type = subStep === 'GIVE_DETAILS' ? 'give' : 'receive';
                                                    updatePlayerPref(currentPlayer.id, currentActivity.slug, type, 'tools', []);
                                                }}
                                                className="text-xs text-zinc-500 hover:text-crimson-400 uppercase tracking-wider border border-zinc-800 px-3 py-1 hover:border-crimson-900"
                                            >
                                                Select None
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-3">
                                            {(subStep === 'GIVE_DETAILS'
                                                ? [
                                                    ...permanent.tools.filter(t => t.allowed_activities?.includes(currentActivity.slug)),
                                                    ...permanent.body_parts.filter(b => b.is_actor && b.allowed_activities?.includes(currentActivity.slug) && (b.genders.includes(currentPlayer.gender) || b.genders.includes("Any")))
                                                ]
                                                : [
                                                    ...permanent.tools.filter(t => t.allowed_activities?.includes(currentActivity.slug)),
                                                    ...permanent.body_parts.filter(b => b.is_actor && b.allowed_activities?.includes(currentActivity.slug))
                                                ]
                                            ).map(t => {
                                                const type = subStep === 'GIVE_DETAILS' ? 'give' : 'receive';
                                                const pPref = prefs[currentPlayer.id]?.[currentActivity.slug] || { give: { tools: [] }, receive: { tools: [] } };
                                                const isSelected = pPref[type].tools.includes(t.slug);

                                                return (
                                                    <button
                                                        key={t.slug}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const current = pPref[type].tools || [];
                                                            const newVal = current.includes(t.slug) ? current.filter(x => x !== t.slug) : [...current, t.slug];
                                                            updatePlayerPref(currentPlayer.id, currentActivity.slug, type, 'tools', newVal);
                                                        }}
                                                        className={`px-4 py-2 border text-sm uppercase tracking-wider transition-all ${isSelected ? 'bg-crimson-900/40 border-crimson-500 text-crimson-100' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                                    >
                                                        {t.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {detailStep === 'TOOL_CONSTRAINTS' && (
                                    <div className="flex flex-col items-center justify-center flex-1 relative animate-fade-in">
                                        <p className="text-xl text-zinc-300 mb-8 text-center max-w-md">
                                            Is there any tool you would like to specify body parts?
                                        </p>

                                        {(() => {
                                            const type = subStep === 'GIVE_DETAILS' ? 'give' : 'receive';
                                            const pPref = prefs[currentPlayer.id]?.[currentActivity.slug];
                                            const selectedTools = pPref[type].tools;

                                            // Ensure currentToolIndex is valid
                                            const activeToolSlug = selectedTools[currentToolIndex] || selectedTools[0];
                                            const activeTool = permanent.tools.find(t => t.slug === activeToolSlug) || permanent.body_parts.find(b => b.slug === activeToolSlug);

                                            return (
                                                <div className="w-full max-w-2xl flex flex-col items-center gap-8">
                                                    {/* Tool Selector */}
                                                    <div className="flex flex-wrap justify-center gap-2">
                                                        {selectedTools.map((slug, idx) => {
                                                            const t = permanent.tools.find(x => x.slug === slug) || permanent.body_parts.find(x => x.slug === slug);
                                                            const isActive = idx === currentToolIndex;
                                                            return (
                                                                <button
                                                                    key={slug}
                                                                    onClick={(e) => { e.stopPropagation(); setCurrentToolIndex(idx); }}
                                                                    className={`px-4 py-2 border text-sm uppercase tracking-wider transition-all ${isActive ? 'bg-crimson-900/40 border-crimson-500 text-crimson-100' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                                                >
                                                                    {t?.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Body Parts for Active Tool */}
                                                    {activeTool && (
                                                        <div className="flex flex-col items-center w-full p-6 bg-dark-elevated border border-zinc-800/50">
                                                            <p className="text-xs text-zinc-500 mb-4 uppercase tracking-widest">Allowed targets for {activeTool.name}</p>
                                                            <div className="flex flex-wrap justify-center gap-2">
                                                                {permanent.body_parts.filter(bp => {
                                                                    if (currentActivity.restrict_to_default_targets) {
                                                                        return currentActivity.default_targets?.includes(bp.slug);
                                                                    }
                                                                    if (subStep === 'RECEIVE_DETAILS') {
                                                                        return bp.genders.includes(currentPlayer.gender) || bp.genders.includes("Any");
                                                                    }
                                                                    return true;
                                                                }).map(bp => {
                                                                    const currentConstraints = pPref[type].tool_constraints?.[activeToolSlug] || [];
                                                                    const globalTargets = pPref[type].targets;

                                                                    // Logic: If constraints exist, use them. If not, use global targets.
                                                                    const isActive = (currentConstraints.length > 0 && currentConstraints.includes(bp.slug)) ||
                                                                        (currentConstraints.length === 0 && globalTargets.includes(bp.slug));

                                                                    return (
                                                                        <button
                                                                            key={bp.slug}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const effective = currentConstraints.length > 0 ? currentConstraints : globalTargets;
                                                                                let newConstraints;
                                                                                if (effective.includes(bp.slug)) {
                                                                                    newConstraints = effective.filter(x => x !== bp.slug);
                                                                                } else {
                                                                                    newConstraints = [...effective, bp.slug];
                                                                                }
                                                                                const newToolConstraints = { ...pPref[type].tool_constraints, [activeToolSlug]: newConstraints };
                                                                                updatePlayerPref(currentPlayer.id, currentActivity.slug, type, 'tool_constraints', newToolConstraints);
                                                                            }}
                                                                            className={`px-3 py-1 border text-xs uppercase tracking-wider transition-all ${isActive ? 'bg-crimson-900/30 border-crimson-600 text-crimson-200' : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}
                                                                        >
                                                                            {bp.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Navigation - REMOVED (Moved to Layout) */}
            </div>
        </div>
    );
}
