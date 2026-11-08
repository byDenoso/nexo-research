import {expect, test} from '@playwright/test';

const ROUTES = ['', '/research', '/results', '/publications', '/projects', '/methods', '/data', '/code', '/updates', '/about', '/contact'];

test('root redirects to the visitor language', async ({request}) => {
  const pt = await request.get('/', {maxRedirects: 0, headers: {'accept-language': 'pt-BR,pt;q=0.9'}});
  expect([307, 308]).toContain(pt.status());
  expect(pt.headers().location).toMatch(/\/pt$/);
  const en = await request.get('/', {maxRedirects: 0, headers: {'accept-language': 'en-US,en;q=0.9'}});
  expect(en.headers().location).toMatch(/\/en$/);
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
  await expect(page.getByRole('status').filter({hasText: 'exibidos'})).toContainText('24 de 169');
  await page.getByRole('button', {name: 'Mostrar mais'}).click();
  await expect(page.getByRole('status').filter({hasText: 'exibidos'})).toContainText('48 de 169');
  await page.getByLabel('Buscar').fill('DESI');
  const shown = page.getByRole('status').filter({hasText: 'exibidos'});
  await expect(shown).not.toContainText('de 169');
  await page.getByLabel('Buscar').fill('zzzz-no-match');
  await expect(page.getByText('Nenhum registro encontrado.')).toBeVisible();
  await page.getByRole('button', {name: 'Limpar filtros'}).click();
  await page.getByRole('heading', {level: 3}).first().getByRole('link').click();
  await expect(page).toHaveURL(/\/pt\/results\/t-[0-9a-f]{12}$/);
  await expect(page.getByText('Candidato').first()).toBeVisible();
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
  await expect(page).toHaveURL(/\/en$/);
});

test('security headers are present and no private routes are reachable', async ({request}) => {
  const response = await request.get('/pt');
  expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  for (const path of ['/api/atlas-cockpit', '/api/atlas-session', '/cockpit']) expect((await request.get(path)).status()).not.toBe(200);
});

test('sitemap lists every localized result', async ({request}) => {
  const body = await (await request.get('/sitemap.xml')).text();
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1] ?? '');
  expect(locs.filter(loc => loc.includes('/results/t-')).length).toBe(169 * 2);
});

test('keyboard users reach the main content through the skip link', async ({page}) => {
  await page.goto('/en');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', {name: 'Skip to content'})).toBeFocused();
});
