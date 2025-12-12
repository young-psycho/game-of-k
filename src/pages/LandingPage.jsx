import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-dark text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-serif selection:bg-crimson-900 selection:text-white">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-40 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-crimson-900/30 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-crimson-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_100%)]"></div>
            </div>

            <div className="text-center space-y-12 z-10 relative">
                <div className="space-y-4">
                    <h1 className="text-6xl md:text-8xl font-bold text-crimson-600 font-display tracking-[0.1em] uppercase drop-shadow-[0_0_15px_rgba(220,20,60,0.6)] animate-fade-in">
                        Game of K
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-500 font-light tracking-[0.3em] uppercase border-t border-b border-crimson-900/30 py-2 inline-block">
                        by YoungPsycho
                    </p>
                </div>

                <div className="pt-16 animate-slide-up">
                    <button
                        onClick={() => navigate("/players")}
                        className="group relative px-12 py-6 bg-transparent hover:bg-crimson-900/10 text-crimson-500 border border-crimson-900 rounded-none text-xl font-display tracking-widest uppercase transition-all duration-500 hover:shadow-[0_0_30px_rgba(220,20,60,0.2)] hover:border-crimson-500"
                    >
                        <span className="relative z-10 group-hover:text-crimson-400 transition-colors">Start Session</span>
                        <div className="absolute inset-0 bg-crimson-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 text-zinc-600 text-xs uppercase tracking-widest opacity-50">
                Consent-first • Preference-aware • Private
            </div>
        </div>
    );
}
