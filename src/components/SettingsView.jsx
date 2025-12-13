import React, { useState } from "react";
import { X, ChevronDown, Edit2, Trash2 } from "lucide-react";

export function SettingsView({ data, onSave, onClose, onReset, isClosing }) {
    const [localData, setLocalData] = useState(JSON.parse(JSON.stringify(data)));
    const [tab, setTab] = useState("activities");
    const [editingItem, setEditingItem] = useState(null);
    const [isBodyPartDropdownOpen, setIsBodyPartDropdownOpen] = useState(false);
    const [isAllowedActivitiesDropdownOpen, setIsAllowedActivitiesDropdownOpen] = useState(false);

    const tabs = ["activities", "body_parts", "tools"];

    const updateItem = (field, value) => {
        setEditingItem(prev => ({ ...prev, [field]: value }));
    };

    const saveItem = () => {
        const newData = { ...localData };
        const collection = tab;

        // Auto-generate slug from verb (for activities) or name (for others)
        let sourceText = editingItem.name;
        if (tab === 'activities' && editingItem.verb) {
            sourceText = editingItem.verb;
        }

        const newSlug = sourceText.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w_]/g, '');

        // If we are renaming (slug changed), we need to handle references
        const oldSlug = editingItem.slug;
        editingItem.slug = newSlug;

        // Check if item exists by old slug (editing) or if it's a new item
        const idx = newData[collection].findIndex(i => i.slug === oldSlug);

        if (idx >= 0) {
            // Update existing
            newData[collection][idx] = editingItem;

            // If slug changed, update references in other collections
            if (oldSlug && oldSlug !== newSlug) {
                if (tab === 'activities') {
                    // Update references in tools.allowed_activities
                    newData.tools.forEach(t => {
                        if (t.allowed_activities) {
                            const actIdx = t.allowed_activities.indexOf(oldSlug);
                            if (actIdx !== -1) {
                                t.allowed_activities[actIdx] = newSlug;
                            }
                        }
                    });
                }
            }
        } else {
            // Add new
            newData[collection].push(editingItem);
        }

        setLocalData(newData);
        setEditingItem(null);
        onSave(newData);
    };

    const deleteItem = (slug) => {
        if (!confirm("Delete this item?")) return;
        const newData = { ...localData };
        newData[tab] = newData[tab].filter(i => i.slug !== slug);
        setLocalData(newData);
        onSave(newData);
    };

    const startEdit = (item) => {
        const copy = { ...item };
        if (tab === 'tools') {
            copy.allowed_activities = copy.allowed_activities || [];
        }
        if (tab === 'activities') {
            copy.default_targets = copy.default_targets || [];
        }
        setEditingItem(copy);
    };

    const startNew = () => {
        const base = { slug: "", name: "" };
        if (tab === 'activities') {
            Object.assign(base, {
                verb: "", preposition: "on", with_word: "with",
                has_body_part: true, has_duration: false, has_repetitions: false, default_targets: [],
                giving_text: "", receiving_text: "", has_tools: true
            });
        } else if (tab === 'body_parts') {
            Object.assign(base, { genders: ["M", "F"], is_actor: false, allowed_activities: [] });
        } else if (tab === 'tools') {
            Object.assign(base, { always_available: false, implicit: false, allowed_activities: [] });
        }
        setEditingItem(base);
    };

    const exportSettings = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "kinkdare_settings.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const importSettings = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (imported.activities && imported.body_parts && imported.tools) {
                        setLocalData(imported);
                        onSave(imported);
                        alert("Settings imported successfully!");
                    } else {
                        alert("Invalid settings file format.");
                    }
                } catch (err) {
                    alert("Error parsing JSON file.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

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

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-crimson-900/20 pb-4 pr-8">
                        <h2 className="text-2xl font-bold text-crimson-500 font-display uppercase tracking-widest">Settings</h2>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={importSettings} className="px-3 py-2 rounded-none border border-zinc-800 text-zinc-400 hover:border-crimson-900 hover:text-crimson-300 hover:bg-dark-elevated text-xs uppercase tracking-wider transition-all">Import</button>
                            <button onClick={exportSettings} className="px-3 py-2 rounded-none border border-zinc-800 text-zinc-400 hover:border-crimson-900 hover:text-crimson-300 hover:bg-dark-elevated text-xs uppercase tracking-wider transition-all">Export</button>
                            <button onClick={onReset} className="px-3 py-2 rounded-none border border-red-900/50 text-red-400 hover:bg-red-900/10 text-xs uppercase tracking-wider transition-all">Reset Defaults</button>
                        </div>
                    </div>

                    {!editingItem ? (
                        <>
                            <div className="flex gap-2 mb-4 border-b border-zinc-800 pb-4">
                                {tabs.map(t => (
                                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-none uppercase tracking-wider text-xs transition-all ${tab === t ? "bg-crimson-900/20 text-crimson-400 border-b-2 border-crimson-600" : "text-zinc-500 hover:text-zinc-300 hover:bg-dark-elevated"}`}>
                                        {t.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                            <div className="mb-4">
                                <button onClick={startNew} className="w-full py-3 border border-dashed border-zinc-800 rounded-none text-zinc-600 hover:border-crimson-900/50 hover:text-crimson-400 hover:bg-crimson-900/5 transition-all uppercase tracking-widest text-xs">+ Add New {tab.slice(0, -1).replace('_', ' ')}</button>
                            </div>
                            <div className="grid gap-2">
                                {localData[tab].map(item => (
                                    <div key={item.slug} className="flex justify-between items-center p-3 bg-dark-elevated rounded-none border border-zinc-800 hover:border-crimson-900/30 transition-colors">
                                        <div>
                                            <div className="font-medium text-zinc-300">{item.name}</div>
                                            <div className="text-xs text-zinc-600 font-mono">{item.slug}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(item)} className="p-2 text-zinc-400 hover:text-crimson-400 hover:bg-dark border border-transparent hover:border-crimson-900/50 transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteItem(item.slug)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-dark border border-transparent hover:border-red-900/30 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                                <h3 className="text-xl font-semibold text-crimson-500 font-display">Edit {tab.slice(0, -1).replace('_', ' ')}</h3>
                                <button onClick={() => setEditingItem(null)} className="text-zinc-500 hover:text-crimson-400 uppercase tracking-wider text-xs">Back</button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-full">
                                    <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Name</label>
                                    <input value={editingItem.name} onChange={e => updateItem('name', e.target.value)} className="w-full bg-dark border border-zinc-800 rounded-none p-2 text-zinc-300 focus:border-crimson-600 focus:outline-none" />
                                </div>

                                {tab === 'activities' && (
                                    <>
                                        <div><label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Verb</label><input value={editingItem.verb} onChange={e => updateItem('verb', e.target.value)} className="w-full bg-dark border border-zinc-800 rounded-none p-2 text-zinc-300 focus:border-crimson-600 focus:outline-none" /></div>
                                        <div><label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Preposition</label><input value={editingItem.preposition} onChange={e => updateItem('preposition', e.target.value)} className="w-full bg-dark border border-zinc-800 rounded-none p-2 text-zinc-300 focus:border-crimson-600 focus:outline-none" /></div>
                                        <div><label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">"With" Word</label><input value={editingItem.with_word} onChange={e => updateItem('with_word', e.target.value)} className="w-full bg-dark border border-zinc-800 rounded-none p-2 text-zinc-300 focus:border-crimson-600 focus:outline-none" /></div>
                                        <div><label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Giving Text</label><input value={editingItem.giving_text || ""} onChange={e => updateItem('giving_text', e.target.value)} className="w-full bg-dark border border-zinc-800 rounded-none p-2 text-zinc-300 focus:border-crimson-600 focus:outline-none" placeholder="e.g. to spank" /></div>
                                        <div><label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Receiving Text</label><input value={editingItem.receiving_text || ""} onChange={e => updateItem('receiving_text', e.target.value)} className="w-full bg-dark border border-zinc-800 rounded-none p-2 text-zinc-300 focus:border-crimson-600 focus:outline-none" placeholder="e.g. be spanked" /></div>

                                        <div className="col-span-full space-y-2 p-4 bg-dark-elevated border border-zinc-800/50">
                                            <div className="flex gap-6">
                                                <label className="flex items-center gap-2 text-zinc-300"><input type="checkbox" checked={editingItem.has_body_part} onChange={e => updateItem('has_body_part', e.target.checked)} className="accent-crimson-600" /> Has Body Part (Target)</label>
                                                <label className="flex items-center gap-2 text-zinc-300"><input type="checkbox" checked={editingItem.has_tools !== false} onChange={e => updateItem('has_tools', e.target.checked)} className="accent-crimson-600" /> Has Tools</label>
                                            </div>

                                            {editingItem.has_body_part && (
                                                <div className="mt-4 space-y-4">
                                                    {/* Mobile Dropdown */}
                                                    <div className="relative md:hidden">
                                                        <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Default Target Body Parts</div>
                                                        <button
                                                            onClick={() => setIsBodyPartDropdownOpen(!isBodyPartDropdownOpen)}
                                                            className="w-full flex items-center justify-between bg-dark border border-zinc-800 p-2 text-sm text-zinc-300 hover:border-crimson-900/50 transition-colors"
                                                        >
                                                            <span>
                                                                {editingItem.default_targets?.length
                                                                    ? `${editingItem.default_targets.length} selected`
                                                                    : "Select Body Parts"}
                                                            </span>
                                                            <ChevronDown className={`w-4 h-4 transition-transform ${isBodyPartDropdownOpen ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {isBodyPartDropdownOpen && (
                                                            <div className="absolute z-10 w-full mt-1 bg-dark-surface border border-zinc-700 shadow-xl max-h-60 overflow-y-auto p-2">
                                                                <div className="flex flex-col gap-1">
                                                                    {localData.body_parts.map(bp => (
                                                                        <label key={bp.slug} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800 cursor-pointer transition-colors">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="accent-crimson-600"
                                                                                checked={editingItem.default_targets?.includes(bp.slug)}
                                                                                onChange={e => {
                                                                                    const current = editingItem.default_targets || [];
                                                                                    const newTargets = e.target.checked
                                                                                        ? [...current, bp.slug]
                                                                                        : current.filter(s => s !== bp.slug);
                                                                                    updateItem('default_targets', newTargets);
                                                                                }}
                                                                            />
                                                                            <span className={`text-sm ${editingItem.default_targets?.includes(bp.slug) ? 'text-crimson-200' : 'text-zinc-400'}`}>
                                                                                {bp.name}
                                                                            </span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Desktop List */}
                                                    <div className="hidden md:block">
                                                        <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Default Target Body Parts</div>
                                                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 bg-dark rounded-none border border-zinc-800">
                                                            {localData.body_parts.map(bp => (
                                                                <label key={bp.slug} className={`px-2 py-1 rounded-none text-xs cursor-pointer border transition-colors ${editingItem.default_targets?.includes(bp.slug) ? 'bg-crimson-900/30 border-crimson-800 text-crimson-200' : 'border-transparent hover:bg-zinc-900 text-zinc-400'}`}>
                                                                    <input type="checkbox" className="hidden" checked={editingItem.default_targets?.includes(bp.slug)} onChange={e => {
                                                                        const current = editingItem.default_targets || [];
                                                                        const newTargets = e.target.checked
                                                                            ? [...current, bp.slug]
                                                                            : current.filter(s => s !== bp.slug);
                                                                        updateItem('default_targets', newTargets);
                                                                    }} />
                                                                    {bp.name}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="flex items-center gap-2 text-zinc-300 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={editingItem.restrict_to_default_targets}
                                                                onChange={e => updateItem('restrict_to_default_targets', e.target.checked)}
                                                                className="accent-crimson-600"
                                                            />
                                                            Restrict selection to Default Targets only
                                                        </label>
                                                        <label className="flex items-center gap-2 text-zinc-300 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={editingItem.enforce_default_targets}
                                                                onChange={e => updateItem('enforce_default_targets', e.target.checked)}
                                                                className="accent-crimson-600"
                                                            />
                                                            Enforce Default Targets (cannot be unchecked)
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-full grid grid-cols-2 gap-4 p-4 bg-dark-elevated border border-zinc-800/50">
                                            <div>
                                                <label className="flex items-center gap-2 mb-2 text-zinc-300"><input type="checkbox" checked={editingItem.has_duration} onChange={e => updateItem('has_duration', e.target.checked)} className="accent-crimson-600" /> Has Duration (seconds)</label>
                                                {editingItem.has_duration && (
                                                    <div className="flex gap-2">
                                                        <input type="number" placeholder="Min Sec" value={editingItem.min_seconds || 0} onChange={e => updateItem('min_seconds', parseInt(e.target.value))} className="w-full bg-dark border border-zinc-800 rounded-none p-1 text-sm text-zinc-300 focus:border-crimson-600 focus:outline-none" />
                                                        <input type="number" placeholder="Max Sec" value={editingItem.max_seconds || 0} onChange={e => updateItem('max_seconds', parseInt(e.target.value))} className="w-full bg-dark border border-zinc-800 rounded-none p-1 text-sm text-zinc-300 focus:border-crimson-600 focus:outline-none" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-2 mb-2 text-zinc-300"><input type="checkbox" checked={editingItem.has_repetitions} onChange={e => updateItem('has_repetitions', e.target.checked)} className="accent-crimson-600" /> Has Repetitions</label>
                                                {editingItem.has_repetitions && (
                                                    <div className="flex gap-2">
                                                        <input type="number" placeholder="Min Reps" value={editingItem.min_reps || 0} onChange={e => updateItem('min_reps', parseInt(e.target.value))} className="w-full bg-dark border border-zinc-800 rounded-none p-1 text-sm text-zinc-300 focus:border-crimson-600 focus:outline-none" />
                                                        <input type="number" placeholder="Max Reps" value={editingItem.max_reps || 0} onChange={e => updateItem('max_reps', parseInt(e.target.value))} className="w-full bg-dark border border-zinc-800 rounded-none p-1 text-sm text-zinc-300 focus:border-crimson-600 focus:outline-none" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {tab === 'body_parts' && (
                                    <>
                                        <div className="col-span-full">
                                            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Genders</label>
                                            <div className="flex gap-2">
                                                {["M", "F"].map(g => (
                                                    <label key={g} className="flex items-center gap-2 bg-dark px-3 py-2 rounded-none border border-zinc-800 text-zinc-300 cursor-pointer hover:bg-zinc-900">
                                                        <input type="checkbox" checked={editingItem.genders.includes(g)} onChange={e => {
                                                            const newG = e.target.checked ? [...editingItem.genders, g] : editingItem.genders.filter(x => x !== g);
                                                            updateItem('genders', newG);
                                                        }} className="accent-crimson-600" />
                                                        {g}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-span-full mt-4">
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 text-zinc-300 mb-2">
                                                    <input type="checkbox" checked={editingItem.is_actor} onChange={e => updateItem('is_actor', e.target.checked)} className="accent-crimson-600" />
                                                    Can be used as Actor (Tool)
                                                </label>
                                                {editingItem.is_actor && (
                                                    <label className="flex items-center gap-2 text-zinc-300 mb-2">
                                                        <input type="checkbox" checked={editingItem.implicit} onChange={e => updateItem('implicit', e.target.checked)} className="accent-crimson-600" />
                                                        Implicit (e.g. "kiss" implies mouth)
                                                    </label>
                                                )}
                                            </div>

                                            {editingItem.is_actor && (
                                                <div className="space-y-2 p-4 bg-dark-elevated border border-zinc-800/50">
                                                    <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Allowed Activities as Actor</div>
                                                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 bg-dark rounded-none border border-zinc-800">
                                                        {localData.activities.map(act => (
                                                            <label key={act.slug} className={`px-2 py-1 rounded-none text-xs cursor-pointer border transition-colors ${editingItem.allowed_activities?.includes(act.slug) ? 'bg-crimson-900/30 border-crimson-800 text-crimson-200' : 'border-transparent hover:bg-zinc-900 text-zinc-400'}`}>
                                                                <input type="checkbox" className="hidden" checked={editingItem.allowed_activities?.includes(act.slug)} onChange={e => {
                                                                    const current = editingItem.allowed_activities || [];
                                                                    const newActs = e.target.checked
                                                                        ? [...current, act.slug]
                                                                        : current.filter(s => s !== act.slug);
                                                                    updateItem('allowed_activities', newActs);
                                                                }} />
                                                                {act.name}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {tab === 'tools' && (
                                    <>
                                        <div className="col-span-full flex gap-4 flex-wrap">
                                            <label className="flex items-center gap-2 text-zinc-300"><input type="checkbox" checked={editingItem.always_available} onChange={e => updateItem('always_available', e.target.checked)} className="accent-crimson-600" /> Always Available</label>
                                            <label className="flex items-center gap-2 text-zinc-300"><input type="checkbox" checked={editingItem.implicit} onChange={e => updateItem('implicit', e.target.checked)} className="accent-crimson-600" /> Implicit (e.g. body part)</label>
                                        </div>

                                        <div className="col-span-full space-y-2 p-4 bg-dark-elevated border border-zinc-800/50">
                                            {/* Mobile Dropdown */}
                                            <div className="relative md:hidden">
                                                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Allowed Activities</div>
                                                <button
                                                    onClick={() => setIsAllowedActivitiesDropdownOpen(!isAllowedActivitiesDropdownOpen)}
                                                    className="w-full flex items-center justify-between bg-dark border border-zinc-800 p-2 text-sm text-zinc-300 hover:border-crimson-900/50 transition-colors"
                                                >
                                                    <span>
                                                        {editingItem.allowed_activities?.length
                                                            ? `${editingItem.allowed_activities.length} selected`
                                                            : "Select Activities"}
                                                    </span>
                                                    <ChevronDown className={`w-4 h-4 transition-transform ${isAllowedActivitiesDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isAllowedActivitiesDropdownOpen && (
                                                    <div className="absolute z-10 w-full mt-1 bg-dark-surface border border-zinc-700 shadow-xl max-h-60 overflow-y-auto p-2">
                                                        <div className="flex flex-col gap-1">
                                                            {localData.activities.map(act => (
                                                                <label key={act.slug} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800 cursor-pointer transition-colors">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="accent-crimson-600"
                                                                        checked={editingItem.allowed_activities?.includes(act.slug)}
                                                                        onChange={e => {
                                                                            const current = editingItem.allowed_activities || [];
                                                                            const newActs = e.target.checked
                                                                                ? [...current, act.slug]
                                                                                : current.filter(s => s !== act.slug);
                                                                            updateItem('allowed_activities', newActs);
                                                                        }}
                                                                    />
                                                                    <span className={`text-sm ${editingItem.allowed_activities?.includes(act.slug) ? 'text-crimson-200' : 'text-zinc-400'}`}>
                                                                        {act.name}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Desktop List */}
                                            <div className="hidden md:block">
                                                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Allowed Activities</div>
                                                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 bg-dark rounded-none border border-zinc-800">
                                                    {localData.activities.map(act => (
                                                        <label key={act.slug} className={`px-2 py-1 rounded-none text-xs cursor-pointer border transition-colors ${editingItem.allowed_activities?.includes(act.slug) ? 'bg-crimson-900/30 border-crimson-800 text-crimson-200' : 'border-transparent hover:bg-zinc-900 text-zinc-400'}`}>
                                                            <input type="checkbox" className="hidden" checked={editingItem.allowed_activities?.includes(act.slug)} onChange={e => {
                                                                const current = editingItem.allowed_activities || [];
                                                                const newActs = e.target.checked
                                                                    ? [...current, act.slug]
                                                                    : current.filter(s => s !== act.slug);
                                                                updateItem('allowed_activities', newActs);
                                                            }} />
                                                            {act.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setEditingItem(null)} className="px-4 py-2 rounded-none border border-zinc-800 text-zinc-400 hover:border-crimson-900 hover:text-crimson-300 hover:bg-dark-elevated uppercase tracking-wider text-sm">Cancel</button>
                                <button onClick={saveItem} className="px-4 py-2 rounded-none bg-crimson-900/80 text-white hover:bg-crimson-800 uppercase tracking-wider text-sm shadow-[0_0_10px_rgba(220,20,60,0.2)]">Save Item</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
