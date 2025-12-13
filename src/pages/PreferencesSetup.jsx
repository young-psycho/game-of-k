import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { Section, Pill } from "../components/UI";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function PreferencesSetup() {
    const { players, prefs, updatePlayerPref, permanent, consents, toggleConsent, setAllConsentsForPlayer } = useGame();
    const [activeTab, setActiveTab] = useState(players[0]?.id);

    useEffect(() => {
        if ((!activeTab || !players.find(p => p.id === activeTab)) && players.length > 0) {
            setActiveTab(players[0].id);
        }
    }, [players, activeTab]);

    const p = players.find(p => p.id === activeTab);

    const handleExport = () => {
        if (!p) return;
        const data = {
            name: p.name,
            gender: p.gender,
            prefs: prefs[p.id] || {}
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${p.name.toLowerCase().replace(/\s+/g, '_')}_prefs.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Section title="Preferences">
            {players.length === 0 ? <p className="text-zinc-500 text-sm uppercase tracking-wider">Add players first.</p> : (
                <div>
                    {/* Player Tabs */}
                    <div className="flex items-center justify-between border-b border-zinc-800 mb-6 pb-1">
                        <div className="flex overflow-x-auto gap-1 scrollbar-thin scrollbar-thumb-crimson-900/20">
                            {players.map(pl => (
                                <button
                                    key={pl.id}
                                    onClick={() => setActiveTab(pl.id)}
                                    className={`px-4 py-2 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === pl.id
                                        ? "text-crimson-400 border-b-2 border-crimson-500 bg-crimson-900/10"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                                        }`}
                                >
                                    {pl.name}
                                </button>
                            ))}
                        </div>
                        {p && (
                            <button
                                onClick={handleExport}
                                className="ml-4 px-3 py-1 text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-400 hover:text-crimson-400 hover:border-crimson-500 transition-all whitespace-nowrap"
                                title="Export Player Preferences"
                            >
                                Export
                            </button>
                        )}
                    </div>

                    {/* Active Player Content */}
                    {p && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="mb-8 p-4 bg-dark border border-zinc-800">
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

                                const receivingTargets = permanent.body_parts.filter(b => b.genders.includes(p.gender) || b.genders.includes("Any"));

                                return (
                                    <div key={act.slug} className="border border-zinc-800 p-4 bg-dark">
                                        <div className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">{act.name}</div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* GIVE Section */}
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={pPref.give.enabled}
                                                        onChange={(e) => updatePlayerPref(p.id, act.slug, 'give', 'enabled', e.target.checked)}
                                                        className="accent-crimson-600 w-4 h-4"
                                                    />
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${pPref.give.enabled ? 'text-crimson-400' : 'text-zinc-500'}`}>I like to Give</span>
                                                </label>

                                                {pPref.give.enabled && (
                                                    <div className="pl-6 space-y-4 border-l border-zinc-800 ml-2">
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">With Tools / Actors</div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => updatePlayerPref(p.id, act.slug, 'give', 'tools', givingTools.map(t => t.slug))} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">All</button>
                                                                    <button onClick={() => updatePlayerPref(p.id, act.slug, 'give', 'tools', [])} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">None</button>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
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
                                                                                <div className="hidden group-hover:block absolute z-10 bottom-full left-0 w-48 pb-2">
                                                                                    <div className="bg-dark-surface border border-zinc-700 p-2 shadow-xl">
                                                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Allowed Targets</div>
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                            {permanent.body_parts.map(bp => (
                                                                                                <button
                                                                                                    key={bp.slug}
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        const currentConstraints = pPref.give.tool_constraints?.[t.slug] || [];
                                                                                                        // If no constraints exist yet, it means ALL are allowed. So clicking one means we are now restricting to just that one (or toggling it off if it was the only one?)
                                                                                                        // Actually, simpler logic: If constraints is empty/undefined, it means ALL.
                                                                                                        // But for UI, we want to show checkboxes.
                                                                                                        // Let's say: If undefined, treat as "All Selected".
                                                                                                        // But we want to store "Restricted set".

                                                                                                        // Better logic:
                                                                                                        // We store the *allowed* list.
                                                                                                        // If the list is missing, it defaults to the global target list.
                                                                                                        // When the user interacts here, we are creating an explicit list.

                                                                                                        const globalTargets = pPref.give.targets;
                                                                                                        const effectiveConstraints = currentConstraints.length > 0 ? currentConstraints : globalTargets;

                                                                                                        let newConstraints;
                                                                                                        if (effectiveConstraints.includes(bp.slug)) {
                                                                                                            newConstraints = effectiveConstraints.filter(x => x !== bp.slug);
                                                                                                        } else {
                                                                                                            newConstraints = [...effectiveConstraints, bp.slug];
                                                                                                        }

                                                                                                        // Update the constraints map
                                                                                                        const newToolConstraints = { ...pPref.give.tool_constraints, [t.slug]: newConstraints };
                                                                                                        updatePlayerPref(p.id, act.slug, 'give', 'tool_constraints', newToolConstraints);
                                                                                                    }}
                                                                                                    className={`px-1.5 py-0.5 text-[10px] border ${(pPref.give.tool_constraints?.[t.slug]?.includes(bp.slug) || (!pPref.give.tool_constraints?.[t.slug] && pPref.give.targets.includes(bp.slug)))
                                                                                                        ? "bg-crimson-900/30 border-crimson-800 text-crimson-200"
                                                                                                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
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

                                                        {act.has_body_part && (
                                                            <div>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">On Target Body Parts</div>
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => updatePlayerPref(p.id, act.slug, 'give', 'targets', permanent.body_parts.map(b => b.slug))} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">All</button>
                                                                        <button onClick={() => updatePlayerPref(p.id, act.slug, 'give', 'targets', act.enforced_targets || [])} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">None</button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {permanent.body_parts.map(bp => {
                                                                        const isEnforced = act.enforced_targets?.includes(bp.slug);
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
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={pPref.receive.enabled}
                                                        onChange={(e) => updatePlayerPref(p.id, act.slug, 'receive', 'enabled', e.target.checked)}
                                                        className="accent-crimson-600 w-4 h-4"
                                                    />
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${pPref.receive.enabled ? 'text-crimson-400' : 'text-zinc-500'}`}>I like to Receive</span>
                                                </label>

                                                {pPref.receive.enabled && (
                                                    <div className="pl-6 space-y-4 border-l border-zinc-800 ml-2">
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Allowed Tools / Actors</div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => updatePlayerPref(p.id, act.slug, 'receive', 'tools', receivingTools.map(t => t.slug))} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">All</button>
                                                                    <button onClick={() => updatePlayerPref(p.id, act.slug, 'receive', 'tools', [])} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">None</button>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
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
                                                                                <div className="hidden group-hover:block absolute z-10 bottom-full left-0 w-48 pb-2">
                                                                                    <div className="bg-dark-surface border border-zinc-700 p-2 shadow-xl">
                                                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Allowed Targets</div>
                                                                                        <div className="flex flex-wrap gap-1">
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
                                                                                                    className={`px-1.5 py-0.5 text-[10px] border ${(pPref.receive.tool_constraints?.[t.slug]?.includes(bp.slug) || (!pPref.receive.tool_constraints?.[t.slug] && pPref.receive.targets.includes(bp.slug)))
                                                                                                        ? "bg-crimson-900/30 border-crimson-800 text-crimson-200"
                                                                                                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
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

                                                        {act.has_body_part && (
                                                            <div>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Allowed Target Body Parts</div>
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => updatePlayerPref(p.id, act.slug, 'receive', 'targets', receivingTargets.map(b => b.slug))} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">All</button>
                                                                        <button onClick={() => updatePlayerPref(p.id, act.slug, 'receive', 'targets', act.enforced_targets || [])} className="text-[10px] text-zinc-500 hover:text-crimson-400 uppercase tracking-wider">None</button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {receivingTargets.map(bp => {
                                                                        const isEnforced = act.enforced_targets?.includes(bp.slug);
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
                    )}
                </div>
            )}
        </Section>
    );
}
