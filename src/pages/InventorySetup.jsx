import React from "react";
import { useGame } from "../context/GameContext";
import { Section } from "../components/UI";

export default function InventorySetup() {
    const { inventory, toggleInventory, setInventory, permanent } = useGame();

    const addAll = () => {
        const all = permanent.tools.filter(t => !t.always_available).map(t => t.slug);
        setInventory(all);
    };

    const removeAll = () => {
        setInventory([]);
    };

    return (
        <Section>
            <div className="flex gap-3 mb-4">
                <button
                    onClick={addAll}
                    className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider border border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-crimson-400 hover:border-crimson-500/50 transition-all duration-200"
                >
                    Add All
                </button>
                <button
                    onClick={removeAll}
                    className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider border border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-crimson-400 hover:border-crimson-500/50 transition-all duration-200"
                >
                    Remove All
                </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {permanent.tools.map((t) => (
                    <label key={t.slug} className={`px-4 py-3 rounded-none border cursor-pointer text-sm transition-all duration-300 uppercase tracking-wider ${t.always_available ? "opacity-60 cursor-not-allowed" : "hover:border-crimson-900 hover:text-crimson-300"} ${inventory.includes(t.slug) || t.always_available ? "bg-crimson-900/40 border-crimson-600 text-crimson-100 shadow-[0_0_10px_rgba(220,20,60,0.1)]" : "bg-dark-elevated border-zinc-800 text-zinc-500"}`}>
                        <input type="checkbox" className="hidden" disabled={t.always_available} checked={t.always_available || inventory.includes(t.slug)} onChange={() => toggleInventory(t.slug)} />
                        <span className="block truncate font-medium">{t.name}{t.always_available ? " (always)" : ""}</span>
                    </label>
                ))}
            </div>
        </Section>
    );
}
