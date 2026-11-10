import {expect, test} from '@playwright/test';

const ROUTES = ['', '/research', '/results', '/publications', '/projects', '/methods', '/data', '/code', '/updates', '/about', '/contact'];

test('root redirects to the visitor language', async ({request}) => {
  const pt = await request.get('/', {maxRedirects: 0, headers: {'accept-language': 'pt-BR,pt;q=0.9'}});
  expect([307, 308]).toContain(pt.status());
  expect(pt.headers().location).toMatch(/\/pt$/);
  const en = await request.get('/', {maxRedirects: 0, headers: {'accept-language': 'en-US,en;q=0.9'}});
  expect(en.headers().location).toMatch(/\/en$/);
});

test('institutional home keeps publications out of the main, compact and footer navigation', async ({page, request}) => {
  for (const locale of ['pt', 'en']) {
    await page.goto(`/${locale}`);
    await expect(page.locator('header a, footer a, main a').filter({hasText: /^(Publicações|Publications)$/})).toHaveCount(0);
    await expect(page.locator(`a[href="/${locale}/publications"]`)).toHaveCount(0);
    const scope = page.locator('.editorial-archive');
    await expect(scope).toBeVisible();
    await expect(page.locator('.hero-observation img')).toHaveCount(1);
    await expect(scope.locator('dd')).toHaveCount(3);
    expect((await request.get(`/${locale}/publications`)).ok()).toBe(true);
  }
});

