import React from "react";
import { useGame } from "../context/GameContext";
import { Section } from "../components/UI";

export default function ConsentSetup() {
    const { players, consents, toggleConsent, setAllConsentsForPlayer } = useGame();

    return (
        <Section title="Consents (mutual)">
            {players.length < 2 ? <p className="text-zinc-500 text-sm uppercase tracking-wider">Add at least two players first.</p> : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <div className="inline-block min-w-full align-middle px-2 sm:px-0">
                        <table className="min-w-full text-xs sm:text-sm">
                            <thead>
                                <tr>
                                    <th className="text-left p-2 sticky left-0 bg-dark-surface/95 backdrop-blur-sm z-10 border-b border-crimson-900/30"></th>
                                    {players.map(p => <th key={p.id} className="text-left p-2 whitespace-nowrap border-b border-crimson-900/30 text-crimson-500 uppercase tracking-wider font-bold">{p.name}</th>)}
                                    <th className="text-left p-2 whitespace-nowrap border-b border-crimson-900/30 text-zinc-500 uppercase tracking-wider">All</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((a) => (
                                    <tr key={a.id} className="hover:bg-crimson-900/5 transition-colors">
                                        <td className="p-2 font-bold sticky left-0 bg-dark-surface/95 backdrop-blur-sm z-10 whitespace-nowrap text-crimson-500 uppercase tracking-wider border-r border-crimson-900/10">{a.name}</td>
                                        {players.map((b) => (
                                            <td key={b.id} className="p-2">
                                                {a.id === b.id ? <span className="text-zinc-700">—</span> : (
                                                    <button onClick={() => toggleConsent(a.id, b.id)} className={`px-3 py-1 rounded-none border text-[10px] uppercase tracking-widest transition-all duration-300 ${consents[`${a.id}|${b.id}`] ? "bg-crimson-900/60 border-crimson-600 text-white shadow-[0_0_5px_rgba(220,20,60,0.2)]" : "bg-dark-elevated border-zinc-800 text-zinc-500 hover:border-crimson-900 hover:text-crimson-400"}`}>
                                                        {consents[`${a.id}|${b.id}`] ? "Yes" : "No"}
                                                    </button>
                                                )}
                                            </td>
                                        ))}
                                        <td className="p-2">
                                            <div className="flex gap-1">
                                                <button onClick={() => setAllConsentsForPlayer(a.id, true)} className="px-2 py-1 rounded-none border text-[10px] bg-crimson-900/40 border-crimson-800 hover:bg-crimson-800 text-crimson-200 transition-colors uppercase tracking-wider">
                                                    Yes
                                                </button>
                                                <button onClick={() => setAllConsentsForPlayer(a.id, false)} className="px-2 py-1 rounded-none border text-[10px] bg-dark-elevated border-zinc-800 hover:bg-zinc-800 text-zinc-500 transition-colors uppercase tracking-wider">
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
    );
}
