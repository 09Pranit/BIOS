import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { parseSiteUrl, publicRouteMeta } from '../../../../packages/site/config';
import { useI18n } from '../lib/i18n';

const privatePages: Record<string, string> = {
  '/app/today': 'Overview',
  '/app/children': 'Children',
  '/app/school': 'Classroom',
  '/app/health': 'Health records',
  '/app/library': 'Learning library',
  '/app/sync': 'Save and sync',
  '/app/conflicts': 'Check differences',
  '/app/settings': 'Settings and recovery',
  '/recover': 'Recover workspace',
  '/admin': 'Hub database',
  '/lab': 'Resilience lab',
};
export function isWorkspaceRoute(path: string) {
  return Boolean(privatePages[path]) || /^\/app\/children\/[^/]+$/.test(path) || path.startsWith('/lab/');
}
/** Generic route metadata never includes a child name, record ID, PIN or search text. */
export default function RouteMetadata() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  useEffect(() => {
    const publicMeta = publicRouteMeta(pathname);
    const title =
      publicMeta?.title ??
      `${t(privatePages[pathname] ?? (pathname.startsWith('/app/children/') ? 'Child record' : 'Page not found'))} · Smriva`;
    const description =
      publicMeta?.description ??
      t(
        'Private Smriva workspace for offline health and education records. Unlock your enrolled device to continue.',
      );
    document.title = title;
    const setMeta = (selector: string, attribute: string, name: string, value: string) => {
      let tag = document.head.querySelector<HTMLMetaElement>(selector);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.append(tag);
      }
      tag.content = value;
    };
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      publicMeta ? 'index, follow' : 'noindex, nofollow, noarchive',
    );
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    const origin = parseSiteUrl(
      document.head.querySelector<HTMLMetaElement>('meta[name="smriva-site-url"]')?.content,
    );
    document.head
      .querySelectorAll('link[rel="canonical"],meta[property="og:url"]')
      .forEach((node) => node.remove());
    if (origin && publicMeta) {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = origin + pathname;
      document.head.append(link);
      setMeta('meta[property="og:url"]', 'property', 'og:url', origin + pathname);
    }
    if (!publicMeta) {
      document.getElementById('smriva-structured-data')?.remove();
      document.head
        .querySelectorAll('meta[property="og:image"],meta[property^="og:image:"],meta[name="twitter:image"]')
        .forEach((node) => node.remove());
    }
  }, [pathname, t]);
  return null;
}
