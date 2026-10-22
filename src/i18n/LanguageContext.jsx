import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
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

  // Signed-in preference wins when the account has one; otherwise the visitor's
  // current selection is preserved (requirement: account preference when
  // available, else keep current or default English).
  useEffect(() => {
    const pref = user?.language;
    if ((pref === "en" || pref === "es") && pref !== readStoredLang()) {
      setLangState(pref);
    }
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
    if (user) {
      base44.auth.updateMe({ language: code }).catch(() => {});
    }
  }, [user]);

  const value = useMemo(() => ({
    lang,
    setLang,
    locale: lang === "es" ? "es-419" : "en-US",
    t: (key, vars) => translate(lang, key, vars),
    tn: (key, count, vars) => translatePlural(lang, key, count, vars),
  }), [lang, setLang]);

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