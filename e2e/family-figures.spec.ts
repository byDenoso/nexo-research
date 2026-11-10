import {expect, test} from '@playwright/test';

for (const [family, count] of [['redshift-exclusion', 34], ['redshift-concentration', 16]] as const) {
  test(`the ${family} figure preserves all ${count} comparable published runs`, async ({page}) => {
    await page.goto(`/pt/results/families/${family}`);
    const figure = page.locator('.family-layout figure');
    await expect(figure).toHaveCount(1);
    await expect(figure.locator('.sens-dot')).toHaveCount(count);
    await figure.getByText('Ver os dados em tabela').click();
    await expect(figure.locator('tbody tr')).toHaveCount(count);
    await expect(figure.locator('tbody a').first()).toHaveAttribute('href', /^\/pt\/results\/t-/i);
  });
}

for (const [family, count, negative, positive] of [
  ['desi-dr1-tracers', 9, '−215,07', '4,08'],
  ['fixed-expansion-growth', 5, '−0,74', '0,81']
] as const) {
  test(`the ${family} figure shows signed Δχ² for all ${count} configurations`, async ({page}) => {
    await page.goto(`/pt/results/families/${family}`);
    const figure = page.locator('.family-layout figure');
    await expect(figure).toHaveCount(1);
    await expect(figure.getByRole('link')).toHaveCount(count);
    await expect(figure.getByText(negative, {exact: true})).toBeVisible();
    await expect(figure.getByText(positive, {exact: true})).toBeVisible();
    await expect(figure.getByText('0', {exact: true})).toBeVisible();
    await expect(figure.getByText(/z efetivo/).first()).toBeVisible();
  });
}

test('families with qualitative results or only one value have no comparison figure', async ({page}) => {
  for (const family of ['bao-prior', 'bao-tracer-exclusion', 'bao-dr1-dr2', 'foreground-directions', 'supernova-holdout', 't-9cdf8dcdf082']) {
    await page.goto(`/pt/results/families/${family}`);
    await expect(page.locator('.family-layout figure')).toHaveCount(0);
  }
});

test('the eROSITA family compares the two values published in its one record', async ({page}) => {
  await page.goto('/pt/results/families/t-0e94e9e2951b');
  const figure = page.locator('.family-layout figure');
  await expect(figure).toHaveCount(1);
  await expect(figure.locator('.pair-values dd')).toHaveText(['2,18 σ', '0,35 σ']);
  await expect(figure.getByText(/significância nominal da inclinação/)).toBeVisible();
});
