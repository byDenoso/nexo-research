import type {Metadata} from 'next';
import {BRAND_FULL_NAME} from './brand.ts';
import {HTML_LANG, LOCALES, OG_LOCALE, type Locale} from './i18n.ts';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nexoresearch.org';
export const href = (locale: Locale, path = ''): string => `/${locale}${path}`;
export const datasetMentionId = (name: string): string => `dataset-${name.toLowerCase().replaceAll(' ', '-').replaceAll('+', '-plus')}`;

export function pageMeta(locale: Locale, path: string, title: string, description: string, paths?: Record<Locale, string>): Metadata {
  // A page whose URL differs by language passes one path per language.
  const at = (code: Locale) => paths?.[code] ?? path;
  const languages = Object.fromEntries(LOCALES.map(code => [HTML_LANG[code], `${SITE_URL}${href(code, at(code))}`]));
  return {
    title, description,
    alternates: {canonical: `${SITE_URL}${href(locale, path)}`, languages: {...languages, 'x-default': `${SITE_URL}${href('pt', at('pt'))}`}},
    openGraph: {title, description, url: `${SITE_URL}${href(locale, path)}`, siteName: BRAND_FULL_NAME, locale: OG_LOCALE[locale], type: 'website', images: [{url: SITE_URL + '/opengraph-image', width: 1200, height: 630, alt: BRAND_FULL_NAME}]},
    twitter: {card: 'summary_large_image', title, description, images: [SITE_URL + '/opengraph-image']}
  };
}
