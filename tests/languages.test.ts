import { describe, expect, it } from 'vitest';
import { formatDisplayDate, languages, translate, validLanguage } from '../apps/pwa/src/lib/i18n';
import { shellTranslations } from '../apps/pwa/src/locales/shell';
import { entryTranslations } from '../apps/pwa/src/locales/entry';
import { workspaceTranslations } from '../apps/pwa/src/locales/workspace';
import { lessonTranslations } from '../apps/pwa/src/locales/lessons';
import { editorialTranslations } from '../apps/pwa/src/locales/editorial';
import { backupTranslations } from '../apps/pwa/src/locales/backup';
import { deviceTranslations } from '../apps/pwa/src/locales/device';

describe('offline interface languages', () => {
  it('provides Punjabi month names even on browsers without the full Punjabi date locale', () => {
    expect(formatDisplayDate(new Date(2026, 9, 31), 'pa-IN', 'short')).toBe('31 ਅਕਤੂਬਰ 2026');
    expect(formatDisplayDate(new Date(2026, 0, 1), 'pa-IN')).toBe('1 ਜਨਵਰੀ 2026');
    expect(formatDisplayDate(new Date(2026, 9, 31), 'en-IN')).toBe('31 October 2026');
  });
  it('restricts preference values to the three supported left-to-right languages', () => {
    expect(languages.map(({ code }) => code)).toEqual(['en', 'hi', 'pa']);
    expect(languages.map(({ name }) => name)).toEqual(['English', 'हिन्दी', 'ਪੰਜਾਬੀ']);
    for (const value of [null, undefined, '', 'fr', 'hi-IN', '<script>', {}])
      expect(validLanguage(value)).toBe('en');
    expect(validLanguage('hi')).toBe('hi');
    expect(validLanguage('pa')).toBe('pa');
  });

  it('renders local messages and falls back to the original English without losing unknown content', () => {
    expect(translate('en', 'Your name')).toBe('Your name');
    expect(translate('hi', 'Your name')).toBe('आपका नाम');
    expect(translate('pa', 'Your name')).toBe('ਤੁਹਾਡਾ ਨਾਮ');
    expect(translate('hi', 'An original English resource')).toBe('An original English resource');
  });

  it('interpolates record-derived content verbatim instead of looking it up as interface copy', () => {
    expect(translate('hi', 'Share saved records: {status}', { status: 'Synced' })).toBe(
      'सहेजे रिकॉर्ड साझा करें: Synced',
    );
    const childName = 'Home <script> English ਪੰਜਾਬੀ';
    expect(translate('pa', 'Name: {name}', { name: childName })).toBe(`Name: ${childName}`);
    expect(translate('en', '{count} records / {pending}', { count: 0 })).toBe('0 records / {pending}');
    expect(translate('hi', '{name}', Object.create({ name: 'inherited' }))).toBe('{name}');
  });

  it('keeps every placeholder and supplies nonempty Hindi and Punjabi text throughout the catalogue', () => {
    const dictionaries = {
      ...shellTranslations,
      ...entryTranslations,
      ...workspaceTranslations,
      ...lessonTranslations,
      ...editorialTranslations,
      ...backupTranslations,
      ...deviceTranslations,
    };
    const placeholders = (message: string) =>
      [...message.matchAll(/\{([a-zA-Z][\w]*)\}/g)].map((match) => match[1]).sort();
    for (const [source, translated] of Object.entries(dictionaries)) {
      expect(translated, source).toHaveLength(2);
      for (const message of translated) {
        expect(message.trim().length, source).toBeGreaterThan(0);
        expect(placeholders(message), source).toEqual(placeholders(source));
      }
    }
  });
});
