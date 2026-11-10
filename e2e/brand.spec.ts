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
