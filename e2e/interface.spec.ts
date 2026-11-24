import AxeBuilder from '@axe-core/playwright';
import {expect, test} from '@playwright/test';
import sample from '../data/source/pantheon-sky-summary.json' with {type: 'json'};

test('the old expansion bookmark goes to the bilingual lab and keeps the comparison scenario', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/en?scenario=shortRuler#expansao-em-etapas');
  await expect(page).toHaveURL(/\/en\/resultado-vivo\?scenario=shortRuler#expansao-em-etapas$/);
  const experiment = page.getByRole('tab', {name: 'Expansion experiment'});
  await expect(experiment).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', {name: 'Expansion experiment'})).toContainText('What happens to light');
  await page.getByRole('button', {name:'Observation', exact:true}).click();
  await experiment.focus();
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', {name: 'Compare probes'})).toBeFocused();
  await expect(page.getByRole('combobox', {name: 'Scenario', exact: true})).toHaveValue('shortRuler');
  await page.goBack();
  await expect(experiment).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.expansion-story')).toBeVisible();
  await expect(page.locator('.expansion-story tbody')).toContainText('1,500 nm');
});

test('the page menu finds accented destinations, handles touch, Escape and direct navigation', async ({page,isMobile}) => {
  await page.setViewportSize({width:isMobile ? 295 : 1280, height:850});
  await page.goto('/pt/methods');
  await expect(page.locator('html')).toHaveAttribute('data-lab-motion', '');
  const menu = page.locator('details.site-menu');
  if (isMobile) await menu.locator('summary').tap();
  else await page.keyboard.press('Control+k');
  const search = menu.getByRole('searchbox', {name:'Filtrar páginas do menu'});
  if (!isMobile) await expect(search).toBeFocused();
  await search.fill('xyzzy');
  await expect(menu.getByRole('status')).toContainText('Nenhuma página encontrada.');
  await search.fill('publicacoes');
  await expect(menu.getByRole('link')).toHaveCount(1);
  await expect(menu.getByRole('link')).toHaveAccessibleName('Publicações');
  await search.press('Escape');
  await expect(menu.locator('summary')).toBeFocused();
  if (isMobile) await menu.locator('summary').press('Enter');
  else await page.keyboard.press('Meta+k');
  await expect(search).toHaveValue('');
  await search.fill('experimento expansao');
  const audit = await new AxeBuilder({page}).include('header.site-header').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(audit.violations.map(v => v.id)).toEqual([]);
  await search.press('ArrowDown');
  await expect(menu.getByRole('link', {name:'Experimento de expansão'})).toBeFocused();
  await Promise.all([
    page.waitForURL('**/pt/resultado-vivo#expansao-em-etapas', {waitUntil:'load'}),
    page.keyboard.press('Enter'),
  ]);
  await expect(page.getByRole('tab', {name:'Experimento de expansão'})).toHaveAttribute('aria-selected', 'true', {timeout:10000});
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('the retained Pantheon+ histogram uses all ten catalogue bins, has keyboard selection and an accessible table', async ({page,isMobile}) => {
  await page.setViewportSize({width:isMobile ? 295 : 1440,height:850});
  await page.goto('/pt/data#pantheon-volume');
  const plate = page.locator('#pantheon-volume .volume-plate');
  await plate.getByRole('button', {name:'Redshift'}).click();
  const slider = plate.getByRole('slider');
  await slider.press('End');
  await expect(plate.locator('output')).toHaveText('1 supernova');
  await slider.press('ArrowLeft');
  await expect(plate.locator('output')).toHaveText('0 supernovas');
  await slider.press('Home');
  await expect(plate.locator('output')).toHaveText('929 supernovas');
  await plate.locator('summary').click();
  const table = plate.getByRole('table', {name:'Supernovas por faixa de redshift'});
  expect((await table.locator('tbody td').allTextContents()).map(Number)).toEqual(sample.redshiftCounts);
  await expect(plate.getByRole('link', {name:'Dados Pantheon+'})).toHaveAttribute('href',sample.source);
  expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBe(0);
  const audit = await new AxeBuilder({page}).include('.volume-plate').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(audit.violations.map(v => v.id)).toEqual([]);
  await plate.getByRole('button',{name:'Volume'}).click();
  await expect(plate.getByRole('img',{name:/quatro cascas/})).toBeVisible();
});

test('route navigation, document outline and the reading indicator follow user navigation', async ({page}) => {
  await page.goto('/pt/about');
  const outline=page.getByRole('navigation',{name:'Neste documento'});
  await outline.getByRole('link',{name:'Direção'}).click();
  await expect(outline.getByRole('link',{name:'Direção'})).toHaveAttribute('aria-current','location');
  await page.emulateMedia({reducedMotion:'no-preference'});
  const indicator=page.locator('.site-header');
  if (await page.evaluate(()=>CSS.supports('animation-timeline','scroll(root block)'))) {
    expect(await indicator.evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('reading-progress');
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await indicator.evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('none');
  await page.goto('/pt/resultado-vivo');
  await expect(page.locator('.header-living')).toHaveAttribute('aria-current','page');
});

test.describe('the server document without scripts', () => {
  test.use({javaScriptEnabled:false});
  test('both living result sections and the primary home action remain available', async ({page}) => {
    await page.goto('/pt');
    await expect(page.locator('.cover-actions a').first()).toHaveAccessibleName('Explorar resultados');
    await expect(page.locator('.expansion-story')).toHaveCount(0);
    await page.locator('.chapter-experiment').click();
    await expect(page.locator('.living-tabs a')).toHaveCount(2);
    await expect(page.locator('#comparar-sondas h2').first()).toBeVisible();
    await expect(page.locator('#expansao-em-etapas table')).toBeVisible();
  });
});