for (const locale of ['pt', 'en']) {
  for (const route of ROUTES) {
    test(`${locale}${route || '/'} renders with one h1, canonical and alternates`, async ({page}) => {
      const response = await page.goto(`/${locale}${route}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('html')).toHaveAttribute('lang', locale === 'pt' ? 'pt-BR' : 'en');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/${locale}${route}$`));
      await expect(page.locator('link[rel="alternate"][hreflang]').first()).toBeAttached();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

test('results page filters, paginates and links to a detail page', async ({page}) => {
  await page.goto('/pt/results');
  await expect(page.getByRole('status').filter({hasText: 'exibidas'})).toContainText('24 de');
  await page.getByRole('button', {name: 'Mostrar mais'}).click();
  await expect(page.getByRole('status').filter({hasText: 'exibidas'})).toContainText('35 de 35');
  await page.getByLabel('Buscar').fill('DESI');
  const shown = page.getByRole('status').filter({hasText: 'exibidas'});
  await expect(shown).toContainText('registros de execução');
  await page.getByLabel('Buscar').fill('zzzz-no-match');
  await expect(page.getByText('Nenhum registro encontrado.')).toBeVisible();
  await page.getByRole('button', {name: 'Limpar filtros'}).click();
  await page.getByRole('heading', {level: 3}).first().getByRole('link').click();
  await expect(page).toHaveURL(/\/pt\/results\/families\//);
  await expect(page.getByText('Execuções e variações')).toBeVisible();
});

test.describe('initial results', () => {
  test.use({javaScriptEnabled: false});
  test('the first page is readable before browser scripts run', async ({page}) => {
    await page.goto('/pt/results');
    const records = page.getByRole('main').getByRole('article');
    await expect(records).toHaveCount(24);
    await expect(records.first().getByRole('link')).toHaveAttribute('href', /\/pt\/results\/families\//);
  });
});

test.describe('catalogue without scripts', () => {
  test.use({javaScriptEnabled: false});
  test('every family is reachable through server-rendered pages', async ({page}) => {
    await page.goto('/pt/results');
    await page.getByRole('link', {name: 'Mostrar mais'}).click();
    await expect(page).toHaveURL(/\/pt\/results\/page\/2$/);
    await expect(page.getByRole('main').getByRole('article')).toHaveCount(11);
    await expect(page.locator('h1')).toHaveCount(1);
    await page.getByRole('link', {name: /Página anterior/}).click();
    await expect(page).toHaveURL(/\/pt\/results$/);
  });
});

test('search ignores accents and reads the editorial family titles', async ({page}) => {
  await page.goto('/pt/results');
  await expect(page.getByRole('button', {name: 'Mostrar mais'})).toBeVisible();
  const shown = page.getByRole('status').filter({hasText: 'exibidas'});
  await page.getByLabel('Buscar').fill('tracadores');
  await expect(shown).not.toContainText('35 de 35');
  await expect(page.getByRole('heading', {level: 3, name: 'Dependência dos traçadores e grupos BAO'})).toBeVisible();
  await page.getByLabel('Buscar').fill('CONCENTRACAO do sinal');
  await expect(page.getByRole('heading', {level: 3, name: 'Concentração do sinal por redshift'})).toBeVisible();
});

test('home links name the analysis they open', async ({page}) => {
  for (const locale of ['pt', 'en']) {
    await page.goto(`/${locale}`);
    const names = await page.getByRole('main').getByRole('link').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).innerText.replace(/\s+/g, ' ').trim()));
    const repeated = names.filter((name, index) => name && names.indexOf(name) !== index && !/^T-[0-9a-f]{12}$/.test(name));
    expect(repeated).toEqual([]);
  }
});

test('a highlighted record carries its dossier and its own figure', async ({page}) => {
  await page.goto('/pt/results/t-05ae703af393');
  const dossier = page.getByRole('complementary', {name: 'Dossiê de verificação'});
  await expect(dossier).toContainText('DES-SN5YR');
  await expect(dossier.getByRole('link', {name: /arXiv:2401\.02929/})).toHaveAttribute('href', 'https://arxiv.org/abs/2401.02929');
  await expect(dossier).toContainText('Não consta no resumo público.');
  await expect(page.locator('.record-reading .sens-dot[data-active]')).toHaveCount(1);
  await dossier.getByRole('link', {name: 'Condições do teste'}).click();
  await expect(page).toHaveURL(/#method$/);
  await page.goto('/en/results/t-0e94e9e2951b');
  await expect(page.locator('.pair-values dd')).toHaveText(['2.18\u2009σ', '0.35\u2009σ']);
});

test('the figure answers to pointer and offers its data as a table', async ({page}) => {
  await page.goto('/en');
  const figure = page.locator('.lead-story .sens');
  await expect(figure.locator('.sens-readout')).toContainText('94%');
  await figure.getByRole('button', {name: /Union3, without z = 0\.1–0\.3/}).first().click();
  await expect(figure.locator('.sens-readout')).toContainText('Union3');
  await figure.locator('summary').click();
  await expect(figure.getByRole('table')).toBeVisible();
  expect(await figure.getByRole('row').count()).toBeGreaterThan(40);
});

test('the code page shows the empty notice only while no repository is listed', async ({page}) => {
  await page.goto('/pt/code');
  await expect(page.getByText('Código de análise ainda não publicado.')).toBeVisible();
  await expect(page.getByRole('main').locator('a.card')).toHaveCount(0);
});

test('the compact menu opens and navigates with the keyboard', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/pt');
  const menu = page.locator('details.site-menu');
  await menu.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('open', '');
  const link = menu.getByRole('link', {name: 'Métodos'});
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/pt\/methods$/);
});

test('result filters are labelled and operable from the keyboard', async ({page}) => {
  await page.goto('/pt/results');
  await expect(page.getByRole('button', {name: 'Mostrar mais'})).toBeVisible();
  const survey = page.getByLabel('Levantamento mencionado');
  await survey.focus();
  await survey.selectOption('Planck');
  await expect(page).toHaveURL(/survey=Planck/);
  await expect(page.getByRole('status').filter({hasText: 'exibidas'})).not.toContainText('35 de 35');
});

test('line filter from the research page is honoured', async ({page}) => {
  await page.goto('/en/results?line=local-group');
  await expect(page.getByRole('status').filter({hasText: 'shown'})).toContainText('0 of 0');
});

test('methods page renders equations with KaTeX', async ({page}) => {
  await page.goto('/en/methods');
  await expect(page.locator('.katex').first()).toBeVisible();
  expect(await page.locator('.katex').count()).toBeGreaterThanOrEqual(4);
});

test('wide equations on mobile scroll with the keyboard', async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.goto('/en/methods');
  const equation = page.getByRole('group', {name: 'Equation', exact: true}).nth(1);
  await equation.focus();
  await expect(equation).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => equation.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
});

test('the methods index opens the existing test section by keyboard', async ({page}) => {
  await page.goto('/en/methods');
  const link = page.getByRole('navigation', {name: 'On this page'}).getByRole('link', {name: 'Tests', exact: true});
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/en\/methods#tests$/);
  await expect(page.getByRole('heading', {name: 'Tests', exact: true})).toBeInViewport({timeout: 20000});
});

