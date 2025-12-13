import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { X, Edit2, Trash2, ChevronLeft, Download } from "lucide-react";
import { PlayerPreferencesForm } from "./PlayerPreferencesForm";

export function SessionSettingsView({ onClose, isClosing }) {
    const {
        sessionName, setSessionName,
        noRepeatTurns, setNoRepeatTurns,
        players, setPlayers,
        prefs
    } = useGame();

    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [deletingPlayerId, setDeletingPlayerId] = useState(null);

    const handleUpdatePlayerName = (id, newName) => {
        setPlayers(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    };

    const handleDeletePlayer = (id) => {
        setPlayers(prev => prev.filter(p => p.id !== id));
        setDeletingPlayerId(null);
    };

    const exportPlayer = (player) => {
        const data = {
            name: player.name,
            gender: player.gender,
            prefs: prefs[player.id] || {}
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${player.name.replace(/\s+/g, '_')}_kink_prefs.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const editingPlayer = players.find(p => p.id === editingPlayerId);

    return (
        <div className="fixed inset-0 z-50">
            <div className={`absolute inset-0 bg-black/95 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={onClose} />
            <div className="absolute inset-0 overflow-y-auto p-0 sm:p-8">
                <div className={`max-w-4xl mx-auto bg-dark-surface border border-crimson-900/30 rounded-none p-6 shadow-[0_0_30px_rgba(220,20,60,0.1)] relative ${isClosing ? 'animate-slide-out-bottom' : 'animate-slide-in-bottom'}`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-crimson-500 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <h2 className="text-2xl font-bold text-crimson-500 font-display uppercase tracking-widest mb-6 border-b border-crimson-900/20 pb-4 pr-8">Session Settings</h2>

                    {!editingPlayer ? (
                        <div className="space-y-8">
                            {/* Session Config */}
                            <div className="space-y-4">
                                <div className="p-4 bg-dark-elevated rounded-none border border-zinc-800">
                                    <label className="block text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Session Name</label>
                                    <input
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        className="w-full bg-dark border border-zinc-800 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-crimson-600 text-zinc-300 placeholder-zinc-700"
                                        placeholder="Session name"
                                    />
                                </div>

                                <div className="p-4 bg-dark-elevated rounded-none border border-zinc-800">
                                    <label className="block text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">
                                        No repeats within: <span className="text-crimson-400 font-bold">{noRepeatTurns}</span> turns
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="20"
                                        value={noRepeatTurns}
                                        onChange={(e) => setNoRepeatTurns(parseInt(e.target.value))}
                                        className="w-full h-1 bg-zinc-800 rounded-none appearance-none cursor-pointer accent-crimson-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-zinc-600 mt-2 uppercase tracking-widest">
                                        <span>0 (off)</span>
                                        <span>20</span>
                                    </div>
                                </div>
                            </div>

                            {/* Players List */}
                            <div>
                                <h3 className="text-lg font-bold text-zinc-300 uppercase tracking-wider mb-4">Players</h3>
                                <div className="grid gap-2">
                                    {players.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-3 bg-dark-elevated rounded-none border border-zinc-800 hover:border-crimson-900/30 transition-colors">
                                            <div>
                                                <div className="font-medium text-zinc-300">{p.name}</div>
                                                <div className="text-xs text-zinc-600 uppercase tracking-widest">{p.gender === 'M' ? 'Male' : 'Female'}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => exportPlayer(p)} className="p-2 text-zinc-400 hover:text-crimson-400 hover:bg-dark border border-transparent hover:border-crimson-900/50 transition-all" title="Export Player">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingPlayerId(p.id)} className="p-2 text-zinc-400 hover:text-crimson-400 hover:bg-dark border border-transparent hover:border-crimson-900/50 transition-all">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeletingPlayerId(p.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-dark border border-transparent hover:border-red-900/30 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {players.length === 0 && <p className="text-zinc-500 text-sm italic">No players added yet.</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                                <h3 className="text-xl font-bold text-crimson-500 font-display uppercase tracking-widest">Edit Player</h3>
                                <button onClick={() => setEditingPlayerId(null)} className="text-zinc-500 hover:text-crimson-400 uppercase tracking-wider text-xs">Back</button>
                            </div>

                            <div className="p-4 bg-dark-elevated rounded-none border border-zinc-800">
                                <label className="block text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Player Name</label>
                                <input
                                    value={editingPlayer.name}
                                    onChange={(e) => handleUpdatePlayerName(editingPlayer.id, e.target.value)}
                                    className="w-full bg-dark border border-zinc-800 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-crimson-600 text-zinc-300 placeholder-zinc-700"
                                />
                            </div>

                            <PlayerPreferencesForm player={editingPlayer} />
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {deletingPlayerId && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-dark-surface border border-crimson-900/30 p-6 max-w-sm w-full shadow-2xl animate-slide-in-bottom">
                                <h4 className="text-lg font-bold text-crimson-500 uppercase tracking-widest mb-4">Delete Player?</h4>
                                <p className="text-zinc-400 text-sm mb-6">
                                    Are you sure you want to remove this player? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-4">
                                    <button onClick={() => setDeletingPlayerId(null)} className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs uppercase tracking-wider">Cancel</button>
                                    <button onClick={() => handleDeletePlayer(deletingPlayerId)} className="px-4 py-2 bg-red-900/80 text-white hover:bg-red-800 text-xs uppercase tracking-wider">Delete</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}