import {expect, test, type Page} from '@playwright/test';

const withoutTimelines = (page: Page) => page.addInitScript(() => {
  const supports = CSS.supports.bind(CSS);
  CSS.supports = (property: string, value?: string) => {
    if (property.includes('animation-timeline: view()')) return false;
    return value === undefined ? supports(property) : supports(property, value);
  };
});

const methodProgress = (page: Page) => page.locator('.site-header').evaluate(node => {
  const {transform} = getComputedStyle(node, '::after');
  return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).a;
});

const scrollMethod = (page: Page, fraction: number) => page.locator('.methods-article').evaluate((article, value) => {
  const box = article.getBoundingClientRect();
  const header = document.querySelector('.site-header')!.getBoundingClientRect().height;
  const length = box.height - (window.innerHeight - header);
  window.scrollTo({top: window.scrollY + box.top - header + length * value, behavior: 'instant'});
}, fraction);

for (const native of [true, false]) {
  test(`method progress follows the article forward and back (${native ? 'CSS' : 'fallback'})`, async ({page}) => {
    await page.emulateMedia({reducedMotion: 'no-preference'});
    if (!native) await withoutTimelines(page);
    await page.goto('/pt/methods');
    await expect.poll(() => methodProgress(page)).toBeCloseTo(0, 1);
    await scrollMethod(page, .7);
    await expect.poll(() => methodProgress(page)).toBeCloseTo(.7, 1);
    await scrollMethod(page, .3);
    await expect.poll(() => methodProgress(page)).toBeCloseTo(.3, 1);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await expect.poll(() => methodProgress(page)).toBe(0);
    await expect(page.locator('.methods-article h2').last()).toHaveText('Reprodutibilidade');
  });
}

test('without scroll timelines, a heading reveals once when it enters the viewport', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await withoutTimelines(page);
  await page.goto('/en');
  const heading = page.locator('.source-copy h2');
  await expect(heading).toHaveAttribute('data-reveal', 'pending');
  expect(await heading.evaluate(node => getComputedStyle(node).animationName)).toBe('none');
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveAttribute('data-reveal', 'mask-up');
  expect(await heading.evaluate(node => getComputedStyle(node).opacity)).toBe('1');
  expect(await heading.evaluate(node => getComputedStyle(node).animationDuration)).toBe('0.56s');
  await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
  await expect(heading).toHaveAttribute('data-reveal', 'mask-up');
});

test('without timelines or motion, headings are complete without a reveal', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await withoutTimelines(page);
  await page.goto('/en');
  const heading = page.locator('.source-copy h2');
  const style = await heading.evaluate(node => {
    const {animationName, clipPath, opacity} = getComputedStyle(node);
    return {animationName, clipPath, opacity};
  });
  expect(style).toEqual({animationName: 'none', clipPath: 'none', opacity: '1'});
});
