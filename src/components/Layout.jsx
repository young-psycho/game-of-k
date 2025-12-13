import React, { useState, useRef } from "react";
import { useGame } from "../context/GameContext";
import { SettingsView } from "./SettingsView";
import { SessionSettingsView } from "./SessionSettingsView";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Settings, MoreVertical, Users } from "lucide-react";

const NavButton = ({ onClick, onHold, disabled, children, className, holdDuration = 800 }) => {
    const [isHolding, setIsHolding] = useState(false);
    const timeoutRef = useRef(null);
    const isHoldActionRef = useRef(false);
    const touchStartPos = useRef(null);
    const isTouchRef = useRef(false);

    const startHold = (e) => {
        if (disabled) return;

        // Prevent mouse events if touch is active
        if (e.type === 'mousedown' && isTouchRef.current) return;
        if (e.type === 'touchstart') isTouchRef.current = true;

        // Clear any existing timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setIsHolding(true);
        isHoldActionRef.current = false;

        if (e.type === 'touchstart') {
            touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }

        timeoutRef.current = setTimeout(() => {
            isHoldActionRef.current = true;
            setIsHolding(false);
            if (onHold) {
                if (navigator.vibrate) navigator.vibrate(50);
                onHold();
            }
        }, holdDuration);
    };

    const endHold = (e) => {
        if (disabled) return;

        // Prevent mouse events if touch is active
        if ((e.type === 'mouseup' || e.type === 'mouseleave') && isTouchRef.current) {
            if (e.type === 'mouseup') {
                // Reset touch flag after a short delay to allow subsequent mouse interactions if needed (e.g. hybrid devices)
                setTimeout(() => { isTouchRef.current = false; }, 500);
            }
            return;
        }

        // Check for scroll/drag on touch
        if (e.type === 'touchend' && touchStartPos.current) {
            // Reset touch flag
            setTimeout(() => { isTouchRef.current = false; }, 500);

            const touch = e.changedTouches[0];
            const dx = Math.abs(touch.clientX - touchStartPos.current.x);
            const dy = Math.abs(touch.clientY - touchStartPos.current.y);
            if (dx > 10 || dy > 10) {
                clearTimeout(timeoutRef.current);
                setIsHolding(false);
                return;
            }
        }

        clearTimeout(timeoutRef.current);
        setIsHolding(false);

        // If mouse leaves the button, cancel the action but DO NOT trigger click
        if (e.type === 'mouseleave') {
            return;
        }

        if (!isHoldActionRef.current && onClick) {
            onClick();
        }
    };

    return (
        <button
            disabled={disabled}
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            onContextMenu={(e) => e.preventDefault()}
            className={`${className} relative overflow-hidden select-none touch-none`}
        >
            <div
                className={`absolute inset-0 bg-current opacity-20 transition-all ease-linear origin-left ${isHolding ? 'w-full' : 'w-0'}`}
                style={{ transitionDuration: isHolding ? `${holdDuration}ms` : '0ms' }}
            />
            <div className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </div>
        </button>
    );
};

