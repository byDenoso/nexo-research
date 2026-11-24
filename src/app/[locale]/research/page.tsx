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
  models: ['Uma nova teoria explica a expansão e as estruturas?', 'Can one new theory explain expansion and structure?'],
  probes: ['Diferentes medidas contam a mesma história cósmica?', 'Do different measurements tell the same cosmic story?'],
  galaxies: ['O que a luz das primeiras galáxias revela?', 'What does light from the earliest galaxies reveal?'],
  'local-group': ['Como a Via Láctea e Andrômeda se movem?', 'How do the Milky Way and Andromeda move?'],
  anomalies: ['O que explica uma fonte incomum?', 'What explains an unusual source?'],
  reproducibility: ['Outra pessoa consegue chegar à mesma conclusão?', 'Can someone else reach the same conclusion?'],
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
        title={pt ? 'Onde os modelos encontram o céu' : 'Where models meet the sky'}
        lead={pt ? 'Da expansão cósmica à luz das primeiras galáxias: cada linha conecta uma pergunta física aos projetos e aos testes registrados.' : 'From cosmic expansion to the light of the earliest galaxies, each research area connects a physical question to projects and documented tests.'}
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
                      {pt ? 'Consultar os testes no catálogo' : 'Find tests in the catalogue'}
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
            <h2>{pt ? 'Produção científica pública' : 'Public scientific output'}</h2>
            {publications.length > 0 ? (
              <ul>{publications.map(pub => <li key={pub.id}><Link className="text-link" href={href(locale, '/publications') + '#' + pub.id}>{pub.title}</Link></li>)}</ul>
            ) : <p>{pt ? 'Os registros do catálogo dão acesso aos testes e às fontes. Manuscritos liberados para divulgação aparecem na página de publicações.' : 'The catalogue records give access to tests and sources. Manuscripts cleared for disclosure appear on the publications page.'}</p>}
            <Link className="text-link arrow-link" href={href(locale, '/methods')}>{pt ? 'Como avaliamos a evidência' : 'How we assess evidence'}</Link>
          </section>}/>
    </>
  );
}
