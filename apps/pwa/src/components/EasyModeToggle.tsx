import { useI18n } from '../lib/i18n';
import { useKuka } from '../lib/context';
export default function EasyModeToggle() {
  const { t } = useI18n();
  const { easyMode, setEasyMode, notify } = useKuka();
  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={easyMode}
        aria-label={t('Easy mode')}
        aria-describedby="easy-mode-description"
        className="easy-mode-toggle"
        onClick={() => {
          setEasyMode(!easyMode);
          notify(
            t(
              easyMode
                ? 'Standard dashboard restored. Your records are unchanged.'
                : 'Easy mode on. Larger controls and step-by-step help.',
            ),
          );
        }}
      >
        <span className="mode-switch-track" aria-hidden="true">
          <span />
        </span>
        <span>{t('Easy mode')}</span>
        <strong aria-hidden="true">{t(easyMode ? 'On' : 'Off')}</strong>
      </button>
      <span className="visually-hidden" id="easy-mode-description">
        {t(
          'Use larger text, clearer names, and help for everyday tasks. Switch off to return to the standard dashboard. Your records stay the same.',
        )}
      </span>
    </>
  );
}
