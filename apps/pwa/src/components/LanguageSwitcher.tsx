import { Languages, Check } from 'lucide-react';
import { languages, useI18n } from '../lib/i18n';

/** Native buttons retain keyboard focus and never remount data-entry forms. */
export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  return (
    <section className="language-picker" aria-label={t('Interface language')}>
      <span className="language-picker-label">
        <Languages size={17} aria-hidden="true" />
        {t('Choose your language')}
      </span>
      <div className="language-options" role="group" aria-label={t('Interface language')}>
        {languages.map(({ code, name }) => (
          <button
            type="button"
            key={code}
            lang={code}
            className="language-option"
            aria-pressed={language === code}
            onClick={() => setLanguage(code)}
          >
            <span className="language-option-check" aria-hidden="true">
              {language === code && <Check size={14} />}
            </span>
            {name}
          </button>
        ))}
      </div>
      <span className="visually-hidden" aria-live="polite" aria-atomic="true">
        {t('Language changed to {language}', {
          language: languages.find((entry) => entry.code === language)!.name,
        })}
      </span>
    </section>
  );
}
