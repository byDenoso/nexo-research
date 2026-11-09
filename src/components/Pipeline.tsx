import Link from 'next/link';
import {D, tr} from '@/lib/dict';
import type {Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';

export function Pipeline({locale}: {locale: Locale}) {
  return (
    <ol className="pipeline" role="list">
      {D.how.steps.map((step, index) => (
        <li key={step.k} className="pipeline-step">
          <details name="research-pipeline">
            <summary>
              <span className="pipeline-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className="disclosure-label">{tr(step.n, locale)}</span>
            </summary>
            <div className="pipeline-copy">
              <p>{tr(step.d, locale)}</p>
              <Link href={`${href(locale, '/methods')}#${step.k}`} className="text-link">{tr(D.how.evidence, locale)}</Link>
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}
