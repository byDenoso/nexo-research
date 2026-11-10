import {expect, test} from '@playwright/test';

test('the catalogue title travels to the family heading without replacing the document', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.addInitScript(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = update => {
      const transition = start(update);
      void transition.ready.then(() => {
        const groups = document.documentElement.getAnimations({subtree: true}).map(animation => (animation.effect as KeyframeEffect).pseudoElement);
        document.documentElement.dataset.titleTransition = String(groups.some(group => group?.includes('nx-catalogue-')));
      }, () => {});
      return transition;
    };
  });
  await page.goto('/pt/results');
  await page.evaluate(() => { document.documentElement.dataset.sameDocument = 'yes'; });
  const link = page.locator('.result-grid h3 a').first();
  const title = (await link.innerText()).trim();
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/pt\/results\/families\//);
  await expect(page.getByRole('heading', {level: 1, name: title})).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-same-document', 'yes');
  await expect(page.locator('html')).toHaveAttribute('data-title-transition', 'true');
});

test('the catalogue opens the same heading without View Transitions', async ({page}) => {
  await page.addInitScript(() => Object.defineProperty(document, 'startViewTransition', {value: undefined}));
  await page.goto('/en/results');
  const link = page.locator('.result-grid h3 a').first();
  const title = (await link.innerText()).trim();
  await link.click();
  await expect(page.getByRole('heading', {level: 1, name: title})).toBeVisible();
});
