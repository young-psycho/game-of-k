import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Section, Pill } from "../components/UI";

function AddPlayerForm({ onAdd, onImport }) {
    const [name, setName] = useState("");
    const [gender, setGender] = useState("M");
    const canAdd = name.trim().length >= 1 && (gender === "M" || gender === "F");
    const submit = () => { if (!canAdd) return; onAdd(name, gender); setName(""); };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                if (data.name && data.gender) {
                    onImport(data);
                } else {
                    alert("Invalid player file format");
                }
            } catch (err) {
                console.error(err);
                alert("Failed to parse file");
            }
        };
        reader.readAsText(file);
        e.target.value = null; // reset
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                    <label className="block text-xs sm:text-sm text-zinc-500 mb-2 font-medium uppercase tracking-wider">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-dark-elevated border border-zinc-800 rounded-none px-3 py-2 text-sm sm:text-base focus:outline-none focus:border-crimson-600 transition-colors text-zinc-300 placeholder-zinc-700" placeholder="Player name" />
                </div>
                <div>
                    <label className="block text-xs sm:text-sm text-zinc-500 mb-2 font-medium uppercase tracking-wider">Gender</label>
                    <div className="flex gap-2">
                        {(["M", "F"]).map((g) => (
                            <Pill key={g} active={gender === g} onClick={() => setGender(g)}>{g}</Pill>
                        ))}
                    </div>
                </div>
                <button onClick={submit} disabled={!canAdd} className="px-6 py-2 rounded-none bg-crimson-900/80 hover:bg-crimson-800 disabled:opacity-30 disabled:cursor-not-allowed text-sm sm:text-base font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(220,20,60,0.2)] text-white border border-crimson-800">Add</button>
            </div>

            <div className="flex justify-end border-t border-zinc-800/50 pt-4">
                <label className="cursor-pointer px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-crimson-400 border border-zinc-800 hover:border-crimson-900 transition-all flex items-center gap-2">
                    <span>Import Player</span>
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
            </div>
        </div>
    );
}

export default function PlayerSetup() {
    const { players, addPlayer, removePlayer, importPlayer } = useGame();

    return (
        <Section title="Players">
            <AddPlayerForm onAdd={addPlayer} onImport={importPlayer} />
            <ul className="mt-6 divide-y divide-crimson-900/20">
                {players.map((p) => (
                    <li key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-crimson-900/5 transition-colors px-2 -mx-2">
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base truncate text-zinc-300">{p.name} <span className="text-xs text-crimson-400 font-bold ml-2">({p.gender})</span></div>
                        </div>
                        <button onClick={() => removePlayer(p.id)} className="text-zinc-600 hover:text-crimson-500 text-xs sm:text-sm self-start sm:self-auto transition-colors uppercase tracking-wider">Remove</button>
                    </li>
                ))}
            </ul>
        </Section>
    );
}
