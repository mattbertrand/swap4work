import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { translate, translatePlural } from "./index";

const STORAGE_KEY = "s4w_language";
export const LANGUAGES = [
  { code: "en", name: "English", short: "EN" },
  { code: "es", name: "Español", short: "ES" },
];

const LanguageContext = createContext(null);

function readStoredLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "es") return saved;
  } catch (e) { /* storage unavailable */ }
  return "en";
}

export function LanguageProvider({ user, children }) {
  // Start from browser storage so the language applies before auth resolves.
  const [lang, setLangState] = useState(readStoredLang);

  const loadedUser = useRef(null);
  const pendingSave = useRef(Promise.resolve());
  const [saveError, setSaveError] = useState(false);
  // Hydrate once per account, not after unrelated profile refreshes. Never remount forms.
  useEffect(() => {
    if (!user) { loadedUser.current = null; return; }
    if (loadedUser.current === user.id) return;
    loadedUser.current = user.id;
    const pref = ['en', 'es'].includes(user.language) ? user.language : readStoredLang();
    setLangState(pref);
    try { localStorage.setItem(STORAGE_KEY, pref); } catch { /* storage unavailable */ }
  }, [user?.id, user?.language]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code) => {
    if (code !== "en" && code !== "es") return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) { /* storage unavailable */ }
    // Persist to the account in the background — never blocks or interrupts
    // the current page (no navigation, no reload, forms keep their state).
    setSaveError(false);
    if (user) {
      // Serialize rapid selections so an older request cannot win on the server.
      pendingSave.current = pendingSave.current.then(() => base44.auth.updateMe({ language: code })).catch(() => setSaveError(true));
    }
  }, [user]);

  const value = useMemo(() => ({
    lang,
    setLang,
    saveError,
    locale: lang === "es" ? "es-419" : "en-US",
    t: (key, vars) => translate(lang, key, vars),
    tn: (key, count, vars) => translatePlural(lang, key, count, vars),
  }), [lang, setLang, saveError]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// Bridges AuthContext into LanguageProvider (AuthProvider must wrap it).
export function LanguageGate({ children }) {
  const { user } = useAuth();
  return <LanguageProvider user={user}>{children}</LanguageProvider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback so a stray usage outside the provider still renders English.
    return { lang: "en", setLang: () => {}, locale: "en-US", t: (k, v) => translate("en", k, v), tn: (k, c, v) => translatePlural("en", k, c, v) };
  }
  return ctx;
}

// Convenience hook: just the translator.
export function useT() {
  return useLanguage().t;
}