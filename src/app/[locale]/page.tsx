import {DesiObservatory} from '@/components/DesiObservatory';
import {DesOffsetFigure, DesOffsetLead} from '@/components/DesOffset';
import {ChapterNav} from '@/components/ChapterNav';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ErositaFigure, erositaId} from '@/components/ErositaFigure';
import {redshiftSlug} from '@/components/RedshiftFigure';
import {getManifest, getPageDates, getResults, getPublications} from '@/lib/data';
import {getFamilies} from '@/lib/families';
import {readResult, selectedIds} from '@/lib/editorial';
import {fmtDate, isLocale} from '@/lib/i18n';
import {goodsSouth} from '@/lib/observations';
import {href} from '@/lib/seo';

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const pt = locale === 'pt';
  const results = getResults();
  const publications = getPublications();
  const snapshot = getManifest().catalogue;
  const editorialDate = getPageDates()['']!;
  const stories = selectedIds.slice(1).flatMap(id => {
    const item = results.find(result => result.id === id);
    return item ? [item] : [];
  });

  return (
    <div className="nexo-editorial nx-home">
      <section className="institute-cover" data-observatory aria-labelledby="institute-title">
        <div className="wrap cover-grid">
          <div className="cover-copy">
            <p className="cover-label">{pt ? 'Cosmologia observacional' : 'Observational cosmology'}</p>
            <h1 id="institute-title">{pt ? 'Expansão cósmica e formação de estruturas' : 'Cosmic expansion and structure formation'}</h1>
            <p>{pt ? 'A pesquisa compara modelos de energia escura com medidas da expansão cósmica e estuda a formação de estruturas e as primeiras galáxias.' : 'Our research compares dark energy models with measurements of cosmic expansion and investigates the growth of structure and the earliest galaxies.'}</p>
            <div className="cover-actions">
              <Link prefetch={false} href={href(locale, '/results')}>{pt ? 'Explorar resultados' : 'Explore results'} <span aria-hidden="true">→</span></Link>
              <Link prefetch={false} href={href(locale, '/research')}>{pt ? 'Linhas de pesquisa' : 'Research areas'} <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <DesiObservatory locale={locale} />
        </div>
        <div className="wrap">
          <p className="telemetry" aria-label={pt ? 'Estado do catálogo' : 'Catalogue state'}>
            <span><b>{results.length}</b> {pt ? 'registros' : 'records'}</span>
            <span><b>{getFamilies(results).length}</b> {pt ? 'perguntas' : 'questions'}</span>
            <span>{pt ? 'atualizado em' : 'updated'} <b><time dateTime={snapshot.latestUpdate}>{fmtDate(snapshot.latestUpdate, locale)}</time></b></span>
            <span>DESI DR2 · DES-SN5YR · Pantheon+ · Euclid · JWST</span>
          </p>
        </div>
      </section>
      <ChapterNav locale={locale}/>
      <section id="em-foco" className="wrap nx-lead" aria-labelledby="cover-title">
        <div className="nx-lead-copy">
          <DesOffsetLead locale={locale} />
          <div className="nx-actions">
            <Link prefetch={false} className="nx-primary" href={href(locale, '/results/' + redshiftSlug)}>{pt ? 'Ver o corte de baixo z' : 'See the low-redshift cut'} <span aria-hidden="true">→</span></Link>
            <Link prefetch={false} className="text-link arrow-link" href={href(locale, '/results')}>{pt ? 'Consultar o catálogo' : 'Browse the catalogue'}</Link>
          </div>
        </div>
        <DesOffsetFigure locale={locale} />
      </section>

      <section id="galaxias" className="wrap nx-observation" aria-labelledby="galaxies-title">
        <figure>
          <Image src={goodsSouth.image} fetchPriority="low" width={1400} height={1750} sizes="(min-width: 56rem) 48vw, 92vw" alt={pt ? 'Galáxias de cores e formas diversas no campo GOODS-Sul observado pelo Webb' : 'Galaxies of different colours and shapes in the GOODS-South field observed by Webb'} />
          <figcaption>{pt ? 'Campo GOODS-Sul observado pelo Webb / JADES.' : 'GOODS-South field observed by Webb / JADES.'} <a className="text-link" href={goodsSouth.source}>{goodsSouth.credit}</a></figcaption>
        </figure>
        <div>
          <p className="nx-eyebrow">{pt ? 'Primeiras galáxias' : 'First galaxies'}</p>
          <h2 id="galaxies-title">{pt ? 'Identificação de galáxias distantes' : 'Identifying distant galaxies'}</h2>
          <p>{pt ? 'No campo GOODS-Sul observado pelo Webb, fotometria e espectros ajudam a distinguir candidatas a galáxias distantes de fontes próximas com cores parecidas.' : 'In the GOODS-South field observed by Webb, photometry and spectroscopy help distinguish distant galaxy candidates from nearby sources of similar colour.'}</p>
          <Link prefetch={false} className="text-link arrow-link" href={href(locale, '/research') + '#galaxies'}>{pt ? 'Ver a pesquisa sobre galáxias' : 'Read the galaxy research'}</Link>
        </div>
      </section>

      <section id="perguntas" className="wrap nx-more-research" aria-labelledby="readings-title">
        <div className="section-masthead">
          <h2 id="readings-title">{pt ? 'Resultados em destaque' : 'Selected results'}</h2>
          <Link prefetch={false} className="text-link arrow-link" href={href(locale, '/results')}>{pt ? 'Consultar todos os resultados' : 'Browse all results'}</Link>
        </div>
        <div className="journal-stories">
          {stories.map(item => {
            const story = readResult(item, locale);
            const isErosita = item.id === erositaId;
            return (
              <article key={item.id} className={isErosita ? 'journal-erosita' : undefined}>
                <h3><Link prefetch={false} href={href(locale, '/results/' + item.slug)}>{story.question}</Link></h3>
                <p>{story.finding}</p>
                {isErosita && <ErositaFigure item={item} locale={locale} />}
                <p className="story-limit">{story.limit}</p>
              </article>
            );
          })}
        </div>
      </section>

      {publications.length > 0 && <section className="wrap publication-strip"><h2>{pt ? 'Publicações recentes' : 'Recent publications'}</h2><ul>{publications.slice(0, 3).map(pub => <li key={pub.id}><time dateTime={pub.date}>{pub.date}</time><Link prefetch={false} href={href(locale, '/publications') + '#' + pub.id}>{pub.title}</Link></li>)}</ul></section>}
      <section id="fontes" className="catalogue-chapter" aria-labelledby="access-title">
        <div className="wrap catalogue-note">
          <div>
            <h2 id="access-title">{pt ? 'Dados e métodos' : 'Data and methods'}</h2>
            <div className="inst-actions">
              <Link prefetch={false} className="text-link arrow-link" href={href(locale, '/methods')}>{pt ? 'Consultar o método de avaliação' : 'Read the evaluation method'}</Link>
              <Link prefetch={false} className="text-link arrow-link" href={href(locale, '/data')}>{pt ? 'Ver dados e código' : 'View data and software'}</Link>
              <Link prefetch={false} className="text-link arrow-link" href={href(locale, '/research') + '#expansion'}>{pt ? 'Pesquisa sobre a expansão cósmica' : 'Research on cosmic expansion'}</Link>
              <Link prefetch={false} className="text-link arrow-link" href={href(locale, '/research') + '#probes'}>{pt ? 'Ver sondas cosmológicas' : 'See cosmological probes'}</Link>
              <Link prefetch={false} className="text-link arrow-link" href={href(locale, '/resultado-vivo')}>{pt ? 'Abrir o Resultado Vivo' : 'Open Living Result'}</Link>
            </div>
            <p><a className="text-link" href="https://arxiv.org/abs/2112.03863">{pt ? 'Fonte do catálogo Pantheon+' : 'Pantheon+ catalogue source'} · Scolnic et al. (2022)</a></p>
          </div>
          <dl className="inst-facts">
            <div><dt>{pt ? 'Perguntas científicas' : 'Research questions'}</dt><dd>{getFamilies(results).length}</dd></div>
            <div><dt>{pt ? 'Registros públicos' : 'Public records'}</dt><dd>{results.length}</dd></div>
            <div><dt>{pt ? 'Última entrada no catálogo' : 'Latest catalogue entry'}</dt><dd><Link prefetch={false} className="text-link" href={href(locale, '/data') + '#snap'}><time dateTime={snapshot.latestUpdate}>{fmtDate(snapshot.latestUpdate, locale)}</time></Link></dd></div>
            <div><dt>{pt ? 'Revisão desta página' : 'Page revision'}</dt><dd><time dateTime={editorialDate}>{fmtDate(editorialDate, locale)}</time></dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}
