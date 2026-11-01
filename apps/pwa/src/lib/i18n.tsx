import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { shellTranslations } from '../locales/shell';
import { entryTranslations } from '../locales/entry';
import { workspaceTranslations } from '../locales/workspace';
import { lessonTranslations } from '../locales/lessons';
import { editorialTranslations } from '../locales/editorial';
import { backupTranslations } from '../locales/backup';
import { deviceTranslations } from '../locales/device';

export const languages = [
  { code: 'en', name: 'English', locale: 'en-IN' },
  { code: 'hi', name: 'हिन्दी', locale: 'hi-IN' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', locale: 'pa-IN' },
] as const;
export type Language = (typeof languages)[number]['code'];
export type TranslationValues = Record<string, string | number>;
const messages: Record<string, readonly [string, string]> = {
  ...shellTranslations,
  ...entryTranslations,
  ...workspaceTranslations,
  ...lessonTranslations,
  ...editorialTranslations,
  ...backupTranslations,
  ...deviceTranslations,
};
export const languageStorageKey = 'smriva-language';
const punjabiMonths = [
  'ਜਨਵਰੀ',
  'ਫ਼ਰਵਰੀ',
  'ਮਾਰਚ',
  'ਅਪ੍ਰੈਲ',
  'ਮਈ',
  'ਜੂਨ',
  'ਜੁਲਾਈ',
  'ਅਗਸਤ',
  'ਸਤੰਬਰ',
  'ਅਕਤੂਬਰ',
  'ਨਵੰਬਰ',
  'ਦਸੰਬਰ',
];
/** Some Chrome builds omit Punjabi month names from ICU; keep these labels readable offline. */
export function formatDisplayDate(date: Date, locale: string, month: 'short' | 'long' = 'long') {
  if (locale.startsWith('pa'))
    return `${date.getDate()} ${punjabiMonths[date.getMonth()]} ${date.getFullYear()}`;
  return date.toLocaleDateString(locale, { day: 'numeric', month, year: 'numeric' });
}
export function validLanguage(value: unknown): Language {
  return value === 'hi' || value === 'pa' ? value : 'en';
}
export function translate(language: Language, source: string, values: TranslationValues = {}): string {
  const template = language === 'en' ? source : (messages[source]?.[language === 'hi' ? 0 : 1] ?? source);
  // Only explicit placeholders are interpolated. User-entered values never enter the message lookup.
  return template.replace(/\{([a-zA-Z][\w]*)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}
function savedLanguage(): Language {
  try {
    return validLanguage(localStorage.getItem(languageStorageKey));
  } catch {
    return 'en';
  }
}
const I18nContext = createContext({
  language: 'en' as Language,
  locale: 'en-IN',
  setLanguage: (_language: Language) => {},
  t: (source: string, values?: TranslationValues) => translate('en', source, values),
});
export const useI18n = () => useContext(I18nContext);
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(savedLanguage);
  const setLanguage = useCallback((next: Language) => updateLanguage(validLanguage(next)), []);
  const t = useCallback(
    (source: string, values?: TranslationValues) => translate(language, source, values),
    [language],
  );
  const locale = languages.find((entry) => entry.code === language)!.locale;
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    document.documentElement.dataset.language = language;
    try {
      localStorage.setItem(languageStorageKey, language);
    } catch {
      // This session remains usable when browser preference storage is unavailable.
    }
  }, [language]);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === languageStorageKey) updateLanguage(validLanguage(event.newValue));
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  const value = useMemo(() => ({ language, locale, setLanguage, t }), [language, locale, setLanguage, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
