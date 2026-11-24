import {expect, test} from '@playwright/test';

test('figures are complete and sit on the published values', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/pt');
  const track = page.locator('.nx-plot-emphasis .nx-plot-track').first();
  const fraction = await track.evaluate(node => {
    const bar = node.querySelector('.nx-solid')!;
    return bar.getBoundingClientRect().width / node.clientWidth;
  });
  expect(fraction).toBeCloseTo(0.3896262521736844 / 10, 2);

  const erosita = page.locator('.journal-erosita');
  await expect(erosita.locator('tbody td')).toHaveText(['2,18', '0,35']);
  await expect(erosita.locator('output')).toHaveText('2,18 σ');

  const facts = page.locator('.inst-facts dd');
  await expect(facts.nth(0)).toHaveText('35');
  await expect(facts.nth(1)).toHaveText('169');
});

test('reduced motion shows every figure complete at once', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/en');
  await expect(page.locator('#em-foco .nx-plot')).toBeVisible();
  await expect(page.locator('.journal-erosita output')).toHaveText('2.18 σ');
  expect(await page.locator('.nx-plot-track').first().evaluate(node => getComputedStyle(node).opacity)).toBe('1');
  await expect(page.locator('.inst-facts dd').nth(1)).toHaveText('169');
});

test.describe('without scripts', () => {
  test.use({javaScriptEnabled: false});
  test('figures and numbers are complete in the served page', async ({page}) => {
    await page.goto('/pt');
    expect(await page.locator('.nx-plot-track').first().evaluate(node => getComputedStyle(node).opacity)).toBe('1');
    await expect(page.locator('.inst-facts dd').nth(0)).toHaveText('35');
    await expect(page.locator('.journal-erosita tbody td')).toHaveText(['2,18', '0,35']);
  });
});

test('the page never scrolls sideways', async ({page}) => {
  for (const width of [295, 320, 360, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('/pt');
    for (const top of [0, 600, 1800, 4200]) {
      await page.evaluate(value => window.scrollTo({top: value, behavior: 'instant'}), top);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${width}px at ${top}`).toBeLessThanOrEqual(0);
    }
  }
});

test('the eROSITA plot switches with the keyboard and keeps the values and source available', async ({page, isMobile}) => {
  await page.goto('/pt');
  const story = page.locator('.journal-erosita');
  const all = story.getByRole('radio', {name: 'Todos os intervalos'});
  const removed = story.getByRole('radio', {name: 'Sem o intervalo mais distante'});
  const output = story.getByRole('status', {name: 'Significância nominal selecionada'});

  await story.getByRole('heading').getByRole('link').focus();
  await page.keyboard.press('Tab');
  await expect(all).toBeFocused();
  await expect(all).toBeChecked();
  await expect(output).toHaveText('2,18 σ');
  expect(await all.evaluate(radio => getComputedStyle(radio.closest('label')!).outlineStyle)).toBe('solid');

  await page.keyboard.press('ArrowRight');
  await expect(removed).toBeFocused();
  await expect(removed).toBeChecked();
  await expect(output).toHaveText('0,35 σ');
  await page.keyboard.press('ArrowLeft');
  await expect(output).toHaveText('2,18 σ');

  if (isMobile) {
    await story.locator('label').filter({hasText: 'Sem o intervalo mais distante'}).tap();
    await expect(output).toHaveText('0,35 σ');
  }
  await expect(story.getByRole('table')).toBeVisible();
  const source = story.getByRole('link', {name: 'atlas-public.json'});
  await expect(source).toHaveAttribute('href', '/atlas-public.json');
  expect((await page.request.get('/atlas-public.json')).ok()).toBeTruthy();
});

test('the DESI dossier exposes all seven omissions and signed changes with their source', async ({page}) => {
  await page.goto('/pt/results/families/bao-tracer-exclusion');
  const comparisonLink = page.getByRole('link', {name: 'Comparar o Δχ² após retirar cada traçador do DESI DR2'});
  await comparisonLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/t-28160180cded#desi-tracer-exclusion$/);
  const section = page.locator('#desi-tracer-exclusion');
  const table = section.getByRole('table');
  await expect(table.locator('tbody tr')).toHaveCount(8);
  await expect(table.getByRole('row', {name: /Todos os traçadores/})).toContainText('6,78');
  await expect(table.getByRole('row', {name: /LRG2/})).toContainText('−1,67');
  await expect(table.getByRole('row', {name: /LRG2/})).toContainText('−2,23');
  await expect(table.getByRole('row', {name: /Lyα/})).toContainText('+2,13');
  const source = section.getByRole('link', {name: 'Resultados e hashes (JSON)'});
  await source.focus();
  await expect(source).toBeFocused();
  const response = await page.request.get('/desi-dr2-tracer-diagnostic.json');
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json.record).toBe('T-28160180cded');
  expect(json.data_sources).toHaveLength(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('catalogue version and editorial dates come from their own records', async ({page}) => {
  await page.goto('/pt/results');
  const catalogue = page.locator('.nx-catalogue-head');
  await expect(catalogue.getByText('Versão do catálogo', {exact: true})).toBeVisible();
  await expect(catalogue.getByText('Última revisão editorial', {exact: true})).toBeVisible();
  const dates = await catalogue.locator('time').evaluateAll(nodes => nodes.map(node => node.getAttribute('datetime')));
  const snapshot = await (await page.request.get('/atlas-public.json')).json() as {tests: Array<{updated_at: string}>};
  expect(dates).toEqual([snapshot.tests.map(row => row.updated_at).sort().at(-1), '2026-11-19']);
  await page.goto('/pt/results/t-05ae703af393');
  const sources = page.getByRole('complementary', {name: 'Fontes e código'});
  await expect(sources.getByText(/Última correção editorial/).locator('time')).toHaveAttribute('datetime', '2026-11-12');
  await expect(page.locator('#non-phantom-profile')).toHaveCount(0);
});
