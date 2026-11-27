import {fmtDate, pick, type Locale} from './i18n.ts';
import type {Result} from './schemas.ts';
import type {FamilyRow} from '../components/ResultsBrowser.tsx';
import {isNamed, pathSlug, type Family} from './families.ts';
import {DATASETS} from './data.ts';
import type {ResultCardData} from '../components/ui.tsx';
import {familyQuestion, familyEntry, readResult, isNegative} from './editorial.ts';
import {fold} from './search.ts';

export function toResultCard(item: Result, locale: Locale): ResultCardData {
  return {
    slug: pathSlug(item, locale), id: isNamed(item) ? '' : item.id, title: pick(item.title, locale),
    excerpt: pick(item.result, locale), status: item.status, updated: fmtDate(item.updatedAt, locale)
  };
}


export function toFamilyRows(families: Family[], locale: Locale): FamilyRow[] {
  return families.map(family => ({
    slug: pathSlug(family, locale),
    title: familyQuestion(family, locale),
    entrySlug: pathSlug(familyEntry(family), locale),
    finding: readResult(familyEntry(family), locale).finding,
    negative: family.records.some(r => isNegative(r.id)),
    description: family.records.length === 1 ? readResult(familyEntry(family), locale).why : pick(family.description, locale),
    recordCount: family.records.length,
    updated: fmtDate(family.updatedAt, locale),
    year: family.updatedAt.slice(0, 4),
    lines: family.lines,
    statuses: family.statuses,
    surveys: DATASETS.filter(([, pattern]) => family.records.some(item => pattern.test(item.question.en+' '+item.method.en+' '+item.result.en))).map(([name]) => name),
    // Editorial title and description first, then every record in both languages; folded so the
    // query ignores case and accents.
    haystack: fold([
      familyQuestion(family, 'pt'), familyQuestion(family, 'en'),
      readResult(familyEntry(family), 'pt').finding, readResult(familyEntry(family), 'en').finding,
      family.title['pt-BR'], family.title.en, family.description['pt-BR'], family.description.en, family.slug,
      ...family.records.flatMap(item => [item.question['pt-BR'], item.question.en, item.result['pt-BR'], item.result.en, ...(isNamed(item) ? [] : [item.id])])
    ].join(' '))
  }));
}
