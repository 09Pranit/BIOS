import { useI18n } from '../lib/i18n';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Building2, GraduationCap, Search, WifiOff, X } from 'lucide-react';
import { governmentResources } from '../lib/government-resources';

const categories = ['All programmes', 'Education'] as const;
type Category = (typeof categories)[number];
type Resource = (typeof governmentResources)[number];

function ProgrammePoster({ resource }: { resource: Resource }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const host = new URL(resource.href).hostname;
  return (
    <a
      className="gov-website-link"
      href={resource.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t('Official website')} ${host} · ${t(resource.title)} · ${t('Internet needed')} · ${t('Opens in a new tab.')}`}
    >
      <div className="gov-poster">
        {failed ? (
          <div
            className="gov-poster-fallback"
            role="img"
            aria-label={t('{title}: poster unavailable', { title: t(resource.title) })}
          >
            <Building2 size={36} aria-hidden="true" />
            <strong>{t(resource.title)}</strong>
            <span>{t('Official programme')}</span>
          </div>
        ) : (
          <img
            src={resource.image}
            alt={t(resource.imageAlt)}
            width={960}
            height={540}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <span className="gov-portal-caption">
        <span>
          <strong>{t('Official website')}</strong>{' '}
          <span className="gov-portal-host" lang="en">
            {host}
          </span>
        </span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </span>
    </a>
  );
}

export default function GovernmentResources() {
  const { t, locale } = useI18n();
  const [category, setCategory] = useState<Category>('All programmes'),
    [query, setQuery] = useState(''),
    [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  const resources = useMemo(() => {
    const search = query.trim().toLocaleLowerCase(locale);
    return governmentResources.filter(
      (resource) =>
        (category === 'All programmes' || resource.category === category) &&
        (!search ||
          [
            resource.title,
            resource.provider,
            resource.description,
            resource.category,
            resource.audience,
            ...resource.tags,
          ]
            .flatMap((value) => [value, t(value)])
            .join(' ')
            .toLocaleLowerCase(locale)
            .includes(search)),
    );
  }, [category, query, locale, t]);
  const clearFilters = () => {
    setQuery('');
    setCategory('All programmes');
  };
  return (
    <section
      id="government-programmes"
      className="government-resources"
      aria-labelledby="gov-resources-heading"
    >
      <header className="gov-heading">
        <div className="gov-heading-icon">
          <Building2 size={26} aria-hidden="true" />
        </div>
        <div>
          <p className="gov-eyebrow">{t('Official resources')}</p>
          <h2 id="gov-resources-heading">{t('Explore government programmes')}</h2>
          <p>
            {t(
              'Find official education programmes. Open a programme’s own website to read its current information.',
            )}
          </p>
        </div>
      </header>
      <div className="gov-information-note">
        <span className="gov-note-dot" aria-hidden="true" />
        <p>
          {t(
            'These are informational links to government websites. Smriva is an independent project and is not affiliated with these programmes.',
          )}
        </p>
      </div>
      {!online && (
        <div className="gov-offline-notice" role="status">
          <WifiOff size={19} aria-hidden="true" />
          <p>
            {t(
              'You are offline. You can browse the programme information here. Official websites need an internet connection.',
            )}
          </p>
        </div>
      )}
      <div className="gov-toolbar">
        <div className="gov-filters" role="group" aria-label={t('Filter government programmes by category')}>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              className={category === item ? 'gov-filter is-active' : 'gov-filter'}
              onClick={() => setCategory(item)}
            >
              {item === 'Education' && <GraduationCap size={17} aria-hidden="true" />}
              {t(item)}
            </button>
          ))}
        </div>
        <div className="gov-search">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label={t('Search government programmes')}
            placeholder={t('Search programmes or topics…')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
          />
          {query && (
            <button type="button" aria-label={t('Clear programme search')} onClick={() => setQuery('')}>
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div className="gov-results-row">
        <p className="gov-results" role="status" aria-live="polite" aria-atomic="true">
          {t(
            query.trim()
              ? resources.length === 1
                ? '{count} programme match your search'
                : '{count} programmes match your search'
              : resources.length === 1
                ? '{count} programme to explore'
                : '{count} programmes to explore',
            { count: resources.length },
          )}
          {category !== 'All programmes' && <> · {t('in {category}', { category: t(category) })}</>}
        </p>
        <span>{t('Official websites · Internet needed')}</span>
      </div>
      {resources.length === 0 ? (
        <div className="gov-empty">
          <Search size={29} aria-hidden="true" />
          <h3>{t('No programmes match these filters')}</h3>
          <p>{t('Try a different name or topic, or show all the programmes.')}</p>
          <button className="button outline" type="button" onClick={clearFilters}>
            {t('Clear filters and show all programmes')}
          </button>
        </div>
      ) : (
        <ul className="gov-resource-grid">
          {resources.map((resource) => (
            <li key={resource.id}>
              <article className="gov-resource-card" aria-labelledby={`gov-title-${resource.id}`}>
                <ProgrammePoster resource={resource} />
                <div className="gov-card-content">
                  <span className="gov-category">
                    <GraduationCap size={15} aria-hidden="true" />
                    {t(resource.category)}
                  </span>
                  <h3 id={`gov-title-${resource.id}`}>{t(resource.title)}</h3>
                  <p className="gov-provider">{t(resource.provider)}</p>
                  <details className="gov-details">
                    <summary>{t('Details')}</summary>
                    <p className="gov-description">{t(resource.description)}</p>
                    {resource.audience && (
                      <p className="gov-audience">
                        {t('For {audience}', { audience: t(resource.audience) })}
                      </p>
                    )}
                    {resource.tags.length > 0 && (
                      <ul className="gov-tags" aria-label={t('{title} topics', { title: t(resource.title) })}>
                        {resource.tags.slice(0, 3).map((tag) => (
                          <li key={tag}>{t(tag)}</li>
                        ))}
                      </ul>
                    )}
                  </details>
                  <div className="gov-image-credits">
                    <a
                      href={resource.imageSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('{title} image source. Opens in a new tab.', {
                        title: t(resource.title),
                      })}
                    >
                      {t('Image source')} <ArrowUpRight size={12} aria-hidden="true" />
                    </a>
                    <a
                      href={resource.rightsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('{title} image usage policy. Opens in a new tab.', {
                        title: t(resource.title),
                      })}
                    >
                      {t('Usage policy')} <ArrowUpRight size={12} aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
      <p className="gov-footer-note">
        {t(
          'Programme details can change. The official website is the source for current services, eligibility and contact information. Bundled images are for reference; the linked websites are not downloaded for offline use.',
        )}
      </p>
    </section>
  );
}
