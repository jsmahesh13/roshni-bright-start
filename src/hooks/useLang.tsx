import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { LANGS, t as translate, type Lang, type TKey } from "@/lib/i18n";

const STORAGE_KEY = "roshni.lang";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey | string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Read after hydration — a localStorage read during render mismatches SSR.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "hi" || stored === "kn" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("lang-hi", "lang-kn");
    if (lang !== "en") root.classList.add(`lang-${lang}`);
    root.setAttribute("lang", lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage may be unavailable — the choice just won't persist */
    }
  }, []);

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t: (key) => translate(key, lang) }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}

export function useT(): (key: TKey | string) => string {
  return useLang().t;
}

export { LANGS };
export type { Lang };
