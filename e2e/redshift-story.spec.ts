import {expect, test} from '@playwright/test';

const record = '/results/t-05ae703af393';

for (const locale of ['pt', 'en']) {
  test(`${locale}: the question leads to the result, limits, method and public sources`, async ({page}) => {
    const pt = locale === 'pt';
    await page.goto('/' + locale);
    const compare = page.getByRole('link', {name: pt ? 'Comparar os cortes de redshift' : 'Compare the redshift cuts'});
    await expect(compare).toBeVisible();
    await compare.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/' + locale + record);
    await expect(page.locator('#result')).toContainText(pt ? '94,2%' : '94.2%');
    await expect(page.locator('#result')).toContainText(pt ? '54,0%' : '54.0%');
    await expect(page.locator('#limits')).toContainText(pt ? 'significância estatística' : 'statistical significance');
    await expect(page.locator('article')).toContainText(pt ? 'Análise ainda sem validação independente confirmada.' : 'Analysis without confirmed independent validation.');
    const method = page.locator('.nx-jumps a[href="#method"]');
    await method.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#method$/);
    await expect(page.locator('#method .record-correction')).toContainText('CMB');
    const sources = page.locator('.nx-jumps a[href="#record-provenance-title"]');
    await sources.click();
    await expect(page).toHaveURL(/#record-provenance-title$/);
    await expect(page.locator('.nx-sources a[href="/atlas-public.json"]')).toBeVisible();
    await page.getByRole('link', {name: pt ? 'Idioma: EN' : 'Language: PT'}).click();
    await expect(page).toHaveURL(new RegExp('/' + (pt ? 'en' : 'pt') + record));
  });
}

test('the chart table is keyboard accessible and compares the public values', async ({page}) => {
  await page.goto('/pt');
  const figure = page.getByRole('figure', {name: 'Ganho de ajuste por corte'});
  await expect(page.locator('#result, #em-foco').first()).toContainText('94%');
  await expect(figure.locator('.nx-plot .nx-solid')).toHaveCount(5);
  await expect(figure.locator('.nx-plot .nx-hatched')).toHaveCount(4);
  const control = figure.locator('summary');
  await control.focus();
  await page.keyboard.press('Enter');
  await expect(control).toBeFocused();
  const focus = await control.evaluate(node => ({
    style: getComputedStyle(node).outlineStyle,
    width: getComputedStyle(node).outlineWidth,
  }));
  expect(focus).toEqual({style: 'solid', width: '2px'});
  await expect(figure.getByRole('table')).toBeVisible();
  await expect(figure.getByRole('row').nth(1).getByRole('cell')).toHaveText(['6,78', '7,86']);
  await expect(figure.getByRole('row').nth(2).getByRole('cell')).toHaveText(['0,39', '3,62']);
  await expect(figure.getByRole('row').nth(3).getByRole('cell')).toHaveText(['9,21', '7,72']);
  await expect(figure.getByRole('row').nth(4).getByRole('cell')).toHaveText(['7,82', 'Sem ajuste']);
});

test.describe('without scripts', () => {
  test.use({javaScriptEnabled: false});

  test('numerical evidence and scope are in the served HTML', async ({page}) => {
    await page.goto('/en');
    const figure = page.getByRole('figure', {name: 'Fit improvement by cut'});
    await figure.locator('summary').press('Enter');
    await expect(figure.getByRole('row').nth(2).getByRole('cell')).toHaveText(['0.39', '3.62']);
    await expect(page.locator('#limits')).toContainText('statistical significance');
    await expect(page.locator('main video, main canvas')).toHaveCount(0);
  });
});
