import Link from 'next/link';
import {D, tr} from '@/lib/dict';
import type {Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';

export function Pipeline({locale}: {locale: Locale}) {
  return (
    <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {D.how.steps.map((step, index) => (
        <li key={step.k} className="card">
          <details className="group p-4">
            <summary className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-accent font-mono text-sm text-accent">{index + 1}</span>
              <span className="font-semibold">{tr(step.n, locale)}</span>
            </summary>
            <p className="mt-3 text-sm text-muted">{tr(step.d, locale)}</p>
            <Link href={`${href(locale, '/methods')}#${step.k}`} className="mt-3 inline-block text-sm text-accent underline underline-offset-4">{tr(D.how.evidence, locale)}</Link>
          </details>
        </li>
      ))}
    </ol>
  );
}
