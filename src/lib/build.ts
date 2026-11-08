import {createHash} from 'node:crypto';
import {classify} from './classify.ts';
import {manifest as manifestSchema, type Manifest} from './schemas.ts';
import type {z} from 'zod';
import type {approval as approvalSchema, towerPublic} from './schemas.ts';

type Tower = z.infer<typeof towerPublic>;
type Approval = z.infer<typeof approvalSchema>;

export const idOf = (question: {en: string}): string => `T-${createHash('sha256').update(question.en).digest('hex').slice(0, 12)}`;
const shorten = (text: string): string => (text.length > 130 ? `${text.slice(0, text.lastIndexOf(' ', 127))}…` : text);

/**
 * Builds the public manifest. The only way a result leaves CANDIDATE is an approval record.
 */
export function buildManifest(tower: Tower, approvals: Approval[], snapshotBytes: Uint8Array): Manifest {
  const byId = new Map(approvals.map(entry => [entry.id, entry]));
  if (byId.size !== approvals.length) throw new Error('duplicate approval id');
  const figures = new Map(tower.visuals.map(visual => [visual.subject.question.en, visual]));
  const seen = new Set<string>();

  const results = tower.tests.map(test => {
    const id = idOf(test.question);
    if (seen.has(id)) throw new Error(`duplicate test id ${id}`);
    seen.add(id);
    const found = byId.get(id);
    const visual = figures.get(test.question.en);
    const {id: _id, status, lines, ...rest} = found ?? ({} as Partial<Approval>);
    return {
      id, slug: id.toLowerCase(),
      title: {'pt-BR': shorten(test.question['pt-BR']), en: shorten(test.question.en)},
      question: test.question, answer: test.answers, method: test.method, result: test.result,
      publishedAt: test.published_at, updatedAt: test.updated_at,
      status: status ?? 'CANDIDATE', statusSource: found ? 'approval' : 'default',
      lines: lines ?? classify(`${test.question.en} ${test.method.en} ${test.result.en}`),
      ...(found ? {approval: rest} : {}),
      ...(visual ? {figure: {id: visual.id, caption: visual.caption, limitations: visual.limitations, x: visual.plot.x, y: visual.plot.y, series: visual.plot.series, source: visual.sources[0] ?? {label: {'pt-BR': 'Fonte pública', en: 'Public source'}, url: 'https://nexoresearch.org/'}}} : {})
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));

  for (const entry of approvals) if (!seen.has(entry.id)) throw new Error(`approval ${entry.id} matches no Tower test`);

  return manifestSchema.parse({
    contract: 'NEXO_RESEARCH_MANIFEST_V1',
    generatedFrom: {contract: tower.contract, tests: tower.tests.length, visuals: tower.visuals.length, snapshotSha256: createHash('sha256').update(snapshotBytes).digest('hex'), latestUpdate: results.reduce((max, item) => (item.updatedAt > max ? item.updatedAt : max), '')},
    results
  });
}
