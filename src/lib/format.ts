import type {Locale} from './i18n.ts';

// Presentational only. The Tower text and hashes remain byte-for-byte unchanged.
// Protect version-like and DOI/URL sequences with slash or letters after the number.
export function scientificText(text: string, locale: Locale): string {
  if (locale === 'en') return text;
  return text
    .replace(/(^|[\s=([{,])-(?=\d)/g, '$1−')
    .replace(/(?<![\w/])(\d+)\.(\d+)(?![\w/])/g, '$1,$2');
}

export function sameText(a: string, b: string): boolean {
  return a.replace(/\s+/g, ' ').trim().toLocaleLowerCase() === b.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}
