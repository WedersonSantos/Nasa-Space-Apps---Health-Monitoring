// Interface language: English by default, Portuguese on demand (header toggle).
// Every user-facing string in the UI is a bilingual pair { en, pt } resolved with useT() or tx().

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setFormatLang } from '../lib/format';

export type Lang = 'en' | 'pt';

/** A bilingual string. */
export interface L10n {
  en: string;
  pt: string;
}

export const LANG_LABEL: Record<Lang, { code: string; name: string }> = {
  en: { code: 'EN', name: 'English' },
  pt: { code: 'PT', name: 'Português' },
};

/** Resolve a bilingual string (plain strings pass through untouched). */
export function tx(s: L10n | string, lang: Lang): string {
  return typeof s === 'string' ? s : s[lang];
}

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangState>({ lang: 'en', setLang: () => {} });

/** The site always starts in English; the toggle switches it for this visit. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  setFormatLang(lang); // formatting follows the language on every render of the tree
  const setLang = useCallback((l: Lang) => setLangState(l), []);
  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangState {
  return useContext(LangContext);
}

/** `const t = useT(); t({ en: 'Overview', pt: 'Visão geral' })` */
export function useT() {
  const { lang } = useLang();
  return useCallback((s: L10n | string) => tx(s, lang), [lang]);
}
