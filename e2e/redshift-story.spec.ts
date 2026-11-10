import {expect, test} from '@playwright/test';

test('the home redshift chart reveals all runs, highlights the 94% run, then draws the observed span', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/pt');
  const figure = page.locator('.lead-story .sens');
  await figure.locator('figcaption').scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute('data-inview', 'in');
  const dots = figure.locator('.sens-dot');
  await expect(dots).toHaveCount(51);
  const timing = await figure.evaluate(node => {
    const endTimes = (name: string) => node.getAnimations({subtree: true})
      .filter(animation => animation instanceof CSSAnimation && animation.animationName === name)
      .map(animation => {
        const {delay, endTime} = animation.effect!.getComputedTiming();
        return {delay: Number(delay), end: Number(endTime)};
      });
    return {runs: endTimes('dot-fly'), focus: endTimes('sens-focus-in'), extent: endTimes('sens-extent-in')};
  });
  expect(timing.runs).toHaveLength(51);
  expect(timing.focus).toHaveLength(1);
  expect(timing.extent).toHaveLength(1);
  expect(Math.max(...timing.runs.map(run => run.end))).toBeLessThanOrEqual(timing.focus[0]!.delay);
  expect(timing.focus[0]!.end).toBeLessThanOrEqual(timing.extent[0]!.delay);
  await expect(figure.getByRole('button', {name: /T-05ae703af393.*94%/})).toHaveAttribute('data-featured', '');
  await expect(figure.getByText('18%–95%', {exact: true})).toBeVisible();
});

test('the English redshift chart has the complete readout with reduced motion', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/en');
  const figure = page.locator('.lead-story .sens');
  await expect(figure.getByText('18%–95%', {exact: true})).toBeVisible();
  await expect(figure.getByRole('status')).toContainText('94%');
  expect(await figure.evaluate(node => node.getAnimations({subtree: true}).length)).toBe(0);
});

test.describe('without scripts', () => {
  test.use({javaScriptEnabled: false});
  test('the home redshift chart serves all three conclusions', async ({page}) => {
    await page.goto('/pt');
    const figure = page.locator('.lead-story .sens');
    await expect(figure.locator('.sens-dot')).toHaveCount(51);
    await expect(figure.getByRole('status')).toContainText('94%');
    await expect(figure.getByText('18%–95%', {exact: true})).toBeVisible();
  });
});
