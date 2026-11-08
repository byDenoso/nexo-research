import type {MetadataRoute} from 'next';
import {getManifest, getResults} from '@/lib/data';
import {LOCALES, ROUTES} from '@/lib/i18n';
import {SITE_URL} from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(getManifest().generatedFrom.latestUpdate);
  const paths = ['', ...ROUTES.map(route => `/${route}`), ...getResults().map(item => `/results/${item.slug}`)];
  return LOCALES.flatMap(locale => paths.map(path => ({
    url: `${SITE_URL}/${locale}${path}`, lastModified,
    alternates: {languages: Object.fromEntries(LOCALES.map(code => [code === 'pt' ? 'pt-BR' : 'en', `${SITE_URL}/${code}${path}`]))}
  })));
}
