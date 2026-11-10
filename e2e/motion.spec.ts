import {expect, test} from '@playwright/test';

test.describe('native research interactions', () => {
  test.use({javaScriptEnabled: false});

  for (const locale of ['pt', 'en']) {
    test('the ' + locale + ' archive section opens provenance by keyboard', async ({page}) => {
      await page.setViewportSize({width: 360, height: 800});
      await page.goto('/' + locale);
      const panel = page.locator('.editorial-archive');
      const link = panel.getByRole('link');
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp('/' + locale + '/data$'));
      await expect(page.locator('#snap + dl').getByText('ATLAS_PUBLIC_V1', {exact: true})).toBeVisible();
    });
  }

  test('the research path opens with the hypothesis and leads to the selected method', async ({page}) => {
    await page.goto('/en');
    const path = page.getByRole('region', {name: 'How a hypothesis is tested'});
    const hypothesis = path.getByText(/^The question is written before the calculation/);
    await expect(hypothesis).toBeVisible();

    await path.locator('summary').filter({hasText: 'Tests'}).focus();
    await page.keyboard.press('Enter');
    await expect(hypothesis).toBeHidden();
    await expect(path.getByText(/^Fits, comparisons/)).toBeVisible();

    await path.getByRole('link', {name: 'See the methodology'}).click();
    await expect(page).toHaveURL(/\/en\/methods#tests$/);
    await expect(page.getByRole('heading', {name: 'Tests', exact: true})).toBeInViewport({timeout: 20000});
  });
});

test('the method chapter, the sources chapter and the footer keep one dark look in both themes', async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.emulateMedia({colorScheme: 'light'});
  await page.goto('/pt');

  const chapters = page.locator('.dark-chapter');
  await expect(chapters).toHaveCount(3);
  for (const chapter of await chapters.all()) await expect(chapter).toHaveCSS('background-color', 'rgb(2, 5, 11)');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(247, 246, 242)');
  await expect(page.locator('img[src*="cosmic-field"]')).toHaveCount(0);
  // Links inside the chapter use the light-on-dark accent even in the white theme.
  await expect(page.locator('.method-chapter .text-link').first()).toHaveCSS('color', 'rgb(155, 185, 255)');

  await page.getByRole('button', {name: 'Alternar tema'}).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(2, 5, 11)');
  for (const chapter of await chapters.all()) await expect(chapter).toHaveCSS('background-color', 'rgb(2, 5, 11)');
});

test('the method track marks progress and shows one stage at a time', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto('/en');
  const track = page.locator('.pipeline');
  const active = () => track.evaluate(node => getComputedStyle(node).getPropertyValue('--active').trim());
  expect(await active()).toBe('1');
  await track.locator('summary').filter({hasText: 'Review'}).click();
  expect(await active()).toBe('5');
  await expect(track.locator('details[open]')).toHaveCount(1);
  await expect(track.getByText(/^A second reading tries to refute/)).toBeVisible();
  // The open stage fills the shared panel under the track, not its own column.
  const panel = await track.locator('details[open] .pipeline-copy').boundingBox();
  const whole = await track.boundingBox();
  expect(panel!.width).toBeGreaterThan(whole!.width * 0.95);
});

const motionSections = [
  ['/pt', '.pipeline-step summary'],
  ['/en/research', '.research-panel'],
  ['/en/results', '.results-filters'],
  ['/pt/results/t-05ae703af393', '.record-values > li'],
  ['/pt/methods', '.methods-article h2'],
  ['/en/data', '#mentioned'],
  ['/pt/projects', 'main .card'],
  ['/en/about', '.prose-nx h2'],
  ['/pt/code', 'main .card'],
  ['/en/contact', '.contact-card > div'],
  ['/pt/updates', '.updates-editorial-layout section'],
  ['/en/publications', '.page-body .card']
] as const;

for (const [path, selector] of motionSections) {
  test(`${path} reveals content on scroll and respects reduced motion`, async ({page}) => {
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.goto(path);
    const block = page.locator(selector).first();
    await expect(block).toHaveCSS('animation-timeline', 'view()');

    await page.emulateMedia({reducedMotion: 'reduce'});
    await expect(block).toHaveCSS('animation-timeline', 'auto');
    await expect(block).toBeVisible();
  });
}

for (const colorScheme of ['dark', 'light'] as const) {
  test('motion respects reduced-motion in ' + colorScheme, async ({page}) => {
    await page.setViewportSize({width: 360, height: 800});
    await page.emulateMedia({colorScheme, reducedMotion: 'no-preference'});
    await page.goto('/pt');
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    const progress = () => page.locator('.site-header').evaluate(node => getComputedStyle(node, '::after').transform);
    await page.evaluate(() => window.scrollTo({top: 700, behavior: 'instant'}));
    await expect.poll(progress).toMatch(/^matrix\(0\.\d*[1-9]/);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await expect.poll(progress).toBe('none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  });
}

test('keyboard navigation opens a scientific family and its original record', async ({page}) => {
  await page.goto('/pt/results');
  const first = page.getByRole('main').getByRole('article').first().getByRole('link').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/pt\/results\/families\//);
  await page.getByRole('link', {name: 'Método, limites e proveniência'}).first().focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/pt\/results\/t-[0-9a-f]{12}$/);
});
