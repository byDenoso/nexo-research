import {expect, test} from '@playwright/test';

test.use({reducedMotion: 'reduce'});

test('research observation has its original source and is readable in both languages', async ({page}) => {
  for (const locale of ['pt', 'en']) {
    await page.goto(`/${locale}/research`);
    const figure = page.getByRole('figure', {name: /GOODS-S/});
    const image = figure.getByRole('img', {name: /GOODS-S/});
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(figure.getByRole('link', {name: /NASA, ESA, CSA, B\. Robertson/})).toHaveAttribute('href', 'https://esawebb.org/images/JADES2/');
  }
});

test('methods and data diagrams expose their ordered steps and sources', async ({page}) => {
  await page.goto('/pt/methods');
  const methods = page.getByRole('figure', {name: 'Percurso de um teste'});
  const steps = methods.getByRole('listitem');
  await expect(steps).toHaveCount(7);
  await expect(steps.first()).toContainText('Hipótese');
  await expect(steps.last()).toContainText('Publicação autorizada');
  await expect(methods.getByRole('link', {name: 'Metodologia do NEXO'})).toHaveAttribute('href', '#hypothesis');

  await page.goto('/en/data');
  const data = page.getByRole('figure', {name: 'How the public archive reaches the portal'});
  await expect(data.getByRole('listitem')).toHaveCount(4);
  await expect(data.getByRole('listitem').first()).toContainText('ATLAS_PUBLIC_V1');
  await expect(data.getByRole('listitem').last()).toContainText('Static pages');
  await expect(data.getByRole('link', {name: 'Documented data flow'})).toHaveAttribute('href', /github\.com\/byDenoso\/nexo-research#data-flow$/);
});
