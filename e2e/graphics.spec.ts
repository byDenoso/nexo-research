import {expect, test} from '@playwright/test';

const animation = (selector: string) => (page: import('@playwright/test').Page) =>
  page.locator(selector).first().evaluate(node => getComputedStyle(node).animationName);

test('the hero is animated, and still reads as one plain heading', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/pt');
  await expect(page.getByRole('heading', {level: 1, name: 'Expansão do Universo e energia escura'})).toBeVisible();
  expect(await animation('.word > span')(page)).toBe('word-rise');
  expect(await animation('.cine-image')(page)).toBe('ken-burns');
  expect(await animation('.reticle-ticks')(page)).toBe('spin');
  await expect(page.locator('.reticle')).toHaveAttribute('aria-hidden', 'true');
  // The title finishes in place: no word is left clipped or shifted.
  await expect.poll(() => page.locator('.word > span').last().evaluate(node => node.getAnimations().every(item => item.playState === 'finished'))).toBe(true);
  expect(await page.locator('.word > span').last().evaluate(node => getComputedStyle(node).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const selector of ['.word > span', '.cine-image', '.reticle-ticks', '.field-a', '.status-badge']) {
    expect(await animation(selector)(page), selector).toBe('none');
  }
  await expect(page.locator('.field-b')).toBeHidden();
  await expect(page.getByRole('heading', {level: 1})).toBeVisible();
});

test('figures assemble when they come into view and land on the published values', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/pt');
  const figure = page.locator('.lead-story .sens');
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute('data-inview', 'in');
  const dot = figure.locator('.sens-dot[data-active]');
  expect(await dot.evaluate(node => getComputedStyle(node).animationName)).toBe('dot-fly');
  await expect.poll(() => dot.evaluate(node => node.getAnimations().every(item => item.playState === 'finished'))).toBe(true);
  // 94% of the track, exactly where the inline style says.
  const offset = await dot.evaluate(node => {
    const track = node.parentElement!.getBoundingClientRect(), box = node.getBoundingClientRect();
    return (box.left + box.width / 2 - track.left) / track.width;
  });
  expect(offset).toBeCloseTo(0.94, 2);

  const pair = page.locator('.story-pair .pair');
  await pair.scrollIntoViewIfNeeded();
  await expect(pair).toHaveAttribute('data-inview', 'in');
  await expect(pair.locator('.pair-values dd')).toHaveText(['2,18 σ', '0,35 σ']);

  const metrics = page.locator('.editorial-archive-metrics dd');
  await metrics.first().scrollIntoViewIfNeeded();
  await expect(metrics.nth(0)).toHaveText('35');
  await expect(metrics.nth(1)).toHaveText('169');
});

test('reduced motion shows every figure complete at once', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/en');
  await expect(page.locator('.lead-story .sens')).toHaveAttribute('data-inview', 'in');
  await expect(page.locator('.story-pair .pair')).toHaveAttribute('data-inview', 'in');
  expect(await page.locator('.sens-dot').first().evaluate(node => getComputedStyle(node).opacity)).toBe('1');
  await expect(page.locator('.editorial-archive-metrics dd').nth(1)).toHaveText('169');
});

test.describe('without scripts', () => {
  test.use({javaScriptEnabled: false});
  test('figures and numbers are complete in the served page', async ({page}) => {
    await page.goto('/pt');
    expect(await page.locator('.sens-dot').first().evaluate(node => getComputedStyle(node).opacity)).toBe('1');
    expect(await page.locator('.pair-dot').first().evaluate(node => getComputedStyle(node).opacity)).toBe('1');
    await expect(page.locator('.editorial-archive-metrics dd').nth(0)).toHaveText('35');
    await expect(page.locator('.pair-values dd').first()).toHaveText('2,18 σ');
  });
});

test('motion never widens the page', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('/pt');
    for (const top of [0, 600, 1800, 4200]) {
      await page.evaluate(value => window.scrollTo({top: value, behavior: 'instant'}), top);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${width}px at ${top}`).toBeLessThanOrEqual(0);
    }
  }
});