test('home discloses source date without implying current research activity', async ({page}) => {
  await page.goto('/pt');
  await expect(page.getByText('O arquivo público em contexto')).toBeVisible();
  await expect(page.locator('.editorial-archive')).toContainText('última data do snapshot');
});

test('the DES-SN5YR interval result is clearly presented as exploratory', async ({page}) => {
  await page.goto('/pt');
  await expect(page.locator('.lead-story-copy a[href="/pt/results/t-05ae703af393"]')).toHaveCount(1);
  await expect(page.locator('.lead-story .sens-dot')).toHaveCount(await page.locator('.lead-story .viz-table tbody tr').count());
  await expect(page.locator('.editorial-featured')).toContainText('sem validação independente');
  await page.goto('/pt/results/t-05ae703af393');
  await expect(page.getByRole('main')).toContainText('reduziu em cerca de 94%');
  await expect(page.getByText('Data do registro público', {exact: true})).toBeVisible();
});

test.describe('theme', () => {
  test.use({colorScheme: 'dark'});
  test('theme toggle switches and persists', async ({page}) => {
  await page.goto('/pt');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', {name: 'Alternar tema'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test('language switch keeps the page', async ({page}) => {
  await page.goto('/pt/methods');
  await page.getByRole('link', {name: /Idioma: EN/}).click();
  await expect(page).toHaveURL(/\/en\/methods$/);
});

test('security headers are present and no private routes are reachable', async ({request}) => {
  const response = await request.get('/pt');
  expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  for (const path of ['/api/atlas-cockpit', '/api/atlas-session', '/cockpit']) expect((await request.get(path)).status()).not.toBe(200);
});

test('sitemap lists localized scientific families', async ({request}) => {
  const body = await (await request.get('/sitemap.xml')).text();
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1] ?? '');
  expect(locs.filter(loc => loc.includes('/results/families/')).length).toBeGreaterThan(10);
  expect(locs.filter(loc => /\/results\/t-[a-f0-9]+/.test(loc)).length).toBe(0);
  const dates = new Set([...body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(match => match[1]));
  expect(dates.size).toBeGreaterThan(1);
});

test('keyboard users reach the main content through the skip link', async ({page}) => {
  await page.goto('/en');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', {name: 'Skip to content'})).toBeFocused();
});

test('the private area is only a redirect to the existing Cockpit', async ({request}) => {
  for (const path of ['/privado', '/pt/privado', '/en/privado']) {
    const response = await request.get(path, {maxRedirects: 0});
    expect([307, 308]).toContain(response.status());
    expect(response.headers().location).toBe('https://nexo-one-two.vercel.app/cockpit');
  }
});

test('language switch preserves records and URL filters', async ({page}) => {
  await page.goto('/pt/results?line=expansion&survey=DES-SN5YR&q=DESI');
  await page.getByRole('link', {name: 'Idioma: EN'}).click();
  await expect(page).toHaveURL(/\/en\/results\?/);
  await expect(page.getByRole('searchbox', {name: 'Search'})).toHaveValue('DESI');
  await page.goto('/pt/results/t-05ae703af393');
  await page.getByRole('link', {name: 'Idioma: EN'}).click();
  await expect(page).toHaveURL(/\/en\/results\/t-05ae703af393$/);
});

test('editorial homepage is responsive and shows real credited observations', async ({page}) => {
  for (const width of [360,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto('/pt');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await expect(page.locator('main img')).toHaveCount(4);
    for (const image of await page.locator('main img').all()) {
      // Not scrollIntoViewIfNeeded: it waits for a still box, and the hero image drifts by design.
      await image.evaluate(node => node.scrollIntoView({block: 'center', behavior: 'instant'}));
      await expect.poll(async () => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  }
});


test('Open Graph image and favicon resolve without locale redirects', async ({request}) => {
  const og = await request.get('/opengraph-image', {maxRedirects: 0});
  expect(og.status()).toBe(200);
  expect(og.headers()['content-type']).toContain('image/png');
  const favicon = await request.get('/favicon.ico', {maxRedirects: 0});
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()['content-type']).toMatch(/image|icon/);
});
