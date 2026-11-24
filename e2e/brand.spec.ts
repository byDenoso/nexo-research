import {expect, test} from '@playwright/test';

test('the orbital mark is shared by the home links and browser icon', async ({page, request}) => {
  await page.goto('/pt/research');
  const icon = page.locator('link[rel="icon"][type="image/svg+xml"]');
  const iconPath = await icon.getAttribute('href');
  expect(iconPath).toMatch(/^\/icon\.svg/);
  expect((await request.get(iconPath!)).ok()).toBe(true);

  for (const region of ['banner', 'contentinfo'] as const) {
    const home = page.getByRole(region).getByRole('link', {name: 'NEXO Research'});
    await expect(home).toHaveAttribute('href', '/pt');
    const mask = await home.evaluate(node => getComputedStyle(node, '::before').maskImage);
    expect(mask).toContain('/icon.svg');
  }

  const social = await request.get('/opengraph-image');
  const png = await social.body();
  expect(social.ok()).toBe(true);
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});


const signature = 'Nature, Exploration & Origins';
for (const locale of ['pt', 'en'] as const) {
  test(`institutional signature and social metadata (${locale})`, async ({page, request}, info) => {
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.goto('/' + locale + '/about');
    await page.evaluate(() => document.fonts.ready);
    for (const width of [295, 360, 390, 560, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({width, height: 900});
      const header = page.locator('.site-header');
      const lockup = header.locator('.brand-signature');
      await expect(lockup).toBeVisible();
      await expect(lockup).toHaveText(signature);
      expect(await header.evaluate(node => node.getBoundingClientRect().height)).toBeLessThanOrEqual(80);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      const mark = await lockup.boundingBox();
      const controls = await header.locator('.header-controls').boundingBox();
      expect(mark!.x + mark!.width).toBeLessThanOrEqual(controls!.x + 1);
    }
    await expect(page.locator('.site-footer .brand-signature')).toHaveText(signature);
    await expect(page.locator('.inst-prose')).toContainText(signature);
    for (const term of ['Nature', 'Exploration', 'Origins']) await expect(page.locator('.inst-prose strong').filter({hasText: new RegExp('^' + term + '$')})).toHaveCount(1);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'NEXO Research Institute — ' + signature);
    const html = await (await request.get('/' + locale)).text();
    expect(html).toContain('Nature, Exploration &amp; Origins');
    expect(html).toContain('og:image');
    for (const theme of ['dark', 'light']) {
      await page.evaluate(value => {document.documentElement.dataset.theme = value}, theme);
      for (const width of [390, 1440]) {
        await page.setViewportSize({width, height: width === 390 ? 844 : 1000});
        const path = info.outputPath(`${locale}-identity-${theme}-${width}.png`);
        await page.screenshot({path, fullPage: true, animations: 'disabled', scale: 'css'});
        await info.attach(`${locale}-identity-${theme}-${width}`, {path, contentType:'image/png'});
      }
    }
    const image = await request.get('/opengraph-image');
    expect(image.ok()).toBeTruthy();
    const path = info.outputPath('social-' + locale + '.png');
    await info.attach('social-' + locale, {body: await image.body(), contentType: 'image/png'});
  });
}
