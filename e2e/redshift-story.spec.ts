import {expect, test} from '@playwright/test';

test('the home redshift chart shows all runs, the 94% run and the observed span at once', async ({page}) => {
  await page.goto('/pt');
  const figure = page.locator('.inst-feature-main .sens');
  await figure.locator('figcaption').scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute('data-inview', 'in');
  await expect(figure.locator('.sens-dot')).toHaveCount(51);
  expect(await figure.evaluate(node => node.getAnimations({subtree: true}).length)).toBe(0);
  await expect(figure.getByRole('button', {name: /T-05ae703af393.*94%/})).toHaveAttribute('data-featured', '');
  await expect(figure.locator('.sens-story li').nth(1).locator('span')).toHaveText('DES-SN5YR · sem z = 0,01–0,15');
  await expect(figure.getByText('18%–95%', {exact: true})).toBeVisible();
});

test('the English redshift chart has the complete readout with reduced motion', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/en');
  const figure = page.locator('.inst-feature-main .sens');
  await expect(figure.getByText('18%–95%', {exact: true})).toBeVisible();
  await expect(figure.getByRole('status')).toContainText('94%');
  await expect(figure.locator('.sens-story li').nth(1).locator('span')).toHaveText('DES-SN5YR · without z = 0.01–0.15');
  expect(await figure.evaluate(node => node.getAnimations({subtree: true}).length)).toBe(0);
});

test.describe('without scripts', () => {
  test.use({javaScriptEnabled: false});
  test('the home redshift chart serves all three conclusions', async ({page}) => {
    await page.goto('/pt');
    const figure = page.locator('.inst-feature-main .sens');
    await expect(figure.locator('.sens-dot')).toHaveCount(51);
    await expect(figure.getByRole('status')).toContainText('94%');
    await expect(figure.getByText('18%–95%', {exact: true})).toBeVisible();
  });
});
