import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageTitle, Panel, Form, Notice, Empty } from '../components/UI';
import { useKuka } from '../lib/context';
import { useI18n } from '../lib/i18n';
import { vault } from '../lib/vault';
import { localDate } from '../lib/entry';
import { newId } from '../lib/platform';
import { DoctorEntrySchema } from '../../../../packages/sync-core/src/domain';
import { compareOpsByClock } from '../../../../packages/sync-core/src/index';

export default function DoctorRegister() {
  const { t } = useI18n();
  const { write } = useKuka();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [formKey, setFormKey] = useState(0);
  const saving = useRef(false);
  const entries = vault
    .state!.ops.filter((op) => op.entityType === 'doctor-entry' && op.field === 'doctorEntry')
    .slice()
    .sort(compareOpsByClock)
    .reverse();
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <>
      <PageTitle
        eyebrow="Workspace"
        title="Doctor’s register"
        description="Add a patient entry. Saved records appear below and remain available offline."
      />
      <Panel title="New patient entry">
        <Form
          key={formKey}
          onSubmit={async (form) => {
            if (saving.current) return;
            setError('');
            const parsed = DoctorEntrySchema.safeParse(
              Object.fromEntries(
                ['patientName', 'date', 'time', 'purpose'].map((key) => [key, String(form.get(key) ?? '')]),
              ),
            );
            if (!parsed.success) {
              setError(parsed.error.issues[0].message);
              return;
            }
            if (parsed.data.date > localDate()) {
              setError('The date cannot be in the future');
              return;
            }
            saving.current = true;
            setBusy(true);
            try {
              await write('doctor-entry-' + newId(), 'doctorEntry', parsed.data, 'add', 'doctor-entry');
              setFormKey((key) => key + 1);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : 'Unable to save this entry. Try again.');
            } finally {
              saving.current = false;
              setBusy(false);
            }
          }}
        >
          <label>
            {t('Patient name')}{' '}
            <input name="patientName" required minLength={2} maxLength={80} autoComplete="off" />
          </label>
          <div className="form-grid">
            <label>
              {t('Date')}{' '}
              <input name="date" type="date" required defaultValue={localDate()} max={localDate()} />
            </label>
            <label>
              {t('Time')} <input name="time" type="time" required defaultValue={currentTime} />
            </label>
          </div>
          <label>
            {t('Purpose')} <textarea name="purpose" required maxLength={1000} rows={3} />
          </label>
          {error && <Notice tone="coral">{t(error)}</Notice>}
          <button type="submit" className="button primary" disabled={busy}>
            <Plus size={16} /> {t(busy ? 'Saving…' : 'Add record')}
          </button>
        </Form>
      </Panel>
      <Panel title="Patient entries">
        {entries.length ? (
          <div className="table-scroll">
            <table aria-label={t('Patient entries')}>
              <thead>
                <tr>
                  <th>{t('Patient name')}</th>
                  <th>{t('Date')}</th>
                  <th>{t('Time')}</th>
                  <th>{t('Purpose')}</th>
                  <th>{t('Recorded by')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((op) => {
                  const entry = DoctorEntrySchema.parse(op.value);
                  return (
                    <tr key={op.opId}>
                      <td>{entry.patientName}</td>
                      <td>{entry.date}</td>
                      <td>{entry.time}</td>
                      <td style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{entry.purpose}</td>
                      <td>{op.actorId}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No patient entries yet"
            description="Complete the form above to add the first entry."
          />
        )}
      </Panel>
    </>
  );
}
