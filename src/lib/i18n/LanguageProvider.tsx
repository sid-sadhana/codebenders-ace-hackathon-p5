"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LANG,
  LANG_STORAGE_KEY,
  type Lang,
  type LocalizedString,
} from "./types";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (s: LocalizedString) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Start with the default so server and first client render match.
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // On mount, restore the saved language (if any).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === "te" || saved === "en") setLangState(saved);
    } catch {
      // localStorage unavailable; keep default.
    }
  }, []);

  // Keep the document language in sync.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Only persist on explicit user change, not on mount.
  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const t = useCallback(
    (s: LocalizedString): string => s[lang] || s.en,
    [lang],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (ctx === null) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