export default function Layout() {
    const {
        sessionName, setSessionName,
        resetSession,
        permanent, updatePermanent, resetPermanent,
        canAdvance,
        noRepeatTurns, setNoRepeatTurns,
        navOverride
    } = useGame();

    const [showSettings, setShowSettings] = useState(false);
    const [isSettingsClosing, setIsSettingsClosing] = useState(false);
    const [showSessionSettings, setShowSessionSettings] = useState(false);
    const [isSessionSettingsClosing, setIsSessionSettingsClosing] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isResetConfirmClosing, setIsResetConfirmClosing] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const steps = [
        { path: "/players", label: "Players" },
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

    const closeSettings = () => {
        setIsSettingsClosing(true);
        setTimeout(() => {
            setShowSettings(false);
            setIsSettingsClosing(false);
        }, 300);
    };

    const closeSessionSettings = () => {
        setIsSessionSettingsClosing(true);
        setTimeout(() => {
            setShowSessionSettings(false);
            setIsSessionSettingsClosing(false);
        }, 300);
    };

    const closeResetConfirm = () => {
        setIsResetConfirmClosing(true);
        setTimeout(() => {
            setShowResetConfirm(false);
            setIsResetConfirmClosing(false);
        }, 300);
    };

    const handleReset = () => {
        resetSession();
        closeResetConfirm();
        navigate("/");
    };

    // Navigation Logic
    const canAppBack = currentStepIndex > 0;
    const canAppNext = currentStepIndex < steps.length - 1 && canAdvance();

    const handleBackClick = () => {
        if (navOverride) {
            if (navOverride.onBack) navOverride.onBack();
        } else {
            goBack();
        }
    };

    const handleNextClick = () => {
        if (navOverride) {
            if (navOverride.onNext) navOverride.onNext();
        } else {
            goNext();
        }
    };

    const isBackDisabled = navOverride
        ? (!navOverride.onBack && !canAppBack)
        : !canAppBack;

    const isNextDisabled = navOverride
        ? (!navOverride.onNext && !canAppNext)
        : !canAppNext;

    return (
        <div className="h-[100dvh] bg-dark text-zinc-300 flex flex-col font-serif selection:bg-crimson-900 selection:text-white overflow-hidden">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-crimson-900/10 via-dark to-dark pointer-events-none z-0" />

            {(showResetConfirm || isResetConfirmClosing) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className={`absolute inset-0 bg-black/90 backdrop-blur-sm ${isResetConfirmClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={closeResetConfirm} />
                    <div className={`relative bg-dark-surface border border-crimson-900/30 p-8 max-w-md w-full shadow-[0_0_30px_rgba(220,20,60,0.15)] ${isResetConfirmClosing ? 'animate-slide-out-bottom' : 'animate-slide-in-bottom'}`}>
                        <h3 className="text-xl font-bold text-crimson-500 font-display uppercase tracking-widest mb-4">Reset Session?</h3>
                        <p className="text-zinc-400 mb-8 leading-relaxed text-sm">
                            This will remove all players, consents, preferences, and history. Your custom settings (activities, tools, etc.) will be preserved.
                            <br /><br />
                            Are you sure you want to start over?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={closeResetConfirm}
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

            {(showSettings || isSettingsClosing) && (
                <SettingsView
                    data={permanent}
                    isClosing={isSettingsClosing}
                    onSave={(newData) => {
                        updatePermanent(newData);
                    }}
                    onClose={closeSettings}
                    onReset={() => {
                        if (confirm("Reset all game data to defaults? This cannot be undone.")) {
                            resetPermanent();
                            closeSettings();
                        }
                    }}
                />
            )}

            {(showSessionSettings || isSessionSettingsClosing) && (
                <SessionSettingsView
                    isClosing={isSessionSettingsClosing}
                    onClose={closeSessionSettings}
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
                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={() => setShowResetConfirm(true)} className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-crimson-500 transition-colors mr-2">
                            Reset Session
                        </button>
                        <button onClick={() => setShowSessionSettings(true)} className="p-2 text-zinc-500 hover:text-crimson-400 transition-colors hover:bg-crimson-900/10" title="Session Settings">
                            <Users className="w-5 h-5" />
                        </button>
                        <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-500 hover:text-crimson-400 transition-colors hover:bg-crimson-900/10" title="Game Settings">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile Actions */}
                    <div className="md:hidden relative">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="p-2 text-zinc-500 hover:text-crimson-400 transition-colors"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {showMobileMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-dark-surface border border-crimson-900/30 shadow-xl z-50 py-2 animate-slide-down">
                                    <button
                                        onClick={() => { setShowResetConfirm(true); setShowMobileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:bg-crimson-900/10 hover:text-crimson-400 transition-colors uppercase tracking-wider"
                                    >
                                        Reset Session
                                    </button>
                                    <button
                                        onClick={() => { setShowSessionSettings(true); setShowMobileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:bg-crimson-900/10 hover:text-crimson-400 transition-colors uppercase tracking-wider"
                                    >
                                        Session Settings
                                    </button>
                                    <button
                                        onClick={() => { setShowSettings(true); setShowMobileMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:bg-crimson-900/10 hover:text-crimson-400 transition-colors uppercase tracking-wider"
                                    >
                                        Game Settings
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="relative z-10 flex-1 flex flex-col max-w-6xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-6 min-h-0">
                <div className="flex-1 flex items-center justify-center h-full gap-6">
                    <NavButton
                        disabled={isBackDisabled}
                        onClick={handleBackClick}
                        onHold={goBack}
                        className="hidden lg:flex p-4 hover:bg-crimson-900/5 disabled:opacity-0 text-zinc-600 hover:text-crimson-500 transition-all duration-300 border border-transparent hover:border-crimson-900/20 rounded-full"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </NavButton>

                    <div className="flex-1 w-full h-full max-w-3xl overflow-hidden flex flex-col relative">
                        <div key={location.pathname} className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-crimson-900/20 scrollbar-track-transparent p-4 md:p-8 animate-fade-in">
                            <Outlet />
                        </div>
                    </div>

                    <NavButton
                        disabled={isNextDisabled}
                        onClick={handleNextClick}
                        onHold={goNext}
                        className="hidden lg:flex p-4 hover:bg-crimson-900/5 disabled:opacity-0 text-zinc-600 hover:text-crimson-500 transition-all duration-300 border border-transparent hover:border-crimson-900/20 rounded-full"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </NavButton>
                </div>
            </div>

            {/* Mobile Navigation Arrows */}
            <div className="lg:hidden p-4 border-t border-crimson-900/30 bg-dark-surface flex justify-between gap-4 sticky bottom-0 z-40 backdrop-blur-md">
                <NavButton
                    disabled={isBackDisabled}
                    onClick={handleBackClick}
                    onHold={goBack}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-zinc-800 text-zinc-400 uppercase tracking-wider text-sm hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> {navOverride?.backLabel || "Back"}
                </NavButton>
                <NavButton
                    disabled={isNextDisabled}
                    onClick={handleNextClick}
                    onHold={goNext}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-crimson-600/50 bg-crimson-900/10 text-crimson-100 uppercase tracking-wider text-sm hover:bg-crimson-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-[0_0_10px_rgba(220,20,60,0.1)]"
                >
                    {navOverride?.nextLabel || "Next"} <ChevronRight className="w-4 h-4" />
                </NavButton>
            </div>
        </div >
    );
}
