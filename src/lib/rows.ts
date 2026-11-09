import {fmtDate, pick, type Locale} from './i18n.ts';
import type {Result} from './schemas.ts';
import type {FamilyRow} from '../components/ResultsBrowser.tsx';
import type {Family} from './families.ts';
import {DATASETS} from './data.ts';
import type {ResultCardData} from '../components/ui.tsx';

export function toResultCard(item: Result, locale: Locale): ResultCardData {
  return {
    slug: item.slug, id: item.id, title: pick(item.title, locale),
    excerpt: pick(item.result, locale), status: item.status, updated: fmtDate(item.updatedAt, locale)
  };
}


export function toFamilyRows(families: Family[], locale: Locale): FamilyRow[] {
  return families.map(family => ({
    slug: family.slug,
    title: pick(family.title, locale),
    description: pick(family.description, locale),
    recordCount: family.records.length,
    updated: fmtDate(family.updatedAt, locale),
    year: family.updatedAt.slice(0, 4),
    lines: family.lines,
    statuses: family.statuses,
    surveys: DATASETS.filter(([, pattern]) => family.records.some(item => pattern.test(item.question.en+' '+item.method.en+' '+item.result.en))).map(([name]) => name),
    haystack: family.records.map(item =>
      [item.question['pt-BR'], item.question.en, item.result['pt-BR'], item.result.en, item.id].join(' ')
    ).join(' ').toLocaleLowerCase(locale === 'pt' ? 'pt-BR' : 'en')
  }));
}
