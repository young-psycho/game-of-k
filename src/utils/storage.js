const LS_KEY = "kinkdare.session.v1";
const SETTINGS_KEY = "kinkdare.settings.v1";

export const loadSession = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; }
};
export const saveSession = (s) => localStorage.setItem(LS_KEY, JSON.stringify(s));

export const loadSettings = () => {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null"); } catch { return null; }
};
export const saveSettings = (s) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
