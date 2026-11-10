import type {MetadataRoute} from 'next';
import {getManifest, getPageDates, getResults} from '@/lib/data';
import {getFamilies} from '@/lib/families';
import {LOCALES, ROUTES} from '@/lib/i18n';
import {SITE_URL} from '@/lib/seo';

// Routes whose content also changes when the scientific snapshot changes.
const DATA_DRIVEN = new Set(['', '/research', '/results', '/data', '/updates']);
const later = (a: string, b: string): string => (a > b ? a : b);

export default function sitemap(): MetadataRoute.Sitemap {
  const snapshot = getManifest().generatedFrom.latestUpdate;
  const editorial = getPageDates();
  // Editorial pages carry the date of their last revision; family pages the date of their
  // latest record. The snapshot date only raises pages that actually render snapshot data.
  const pages = ['', ...ROUTES.map(route => `/${route}`)].map(path => {
    const revised = `${editorial[path]}T00:00:00.000Z`;
    return {path, lastModified: DATA_DRIVEN.has(path) ? later(revised, snapshot) : revised};
  });
  const families = getFamilies(getResults()).map(family => ({path: '/results/families/' + family.slug, lastModified: family.updatedAt}));
  return LOCALES.flatMap(locale => [...pages, ...families].map(({path, lastModified}) => ({
    url: `${SITE_URL}/${locale}${path}`, lastModified: new Date(lastModified),
    alternates: {languages: Object.fromEntries(LOCALES.map(code => [code === 'pt' ? 'pt-BR' : 'en', `${SITE_URL}/${code}${path}`]))}
  })));
}
