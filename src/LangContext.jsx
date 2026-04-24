import { createContext, useContext, useState } from 'react';
import { t as translate } from './i18n.js';

/**
 * LangContext — provides language state to the entire app.
 *
 * Usage in any component:
 *   import { useT, useLang } from './LangContext.jsx';
 *
 *   // Get translation function:
 *   const t = useT();
 *   t('some.key')            // → translated string
 *   t('some.key', { n: 5 }) // → string with variable substitution
 *
 *   // Get lang + toggle (e.g. for the language switcher button):
 *   const { lang, toggleLang } = useLang();
 */

const LangContext = createContext({ lang: 'en', toggleLang: () => {} });

const LS_KEY = 'hf_lang';
const SUPPORTED = ['en', 'es'];

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return SUPPORTED.includes(saved) ? saved : 'es';
  });

  const toggleLang = () => {
    const next = lang === 'en' ? 'es' : 'en';
    setLang(next);
    localStorage.setItem(LS_KEY, next);
  };

  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

/** Returns a t(key, vars?) function bound to the current language. */
export function useT() {
  const { lang } = useContext(LangContext);
  return (key, vars) => translate(lang, key, vars);
}

/** Returns { lang, toggleLang } — use when you need to read or switch the language. */
export function useLang() {
  return useContext(LangContext);
}
