import {ResearchAreas} from '@/components/ResearchAreas';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ResearchObservation} from '@/components/EditorialFigures';
import {PageHead} from '@/components/ui';
import {getProjects, getResults, getPublications} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {isLocale, pick} from '@/lib/i18n';
import {LINES} from '@/lib/schemas';
import {href, pageMeta} from '@/lib/seo';

const questions = {
  expansion: ['O que está acelerando a expansão do Universo?', 'What is accelerating cosmic expansion?'],
  models: ['Quais modelos descrevem a expansão e o crescimento de estruturas?', 'Which models describe cosmic expansion and the growth of structure?'],
  probes: ['As sondas cosmológicas produzem resultados compatíveis?', 'Are results from different cosmological probes consistent?'],
  galaxies: ['Quais observações identificam as primeiras galáxias?', 'Which observations identify the earliest galaxies?'],
  'local-group': ['Como a Via Láctea e Andrômeda se movem?', 'How do the Milky Way and Andromeda move?'],
  anomalies: ['O que explica uma fonte incomum?', 'What explains an unusual source?'],
  reproducibility: ['Os resultados podem ser reproduzidos?', 'Can the results be reproduced?'],
};

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return isLocale(locale) ? pageMeta(locale, '/research', tr(D.research.title, locale), tr(D.research.lead, locale)) : {};
}

export default async function ResearchPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const pt = locale === 'pt';
  const results = getResults();
  const projects = getProjects();
  const publications = getPublications();

  return (
    <>
      <PageHead
        kicker={pt ? 'Pesquisa' : 'Research'}
        title={pt ? 'Linhas de pesquisa' : 'Research areas'}
        lead={pt ? 'A pesquisa abrange cosmologia observacional, modelos de energia escura, primeiras galáxias e astrofísica extragaláctica.' : 'Research covers observational cosmology, dark energy models, the earliest galaxies and extragalactic astrophysics.'}
      />
      <ResearchAreas locale={locale} figure={<ResearchObservation locale={locale}/>} areas={LINES.map(line=>{
            const count = results.filter(item => item.lines.includes(line)).length;
            const areaProjects = projects.filter(project => project.line === line);
            return {line,statuses:results.filter(item=>item.lines.includes(line)).map(item=>item.status),content:(
              <section key={line} id={line} className="research-question" aria-labelledby={line + '-title'}>
                <div>
                  <p className="kicker">{tr(D.lines.items[line].n, locale)}</p>
                  <h2 id={line + '-title'}>{questions[line][pt ? 0 : 1]}</h2>
                  <p>{tr(D.lines.items[line].d, locale)}</p>
                  {count > 0 ? (
                    <Link className="text-link arrow-link" href={href(locale, '/results') + '?line=' + line}>
                      {pt ? 'Consultar os resultados' : 'Browse the results'}
                      <span className="sr-only"> · {tr(D.lines.items[line].n, locale)}</span>
                    </Link>
                  ) : <p className="research-empty">{pt ? 'Ainda sem registros no catálogo público.' : 'No records in the public catalogue yet.'}</p>}
                </div>
                {areaProjects.length > 0 && (
                  <details className="research-projects">
                    <summary>{pt ? 'Projetos desta linha' : 'Projects in this area'}</summary>
                    <ul role="list">
                      {areaProjects.map(project => (
                        <li key={project.id}><h3>{pick(project.title, locale)}</h3><p>{pick(project.summary, locale)}</p></li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            )};
          })} output={
          <section id="scientific-output" className="research-question">
            <h2>{pt ? 'Publicações' : 'Publications'}</h2>
            {publications.length > 0 ? (
              <ul>{publications.map(pub => <li key={pub.id}><Link className="text-link" href={href(locale, '/publications') + '#' + pub.id}>{pub.title}</Link></li>)}</ul>
            ) : <p>{pt ? 'Os testes e as fontes estão disponíveis no catálogo. Os manuscritos autorizados para divulgação são listados em Publicações.' : 'Tests and sources are available in the catalogue. Manuscripts authorised for public release are listed under Publications.'}</p>}
            <Link className="text-link arrow-link" href={href(locale, '/methods')}>{pt ? 'Como avaliamos a evidência' : 'How we assess evidence'}</Link>
          </section>}/>
    </>
  );
}
