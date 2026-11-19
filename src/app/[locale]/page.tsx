import {ChapterNav} from '@/components/ChapterNav';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ErositaFigure, erositaId} from '@/components/ErositaFigure';
import {RedshiftFigure, RedshiftFinding, RedshiftLimit, redshiftSlug} from '@/components/RedshiftFigure';
import {StatusBadge} from '@/components/ui';
import {getManifest, getPageDates, getResult, getResults, getPublications} from '@/lib/data';
import {getFamilies} from '@/lib/families';
import {readResult, selectedIds, isNegative} from '@/lib/editorial';
import {fmtDate, isLocale} from '@/lib/i18n';
import {goodsSouth} from '@/lib/observations';
import {href} from '@/lib/seo';

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const pt = locale === 'pt';
  const results = getResults();
  const publications = getPublications();
  const snapshot = getManifest().generatedFrom;
  const editorialDate = getPageDates()['']!;
  const lead = getResult(redshiftSlug);
  const stories = selectedIds.slice(1).flatMap(id => {
    const item = results.find(result => result.id === id);
    return item ? [item] : [];
  });

  return (
    <div className="nexo-editorial nx-home">
      <section className="institute-cover" aria-labelledby="institute-title">
        <div className="wrap cover-grid">
          <div className="cover-copy">
            <p className="cover-label">NEXO Research Institute</p>
            <h1 id="institute-title">{pt ? 'Como o Universo se expande?' : 'How does the Universe expand?'}</h1>
            <p>{pt ? 'Investigamos a energia escura, a formação de estruturas e as primeiras galáxias. Cada análise pública liga a hipótese aos dados e aos limites do resultado.' : 'We investigate dark energy, the growth of structure and the earliest galaxies. Each public analysis connects a hypothesis to its data and the limits of its findings.'}</p>
            <div className="cover-actions">
              <Link href={href(locale, '/results')}>{pt ? 'Explorar resultados' : 'Explore results'} <span aria-hidden="true">→</span></Link>
              <Link href={href(locale, '/research')}>{pt ? 'Linhas de pesquisa' : 'Research areas'} <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <figure className="volume-plate">
            <Image src="/images/pantheon-volume.jpg" width={2560} height={1440} sizes="(min-width: 56rem) 54vw, 96vw" preload alt={pt ? 'Distribuição tridimensional das supernovas do Pantheon+ em quatro cascas de redshift' : 'Three-dimensional distribution of Pantheon+ supernovae inside four redshift shells'} />
            <figcaption><strong>Pantheon+</strong><span>{pt ? '1.543 supernovas · geometria da amostra' : '1,543 supernovae · sample geometry'}</span></figcaption>
            <details><summary>{pt ? 'Escala e fonte' : 'Scale and source'}</summary><p>{pt ? 'As cascas marcam z = 0,1, 0,5, 1 e 2. As distâncias comóveis usam ΛCDM plano, Ωₘ = 0,3 e H₀ = 70 km/s/Mpc. Cor e brilho são ilustrativos.' : 'Shells mark z = 0.1, 0.5, 1 and 2. Comoving distances assume flat ΛCDM, Ωₘ = 0.3 and H₀ = 70 km/s/Mpc. Colour and brightness are illustrative.'} <a href="https://arxiv.org/abs/2112.03863">Scolnic et al. (2022)</a>.</p></details>
          </figure>
        </div>
      </section>
      <ChapterNav locale={locale}/>
      <section id="em-foco" className="wrap nx-lead" aria-labelledby="cover-title">
        <div className="nx-lead-copy">
          <p className="nx-eyebrow">{pt ? 'Cosmologia observacional / Supernovas Ia' : 'Observational cosmology / Type Ia supernovae'}</p>
          <h2 id="cover-title">{pt ? 'Supernovas próximas pesam no ajuste da energia escura' : 'Nearby supernovae carry weight in the dark-energy fit'}</h2>
          <p className="nx-deck"><RedshiftFinding locale={locale} /></p>
          {lead && <p className="nx-status"><StatusBadge status={lead.status} locale={locale} /> {pt ? 'Validação independente pendente' : 'Independent validation pending'}</p>}
          <RedshiftLimit locale={locale} />
          <div className="nx-actions">
            <Link className="nx-primary" href={href(locale, '/results/' + redshiftSlug)}>{pt ? 'Comparar os cortes de redshift' : 'Compare the redshift cuts'} <span aria-hidden="true">→</span></Link>
            <Link className="text-link arrow-link" href={href(locale, '/results')}>{pt ? 'Consultar o catálogo' : 'Browse the catalogue'}</Link>
          </div>
        </div>
        <RedshiftFigure locale={locale} />
      </section>

      <section id="galaxias" className="wrap nx-observation" aria-labelledby="galaxies-title">
        <figure>
          <Image src={goodsSouth.image} width={1400} height={1750} sizes="(min-width: 56rem) 48vw, 92vw" alt={pt ? 'Galáxias de cores e formas diversas no campo GOODS-Sul observado pelo Webb' : 'Galaxies of different colours and shapes in the GOODS-South field observed by Webb'} />
          <figcaption>{pt ? 'Campo GOODS-Sul observado pelo Webb / JADES.' : 'GOODS-South field observed by Webb / JADES.'} <a className="text-link" href={goodsSouth.source}>{goodsSouth.credit}</a></figcaption>
        </figure>
        <div>
          <p className="nx-eyebrow">{pt ? 'Primeiras galáxias' : 'First galaxies'}</p>
          <h2 id="galaxies-title">{pt ? 'Como reconhecer uma galáxia do Universo jovem?' : 'How can we identify a galaxy from the early Universe?'}</h2>
          <p>{pt ? 'O campo GOODS-Sul do Webb reúne galáxias a várias distâncias. A pesquisa acompanha como fotometria e espectros ajudam a distinguir candidatas distantes de fontes próximas com cores parecidas.' : 'Webb’s GOODS-South field contains galaxies at different distances. The research looks at how photometry and spectra distinguish distant candidates from nearby sources with similar colours.'}</p>
          <Link className="text-link arrow-link" href={href(locale, '/research') + '#galaxies'}>{pt ? 'Ver a pesquisa sobre galáxias' : 'Read the galaxy research'}</Link>
        </div>
      </section>

      <section id="perguntas" className="wrap nx-more-research" aria-labelledby="readings-title">
        <div className="section-masthead">
          <h2 id="readings-title">{pt ? 'Outras perguntas do catálogo' : 'Other questions in the catalogue'}</h2>
          <Link className="text-link arrow-link" href={href(locale, '/results')}>{pt ? 'Ver todas as famílias' : 'See all test families'}</Link>
        </div>
        <div className="journal-stories">
          {stories.map(item => {
            const story = readResult(item, locale);
            const isErosita = item.id === erositaId;
            return (
              <article key={item.id} className={isErosita ? 'journal-erosita' : undefined}>
                <div className="showcase-meta">
                  <StatusBadge status={item.status} locale={locale} />
                  {isNegative(item.id) && <span className="outcome-tag">{pt ? 'Resultado negativo' : 'Negative result'}</span>}
                </div>
                <h3><Link href={href(locale, '/results/' + item.slug)}>{story.question}</Link></h3>
                <p>{story.finding}</p>
                {isErosita && <ErositaFigure item={item} locale={locale} />}
                <p className="story-limit">{story.limit}</p>
              </article>
            );
          })}
        </div>
      </section>

      {publications.length > 0 && <section className="wrap publication-strip"><h2>{pt ? 'Publicações recentes' : 'Recent publications'}</h2><ul>{publications.slice(0, 3).map(pub => <li key={pub.id}><time dateTime={pub.date}>{pub.date}</time><Link href={href(locale, '/publications') + '#' + pub.id}>{pub.title}</Link></li>)}</ul></section>}
      <section id="fontes" className="catalogue-chapter" aria-labelledby="access-title">
        <div className="wrap catalogue-note">
          <div>
            <h2 id="access-title">{pt ? 'Métodos, dados e fontes' : 'Methods, data and sources'}</h2>
            <div className="inst-actions">
              <Link className="text-link arrow-link" href={href(locale, '/methods')}>{pt ? 'Consultar o método de avaliação' : 'Read the evaluation method'}</Link>
              <Link className="text-link arrow-link" href={href(locale, '/data')}>{pt ? 'Ver dados e código' : 'View data and software'}</Link>
              <Link className="text-link arrow-link" href={href(locale, '/research') + '#expansion'}>{pt ? 'Ver a pesquisa em expansão' : 'Read the expansion research'}</Link>
              <Link className="text-link arrow-link" href={href(locale, '/research') + '#probes'}>{pt ? 'Ver sondas cosmológicas' : 'See cosmological probes'}</Link>
              <Link className="text-link arrow-link" href={href(locale, '/resultado-vivo')}>{pt ? 'Abrir o Resultado Vivo' : 'Open Living Result'}</Link>
            </div>
            <p><a className="text-link" href="https://arxiv.org/abs/2112.03863">{pt ? 'Fonte do catálogo Pantheon+' : 'Pantheon+ catalogue source'} · Scolnic et al. (2022)</a></p>
          </div>
          <dl className="inst-facts">
            <div><dt>{pt ? 'Famílias no catálogo' : 'Families in the catalogue'}</dt><dd>{getFamilies(results).length}</dd></div>
            <div><dt>{pt ? 'Execuções documentadas' : 'Documented runs'}</dt><dd>{results.length}</dd></div>
            <div><dt>{pt ? 'Versão do catálogo' : 'Catalogue version'}</dt><dd><Link className="text-link" href={href(locale, '/data') + '#snap'}><time dateTime={snapshot.latestUpdate}>{fmtDate(snapshot.latestUpdate, locale)}</time></Link></dd></div>
            <div><dt>{pt ? 'Última revisão editorial da home' : 'Last home editorial revision'}</dt><dd><time dateTime={editorialDate}>{fmtDate(editorialDate, locale)}</time></dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}
