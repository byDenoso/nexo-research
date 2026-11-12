import {expect, test} from '@playwright/test';

const animation = (selector: string) => (page: import('@playwright/test').Page) =>
  page.locator(selector).first().evaluate(node => getComputedStyle(node).animationName);

test('the home reads as one plain heading and nothing on it animates', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/pt');
  await expect(page.getByRole('heading', {level: 1, name: 'NEXO Research Institute'})).toBeVisible();
  await expect(page.locator('.inst-feature-main .sens')).toHaveAttribute('data-inview', 'in');
  for (const selector of ['.sens-dot', '.pair-dot', '.status-badge', '.inst-cover img']) {
    expect(await animation(selector)(page), selector).toBe('none');
  }
  expect(await page.evaluate(() => document.getAnimations().filter(item => item instanceof CSSAnimation).length)).toBe(0);
});

test('figures are complete and sit on the published values', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/pt');
  const figure = page.locator('.inst-feature-main .sens');
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute('data-inview', 'in');
  const dot = figure.locator('.sens-dot[data-active]');
  expect(await dot.evaluate(node => getComputedStyle(node).opacity)).toBe('1');
  // 94% of the track, exactly where the inline style says.
  const offset = await dot.evaluate(node => {
    const track = node.parentElement!.getBoundingClientRect(), box = node.getBoundingClientRect();
    return (box.left + box.width / 2 - track.left) / track.width;
  });
  expect(offset).toBeCloseTo(0.94, 2);

  const pair = page.locator('.inst-side-item .pair');
  await pair.scrollIntoViewIfNeeded();
  await expect(pair).toHaveAttribute('data-inview', 'in');
  await expect(pair.locator('.pair-values dd')).toHaveText(['2,18 σ', '0,35 σ']);

  const facts = page.locator('.inst-facts b');
  await expect(facts.nth(0)).toHaveText('35');
  await expect(facts.nth(1)).toHaveText('169');
});

test('reduced motion shows every figure complete at once', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/en');
  await expect(page.locator('.inst-feature-main .sens')).toHaveAttribute('data-inview', 'in');
  await expect(page.locator('.inst-side-item .pair')).toHaveAttribute('data-inview', 'in');
  expect(await page.locator('.sens-dot').first().evaluate(node => getComputedStyle(node).opacity)).toBe('1');
  await expect(page.locator('.inst-facts b').nth(1)).toHaveText('169');
});

test.describe('without scripts', () => {
  test.use({javaScriptEnabled: false});
  test('figures and numbers are complete in the served page', async ({page}) => {
    await page.goto('/pt');
    expect(await page.locator('.sens-dot').first().evaluate(node => getComputedStyle(node).opacity)).toBe('1');
    expect(await page.locator('.pair-dot').first().evaluate(node => getComputedStyle(node).opacity)).toBe('1');
    await expect(page.locator('.inst-facts b').nth(0)).toHaveText('35');
    await expect(page.locator('.pair-values dd').first()).toHaveText('2,18 σ');
  });
});

test('the page never scrolls sideways', async ({page}) => {
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('/pt');
    for (const top of [0, 600, 1800, 4200]) {
      await page.evaluate(value => window.scrollTo({top: value, behavior: 'instant'}), top);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${width}px at ${top}`).toBeLessThanOrEqual(0);
    }
  }
});
