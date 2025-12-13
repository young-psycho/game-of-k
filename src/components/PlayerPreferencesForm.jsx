import React from "react";
import { useGame } from "../context/GameContext";
import { Pill } from "./UI";

export function PlayerPreferencesForm({ player }) {
    const { players, prefs, updatePlayerPref, permanent, consents, toggleConsent, setAllConsentsForPlayer } = useGame();
    const p = player;

    if (!p) return null;

    return (
        <div className="space-y-8">
            {/* Consents Section */}
            <div className="p-6 bg-dark border border-zinc-800">
                <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                    <div className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Who I want to play with</div>
                    <div className="flex gap-2">
                        <button onClick={() => setAllConsentsForPlayer(p.id, true)} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">All</button>
                        <button onClick={() => setAllConsentsForPlayer(p.id, false)} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">None</button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4">
                    {players.filter(other => other.id !== p.id).map(other => (
                        <label key={other.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!consents[`${p.id}|${other.id}`]}
                                onChange={() => toggleConsent(p.id, other.id)}
                                className="accent-crimson-600 w-4 h-4"
                            />
                            <span className={`text-xs font-bold uppercase tracking-wider ${consents[`${p.id}|${other.id}`] ? 'text-crimson-400' : 'text-zinc-500'}`}>{other.name}</span>
                        </label>
                    ))}
                    {players.length <= 1 && <span className="text-xs text-zinc-600 italic">No other players available.</span>}
                </div>
            </div>

            {/* Activities Loop */}
            {permanent.activities.map((act) => {
                const defaultTargets = act.default_targets || [];
                const pPref = prefs[p.id]?.[act.slug] || { give: { enabled: false, tools: [], targets: defaultTargets }, receive: { enabled: false, tools: [], targets: defaultTargets } };

                // Filter tools allowed for this activity
                const receivingTools = [
                    ...permanent.tools.filter(t => t.allowed_activities?.includes(act.slug)),
                    ...permanent.body_parts.filter(b => b.is_actor && b.allowed_activities?.includes(act.slug))
                ];

                const givingTools = [
                    ...permanent.tools.filter(t => t.allowed_activities?.includes(act.slug)),
                    ...permanent.body_parts.filter(b => b.is_actor && b.allowed_activities?.includes(act.slug) && (b.genders.includes(p.gender) || b.genders.includes("Any")))
                ];

                const receivingTargets = permanent.body_parts.filter(b => {
                    const matchesGender = b.genders.includes(p.gender) || b.genders.includes("Any");
                    if (act.restrict_to_default_targets) {
                        return matchesGender && act.default_targets?.includes(b.slug);
                    }
                    return matchesGender;
                });

                return (
                    <div key={act.slug} className="border border-zinc-800 p-6 bg-dark">
                        <div className="text-lg font-bold text-zinc-300 uppercase tracking-wider mb-6 border-b border-zinc-800 pb-2 text-crimson-500/80">{act.name}</div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* GIVE Section */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer p-2 bg-zinc-900/30 border border-transparent hover:border-zinc-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={pPref.give.enabled}
                                        onChange={(e) => updatePlayerPref(p.id, act.slug, 'give', 'enabled', e.target.checked)}
                                        className="accent-crimson-600 w-5 h-5"
                                    />
                                    <span className={`text-sm font-bold uppercase tracking-wider ${pPref.give.enabled ? 'text-crimson-400' : 'text-zinc-500'}`}>I like to Give</span>
                                </label>

                                {pPref.give.enabled && (
                                    <div className="pl-4 space-y-6 border-l-2 border-zinc-800 ml-2.5">
                                        {/* Give Tools */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">With Tools / Actors</div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => updatePlayerPref(p.id, act.slug, 'give', 'tools', givingTools.map(t => t.slug))} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">All</button>
                                                    <button onClick={() => updatePlayerPref(p.id, act.slug, 'give', 'tools', [])} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">None</button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {givingTools.length === 0 ? <span className="text-xs text-zinc-600 italic">No specific tools</span> : givingTools.map(t => {
                                                    const isSelected = pPref.give.tools.includes(t.slug);
                                                    const constraints = pPref.give.tool_constraints?.[t.slug];
                                                    const hasConstraints = constraints && constraints.length > 0;

                                                    return (
                                                        <div key={t.slug} className="relative group">
                                                            <Pill
                                                                active={isSelected}
                                                                onClick={() => {
                                                                    const current = pPref.give.tools;
                                                                    const newVal = current.includes(t.slug) ? current.filter(x => x !== t.slug) : [...current, t.slug];
                                                                    updatePlayerPref(p.id, act.slug, 'give', 'tools', newVal);
                                                                }}
                                                                size="xs"
                                                                className={hasConstraints ? "border-b-2 border-b-crimson-400" : ""}
                                                            >
                                                                {t.name}
                                                            </Pill>
                                                            {isSelected && act.has_body_part && (
                                                                <div className="hidden group-hover:block absolute z-20 bottom-full left-0 w-56 pb-2">
                                                                    <div className="bg-dark-surface border border-zinc-700 p-3 shadow-xl">
                                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">Allowed Targets for {t.name}</div>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {permanent.body_parts.map(bp => (
                                                                                <button
                                                                                    key={bp.slug}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const currentConstraints = pPref.give.tool_constraints?.[t.slug] || [];
                                                                                        const globalTargets = pPref.give.targets;
                                                                                        const effectiveConstraints = currentConstraints.length > 0 ? currentConstraints : globalTargets;

                                                                                        let newConstraints;
                                                                                        if (effectiveConstraints.includes(bp.slug)) {
                                                                                            newConstraints = effectiveConstraints.filter(x => x !== bp.slug);
                                                                                        } else {
                                                                                            newConstraints = [...effectiveConstraints, bp.slug];
                                                                                        }

                                                                                        const newToolConstraints = { ...pPref.give.tool_constraints, [t.slug]: newConstraints };
                                                                                        updatePlayerPref(p.id, act.slug, 'give', 'tool_constraints', newToolConstraints);
                                                                                    }}
                                                                                    className={`px-2 py-1 text-[10px] border transition-colors ${(pPref.give.tool_constraints?.[t.slug]?.includes(bp.slug) || (!pPref.give.tool_constraints?.[t.slug] && pPref.give.targets.includes(bp.slug)))
                                                                                        ? "bg-crimson-900/30 border-crimson-800 text-crimson-200"
                                                                                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                                                                                        }`}
                                                                                >
                                                                                    {bp.name}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Give Targets */}
                                        {act.has_body_part && (
                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">On Target Body Parts</div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => updatePlayerPref(p.id, act.slug, 'give', 'targets', permanent.body_parts.map(b => b.slug))} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">All</button>
                                                        <button onClick={() => updatePlayerPref(p.id, act.slug, 'give', 'targets', (act.enforce_default_targets ? act.default_targets : act.enforced_targets) || [])} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">None</button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {permanent.body_parts.filter(bp => {
                                                        if (act.restrict_to_default_targets) {
                                                            return act.default_targets?.includes(bp.slug);
                                                        }
                                                        return true;
                                                    }).map(bp => {
                                                        const isEnforced = act.enforced_targets?.includes(bp.slug) || (act.enforce_default_targets && act.default_targets?.includes(bp.slug));
                                                        const isActive = isEnforced || pPref.give.targets.includes(bp.slug);
                                                        return (
                                                            <Pill
                                                                key={bp.slug}
                                                                active={isActive}
                                                                onClick={() => {
                                                                    if (isEnforced) return;
                                                                    const current = pPref.give.targets;
                                                                    const newVal = current.includes(bp.slug) ? current.filter(x => x !== bp.slug) : [...current, bp.slug];
                                                                    updatePlayerPref(p.id, act.slug, 'give', 'targets', newVal);
                                                                }}
                                                                size="xs"
                                                                className={isEnforced ? "cursor-not-allowed opacity-80" : ""}
                                                            >
                                                                {bp.name}
                                                            </Pill>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* RECEIVE Section */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer p-2 bg-zinc-900/30 border border-transparent hover:border-zinc-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={pPref.receive.enabled}
                                        onChange={(e) => updatePlayerPref(p.id, act.slug, 'receive', 'enabled', e.target.checked)}
                                        className="accent-crimson-600 w-5 h-5"
                                    />
                                    <span className={`text-sm font-bold uppercase tracking-wider ${pPref.receive.enabled ? 'text-crimson-400' : 'text-zinc-500'}`}>I like to Receive</span>
                                </label>

                                {pPref.receive.enabled && (
                                    <div className="pl-4 space-y-6 border-l-2 border-zinc-800 ml-2.5">
                                        {/* Receive Tools */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Allowed Tools / Actors</div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => updatePlayerPref(p.id, act.slug, 'receive', 'tools', receivingTools.map(t => t.slug))} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">All</button>
                                                    <button onClick={() => updatePlayerPref(p.id, act.slug, 'receive', 'tools', [])} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">None</button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {receivingTools.length === 0 ? <span className="text-xs text-zinc-600 italic">No specific tools</span> : receivingTools.map(t => {
                                                    const isSelected = pPref.receive.tools.includes(t.slug);
                                                    const constraints = pPref.receive.tool_constraints?.[t.slug];
                                                    const hasConstraints = constraints && constraints.length > 0;

                                                    return (
                                                        <div key={t.slug} className="relative group">
                                                            <Pill
                                                                active={isSelected}
                                                                onClick={() => {
                                                                    const current = pPref.receive.tools;
                                                                    const newVal = current.includes(t.slug) ? current.filter(x => x !== t.slug) : [...current, t.slug];
                                                                    updatePlayerPref(p.id, act.slug, 'receive', 'tools', newVal);
                                                                }}
                                                                size="xs"
                                                                className={hasConstraints ? "border-b-2 border-b-crimson-400" : ""}
                                                            >
                                                                {t.name}
                                                            </Pill>
                                                            {isSelected && act.has_body_part && (
                                                                <div className="hidden group-hover:block absolute z-20 bottom-full left-0 w-56 pb-2">
                                                                    <div className="bg-dark-surface border border-zinc-700 p-3 shadow-xl">
                                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">Allowed Targets for {t.name}</div>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {receivingTargets.map(bp => (
                                                                                <button
                                                                                    key={bp.slug}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const currentConstraints = pPref.receive.tool_constraints?.[t.slug] || [];
                                                                                        const globalTargets = pPref.receive.targets;
                                                                                        const effectiveConstraints = currentConstraints.length > 0 ? currentConstraints : globalTargets;

                                                                                        let newConstraints;
                                                                                        if (effectiveConstraints.includes(bp.slug)) {
                                                                                            newConstraints = effectiveConstraints.filter(x => x !== bp.slug);
                                                                                        } else {
                                                                                            newConstraints = [...effectiveConstraints, bp.slug];
                                                                                        }

                                                                                        const newToolConstraints = { ...pPref.receive.tool_constraints, [t.slug]: newConstraints };
                                                                                        updatePlayerPref(p.id, act.slug, 'receive', 'tool_constraints', newToolConstraints);
                                                                                    }}
                                                                                    className={`px-2 py-1 text-[10px] border transition-colors ${(pPref.receive.tool_constraints?.[t.slug]?.includes(bp.slug) || (!pPref.receive.tool_constraints?.[t.slug] && pPref.receive.targets.includes(bp.slug)))
                                                                                        ? "bg-crimson-900/30 border-crimson-800 text-crimson-200"
                                                                                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                                                                                        }`}
                                                                                >
                                                                                    {bp.name}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Receive Targets */}
                                        {act.has_body_part && (
                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Allowed Target Body Parts</div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => updatePlayerPref(p.id, act.slug, 'receive', 'targets', receivingTargets.map(b => b.slug))} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">All</button>
                                                        <button onClick={() => updatePlayerPref(p.id, act.slug, 'receive', 'targets', (act.enforce_default_targets ? act.default_targets : act.enforced_targets) || [])} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">None</button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {receivingTargets.map(bp => {
                                                        const isEnforced = act.enforced_targets?.includes(bp.slug) || (act.enforce_default_targets && act.default_targets?.includes(bp.slug));
                                                        const isActive = isEnforced || pPref.receive.targets.includes(bp.slug);
                                                        return (
                                                            <Pill
                                                                key={bp.slug}
                                                                active={isActive}
                                                                onClick={() => {
                                                                    if (isEnforced) return;
                                                                    const current = pPref.receive.targets;
                                                                    const newVal = current.includes(bp.slug) ? current.filter(x => x !== bp.slug) : [...current, bp.slug];
                                                                    updatePlayerPref(p.id, act.slug, 'receive', 'targets', newVal);
                                                                }}
                                                                size="xs"
                                                                className={isEnforced ? "cursor-not-allowed opacity-80" : ""}
                                                            >
                                                                {bp.name}
                                                            </Pill>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}