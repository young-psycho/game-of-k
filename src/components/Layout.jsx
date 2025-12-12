import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { SettingsView } from "./SettingsView";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";

export default function Layout() {
    const {
        sessionName, setSessionName,
        resetSession,
        permanent, updatePermanent, resetPermanent,
        canAdvance,
        noRepeatTurns, setNoRepeatTurns
    } = useGame();

    const [showSettings, setShowSettings] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const steps = [
        { path: "/players", label: "Players" },
        { path: "/consent", label: "Consents" },
        { path: "/preferences", label: "Preferences" },
        { path: "/inventory", label: "Inventory" },
        { path: "/play", label: "Play" },
    ];

    const currentStepIndex = steps.findIndex(s => s.path === location.pathname);
    const currentStep = steps[currentStepIndex];

    const goNext = () => {
        if (currentStepIndex < steps.length - 1) {
            navigate(steps[currentStepIndex + 1].path);
        }
    };

    const goBack = () => {
        if (currentStepIndex > 0) {
            navigate(steps[currentStepIndex - 1].path);
        }
    };

    const handleReset = () => {
        resetSession();
        setShowResetConfirm(false);
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-dark text-zinc-300 flex flex-col font-serif selection:bg-crimson-900 selection:text-white overflow-hidden">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-crimson-900/10 via-dark to-dark pointer-events-none z-0" />

            {showResetConfirm && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-dark-surface border border-crimson-900/30 p-8 max-w-md w-full shadow-[0_0_30px_rgba(220,20,60,0.15)]">
                        <h3 className="text-xl font-bold text-crimson-500 font-display uppercase tracking-widest mb-4">Reset Session?</h3>
                        <p className="text-zinc-400 mb-8 leading-relaxed text-sm">
                            This will remove all players, consents, preferences, and history. Your custom settings (activities, tools, etc.) will be preserved.
                            <br /><br />
                            Are you sure you want to start over?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="px-6 py-3 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 uppercase tracking-wider text-xs font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 bg-crimson-900/80 text-white hover:bg-crimson-800 uppercase tracking-wider text-xs font-bold shadow-[0_0_15px_rgba(220,20,60,0.3)] transition-all"
                            >
                                Reset Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSettings && (
                <SettingsView
                    data={permanent}
                    sessionName={sessionName}
                    setSessionName={setSessionName}
                    noRepeatTurns={noRepeatTurns}
                    setNoRepeatTurns={setNoRepeatTurns}
                    onSave={(newData) => {
                        updatePermanent(newData);
                        setShowSettings(false);
                    }}
                    onClose={() => setShowSettings(false)}
                    onReset={() => {
                        if (confirm("Reset all game data to defaults? This cannot be undone.")) {
                            resetPermanent();
                            setShowSettings(false);
                        }
                    }}
                />
            )}

            {/* Top Bar */}
            <header className="relative z-40 flex items-center justify-between px-4 py-4 bg-dark-surface/90 border-b border-crimson-900/30 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-crimson-500 font-display tracking-[0.15em] uppercase drop-shadow-[0_0_5px_rgba(220,20,60,0.5)]">{currentStep?.label || "Game of K"}</h1>
                    {currentStepIndex >= 0 && (
                        <span className="text-[10px] text-crimson-300 bg-crimson-900/10 border border-crimson-900/30 px-2 py-0.5 tracking-wider">
                            {currentStepIndex + 1} / {steps.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowResetConfirm(true)} className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-crimson-500 transition-colors mr-2">
                        Reset Session
                    </button>
                    <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-500 hover:text-crimson-400 transition-colors hover:bg-crimson-900/10" title="Settings">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-6">
                <div className="flex-1 flex items-center justify-between h-full gap-6">
                    <button
                        disabled={currentStepIndex <= 0}
                        onClick={goBack}
                        className="hidden lg:flex p-4 hover:bg-crimson-900/5 disabled:opacity-0 text-zinc-600 hover:text-crimson-500 transition-all duration-300 border border-transparent hover:border-crimson-900/20"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>

                    <div className="flex-1 w-full">
                        <Outlet />
                    </div>

                    <button
                        disabled={currentStepIndex >= steps.length - 1 || !canAdvance()}
                        onClick={goNext}
                        className="hidden lg:flex p-4 hover:bg-crimson-900/5 disabled:opacity-0 text-zinc-600 hover:text-crimson-500 transition-all duration-300 border border-transparent hover:border-crimson-900/20"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Arrows */}
            <div className="lg:hidden p-4 border-t border-crimson-900/30 bg-dark-surface flex justify-between gap-4 sticky bottom-0 z-40 backdrop-blur-md">
                <button
                    disabled={currentStepIndex <= 0}
                    onClick={goBack}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-zinc-800 text-zinc-400 uppercase tracking-wider text-sm hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                    disabled={currentStepIndex >= steps.length - 1 || !canAdvance()}
                    onClick={goNext}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-crimson-600/50 bg-crimson-900/10 text-crimson-100 uppercase tracking-wider text-sm hover:bg-crimson-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-[0_0_10px_rgba(220,20,60,0.1)]"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
