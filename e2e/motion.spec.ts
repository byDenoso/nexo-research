import {expect, test} from '@playwright/test';

test.describe('native research interactions', () => {
  test.use({javaScriptEnabled: false});

  for (const locale of ['pt', 'en']) {
    test(`the ${locale} chart links to the same count in the source table by keyboard`, async ({page}) => {
      await page.setViewportSize({width: 360, height: 800});
      await page.goto(`/${locale}`);
      const survey = page.getByRole('list', {name: /Conjuntos de dados nos resultados públicos|Data sets in the public results/})
        .getByRole('link', {name: /Pantheon\+/});
      await expect(survey).toBeVisible();
      const count = await survey.getByText(/^\d+$/).innerText();
      await survey.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`/${locale}/data#dataset-pantheon-plus$`));
      const row = page.getByRole('row').filter({has: page.getByRole('rowheader', {name: 'Pantheon+'})});
      await expect(row).toBeInViewport();
      await expect(row).toBeFocused();
      await expect(row.getByRole('cell')).toHaveText(count);
    });
  }

  test('the research path opens with the hypothesis and leads to the selected method', async ({page}) => {
    await page.goto('/en');
    const path = page.getByRole('region', {name: 'How the research is done'});
    const hypothesis = path.getByText(/^The question is written before the calculation/);
    await expect(hypothesis).toBeVisible();

    await path.locator('summary').filter({hasText: 'Tests'}).focus();
    await page.keyboard.press('Enter');
    await expect(hypothesis).toBeHidden();
    await expect(path.getByText(/^Fits, comparisons/)).toBeVisible();

    await path.getByRole('link', {name: 'See the methodology'}).click();
    await expect(page).toHaveURL(/\/en\/methods#tests$/);
    await expect(page.getByRole('heading', {name: 'Tests', exact: true})).toBeInViewport();
  });
});

test('the white and black themes share the blue research panel', async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.emulateMedia({colorScheme: 'light'});
  await page.goto('/pt');

  const panel = page.getByRole('region', {name: 'A pesquisa em números'});
  await expect(panel).toHaveCSS('background-color', 'rgb(0, 51, 160)');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('img[src*="cosmic-field"]')).toHaveCount(0);

  await page.getByRole('button', {name: 'Alternar tema'}).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(panel).toHaveCSS('background-color', 'rgb(0, 51, 160)');
});

test('section motion works on internal pages and respects reduced motion', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/pt/methods');
  const heading = page.locator('.methods-article h2').last();
  const timeline = () => heading.evaluate(node => getComputedStyle(node).getPropertyValue('animation-timeline'));
  await expect.poll(timeline).toBe('view()');

  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect.poll(timeline).toBe('auto');
  await expect(heading).toBeVisible();
});

for (const colorScheme of ['dark', 'light'] as const) {
  test(`motion respects the reduced-motion preference in the ${colorScheme} theme`, async ({page}) => {
    await page.setViewportSize({width: 360, height: 800});
    await page.emulateMedia({colorScheme, reducedMotion: 'no-preference'});
    await page.goto('/pt');
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    const chart = page.getByRole('list', {name: 'Conjuntos de dados nos resultados públicos'});
    const animatedBars = () => chart.evaluate(node => node.getAnimations({subtree: true}).length);
    await expect.poll(animatedBars).toBeGreaterThan(0);

    await page.evaluate(() => window.scrollTo({top: 700, behavior: 'instant'}));
    const progress = () => page.locator('.site-header').evaluate(node => getComputedStyle(node, '::after').transform);
    await expect.poll(progress).toMatch(/^matrix\(0\.\d*[1-9]/);

    await page.emulateMedia({reducedMotion: 'reduce'});
    await expect.poll(animatedBars).toBe(0);
    await expect.poll(progress).toBe('none');
    await expect(chart.getByRole('link', {name: /Pantheon\+/})).toBeVisible();
    await expect(chart.locator('rect').first()).toHaveAttribute('width', '100');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  });
}

test('a keyboard-selected survey carries its label into the source table', async ({page}) => {
  await page.addInitScript(() => {
    addEventListener('pagereveal', async event => {
      const transition = (event as PageRevealEvent).viewTransition;
      const animations = transition && await transition.ready.then(() => document.getAnimations(), () => []);
      sessionStorage.setItem('survey-transition', JSON.stringify({
        path: location.pathname,
        snapshots: animations ? animations.map(animation => (animation.effect as KeyframeEffect).pseudoElement) : []
      }));
    });
  });

  const openSurvey = async (reducedMotion: 'no-preference' | 'reduce') => {
    await page.emulateMedia({reducedMotion});
    await page.goto('/pt');
    await page.locator('.activity-chart').getByRole('link', {name: /Pantheon\+/}).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/pt\/data#dataset-pantheon-plus$/);
  };
  const probe = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('survey-transition') ?? 'null'));

  await openSurvey('no-preference');
  await expect.poll(probe).toMatchObject({path: '/pt/data', snapshots: expect.arrayContaining([
    '::view-transition-old(survey-name)', '::view-transition-new(survey-name)'
  ])});

  await openSurvey('reduce');
  await expect.poll(probe).toEqual({path: '/pt/data', snapshots: []});
});
