import React from "react";

export function Section({ title, children }) {
    return (
        <div className="mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-crimson-500 uppercase tracking-widest border-b border-crimson-900/30 pb-2">{title}</h2>
            {children}
        </div>
    );
}

export function Pill({ active, onClick, children }) {
    return (
        <button onClick={onClick} className={`px-3 py-1 rounded-none border text-xs sm:text-sm transition-all duration-300 whitespace-nowrap uppercase tracking-wider ${active ? "bg-crimson-900/40 border-crimson-500 text-crimson-100 shadow-[0_0_10px_rgba(220,20,60,0.2)]" : "border-zinc-800 text-zinc-500 hover:border-crimson-900 hover:text-crimson-300 hover:bg-dark-elevated"}`}>
            {children}
        </button>
    );
}
