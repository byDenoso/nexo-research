import Link from 'next/link';
import {D, tr} from '@/lib/dict';
import type {Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';

// A track of seven stages. Each stage is a native <details> sharing one name, so exactly one is
// open at a time and it works without scripts. On wide screens the open stage fills one large
// panel under the track; on narrow screens it opens in place.
export function Pipeline({locale}: {locale: Locale}) {
  return (
    <ol className="pipeline" role="list">
      {D.how.steps.map((step, index) => {
        const number = String(index + 1).padStart(2, '0');
        return (
          <li key={step.k} className="pipeline-step">
            <details name="research-pipeline" open={index === 0}>
              <summary>
                <span className="pipeline-node" aria-hidden="true" />
                <span className="pipeline-index" aria-hidden="true">{number}</span>
                <span className="disclosure-label">{tr(step.n, locale)}</span>
              </summary>
              <div className="pipeline-copy">
                <span className="pipeline-numeral" aria-hidden="true">{number}</span>
                <div className="pipeline-text">
                  <p className="pipeline-name" aria-hidden="true">{tr(step.n, locale)}</p>
                  <p className="pipeline-desc">{tr(step.d, locale)}</p>
                  <Link href={`${href(locale, '/methods')}#${step.k}`} prefetch={false} className="text-link arrow-link">{tr(D.how.evidence, locale)}</Link>
                </div>
              </div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
