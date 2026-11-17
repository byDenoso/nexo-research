import {expect, test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('the atlas switches from the observed sky to counts, models and a movable line', async ({page}) => {
  await page.goto('/pt/data#atlas');
  const atlas = page.locator('#atlas');
  const view = atlas.getByLabel('Visualização');
  await expect(atlas.getByRole('img')).toHaveAccessibleName(/Mapa celeste/);
  await view.selectOption('distribution');
  await atlas.locator('summary').click();
  const counts = await atlas.locator('dd').allTextContents();
  expect(counts.map(Number).reduce((a,b) => a+b, 0)).toBe(1543);
  await view.selectOption('expansion');
  await expect(atlas.locator('path.atlas-line')).toHaveCount(2);
  await view.selectOption('spectrum');
  const slider = atlas.getByRole('slider');
  await slider.focus();
  await page.keyboard.press('End');
  await expect(atlas).toContainText('1.312,56 nm');
  const audit = await new AxeBuilder({page}).include('#atlas').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(audit.violations.map(v => v.id)).toEqual([]);
});

test('measure the cover and its publication navigation in Chromium', async ({page}, info) => {
  await page.addInitScript(() => {
    const data = {lcpMs: 0, cls: 0, longestInteractionMs: 0};
    Object.assign(window, {nexoLab: data});
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) data.lcpMs = entry.startTime;
    }).observe({type: 'largest-contentful-paint', buffered: true});
    new PerformanceObserver(list => {
      for (const e of list.getEntries() as (PerformanceEntry & {hadRecentInput: boolean; value: number})[]) {
        if (!e.hadRecentInput) data.cls += e.value;
      }
    }).observe({type: 'layout-shift', buffered: true});
    new PerformanceObserver(list => {
      for (const e of list.getEntries() as (PerformanceEntry & {interactionId: number})[]) {
        if (e.interactionId) data.longestInteractionMs = Math.max(data.longestInteractionMs,e.duration);
      }
    }).observe({type: 'event', buffered: true, durationThreshold: 16} as PerformanceObserverInit);
  });
  await page.goto('/pt');
  await page.waitForLoadState('networkidle');
  await page.locator('.volume-plate summary').click();
  await expect(page.locator('.volume-plate details')).toHaveAttribute('open','');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true)))));
  const metrics = await page.evaluate(() => (window as Window & {nexoLab?: unknown}).nexoLab);
  console.log('NEXO lab sample', info.project.name, JSON.stringify(metrics));
  await info.attach('lab-sample.json', {body: JSON.stringify(metrics), contentType: 'application/json'});
  await page.locator('.cover-actions').getByRole('link',{name:'Publicações'}).click();
  await expect(page).toHaveURL(/\/pt\/publications$/);
});
