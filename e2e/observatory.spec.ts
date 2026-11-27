import {expect, test} from '@playwright/test';

test.use({colorScheme: 'dark', reducedMotion: 'reduce'});

for (const locale of ['pt', 'en'] as const) {
  for (const [label, route] of [
    ['home', ''],
    ['result', '/results/t-05ae703af393'],
    ['methods', '/methods'],
    ['about', '/about'],
  ] as const) {
    test(`observatory ${locale} ${label}`, async ({page, isMobile}, info) => {
      await page.setViewportSize({width: isMobile ? 390 : 1440, height: isMobile ? 844 : 1000});
      await page.goto('/' + locale + route);
      await page.evaluate(() => document.fonts.ready);
      // The institute opens in the light glass theme whatever the system scheme; dark is a persisted choice.
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.getByRole('heading', {level: 1})).toHaveCount(1);
      if (label === 'home') await expect(page.getByRole('heading', {level: 1})).toHaveText(locale === 'pt' ? 'Expansão cósmica e formação de estruturas' : 'Cosmic expansion and structure formation');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      const filename = `${locale}-${label}-${isMobile ? 390 : 1440}.png`;
      const path = info.outputPath(filename);
      await page.screenshot({path, fullPage: true, animations: 'disabled', scale: 'css'});
      await info.attach(filename, {path, contentType: 'image/png'});
      if (isMobile) {
        await page.setViewportSize({width: 360, height: 800});
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      }
    });
  }
}
