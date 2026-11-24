import {expect, test} from '@playwright/test';

test.use({colorScheme: 'dark', reducedMotion: 'reduce'});

for (const locale of ['pt', 'en'] as const) {
  for (const [label, route] of [
    ['home', ''],
    ['result', '/results/t-05ae703af393'],
    ['methods', '/methods'],
  ] as const) {
    test(`observatory ${locale} ${label}`, async ({page, isMobile}, info) => {
      await page.setViewportSize({width: isMobile ? 390 : 1440, height: isMobile ? 844 : 1000});
      await page.goto('/' + locale + route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await expect(page.getByRole('heading', {level: 1})).toHaveCount(1);
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
