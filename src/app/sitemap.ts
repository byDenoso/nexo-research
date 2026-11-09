import type {MetadataRoute} from 'next';
import {getManifest, getResults} from '@/lib/data';
import {getFamilies} from '@/lib/families';
import {LOCALES, ROUTES} from '@/lib/i18n';
import {SITE_URL} from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(getManifest().generatedFrom.latestUpdate);
  const paths = ['', ...ROUTES.map(route => `/${route}`), ...getFamilies(getResults()).map(family => '/results/families/' + family.slug)];
  return LOCALES.flatMap(locale => paths.map(path => ({
    url: `${SITE_URL}/${locale}${path}`, lastModified,
    alternates: {languages: Object.fromEntries(LOCALES.map(code => [code === 'pt' ? 'pt-BR' : 'en', `${SITE_URL}/${code}${path}`]))}
  })));
}
