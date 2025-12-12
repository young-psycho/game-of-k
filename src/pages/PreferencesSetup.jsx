import React from "react";
import { useGame } from "../context/GameContext";
import { Section, Pill } from "../components/UI";

export default function PreferencesSetup() {
    const { players, prefs, setPref, setAllPrefsForPlayer, permanent } = useGame();

    return (
        <Section title="Preferences by player & activity">
            {players.length === 0 ? <p className="text-zinc-500 text-sm uppercase tracking-wider">Add players first.</p> : (
                <div className="grid gap-6">
                    {players.map((p) => {
                        // Check if all preferences for this player match a specific value
                        const allPrefsMatch = (value) => {
                            return permanent.activities.every((activity) => {
                                const pref = prefs[p.id]?.[activity.slug] || "nope";
                                return pref === value;
                            });
                        };

                        return (
                            <div key={p.id} className="border border-crimson-900/20 bg-dark-elevated/50 rounded-none p-4 sm:p-6 hover:border-crimson-900/40 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-zinc-800 pb-4">
                                    <div className="font-bold text-lg text-crimson-500 uppercase tracking-widest">{p.name}</div>
                                    <div className="flex gap-2 flex-wrap">
                                        <button onClick={() => setAllPrefsForPlayer(p.id, "give")} className={`px-3 py-1 rounded-none border text-[10px] uppercase tracking-widest transition-all ${allPrefsMatch("give") ? "bg-crimson-900/60 border-crimson-600 text-white" : "bg-dark border-zinc-800 text-zinc-500 hover:text-crimson-400 hover:border-crimson-900"}`}>
                                            Give All
                                        </button>
                                        <button onClick={() => setAllPrefsForPlayer(p.id, "receive")} className={`px-3 py-1 rounded-none border text-[10px] uppercase tracking-widest transition-all ${allPrefsMatch("receive") ? "bg-crimson-900/60 border-crimson-600 text-white" : "bg-dark border-zinc-800 text-zinc-500 hover:text-crimson-400 hover:border-crimson-900"}`}>
                                            Receive All
                                        </button>
                                        <button onClick={() => setAllPrefsForPlayer(p.id, "both")} className={`px-3 py-1 rounded-none border text-[10px] uppercase tracking-widest transition-all ${allPrefsMatch("both") ? "bg-crimson-900/60 border-crimson-600 text-white" : "bg-dark border-zinc-800 text-zinc-500 hover:text-crimson-400 hover:border-crimson-900"}`}>
                                            Both All
                                        </button>
                                        <button onClick={() => setAllPrefsForPlayer(p.id, "nope")} className={`px-3 py-1 rounded-none border text-[10px] uppercase tracking-widest transition-all ${allPrefsMatch("nope") ? "bg-crimson-900/60 border-crimson-600 text-white" : "bg-dark border-zinc-800 text-zinc-500 hover:text-crimson-400 hover:border-crimson-900"}`}>
                                            Nope All
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {permanent.activities.map((a) => (
                                        <div key={a.slug} className="space-y-2">
                                            <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{a.name}</div>
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
    );
}
