import AxeBuilder from '@axe-core/playwright';
import {expect, test} from '@playwright/test';

const PAGES = ['/pt', '/en', '/pt/results', '/pt/results/t-9cdf8dcdf082', '/en/methods', '/pt/data', '/en/research', '/pt/publications', '/en/contact'];

for (const scheme of ['dark', 'light'] as const) {
  test.describe(scheme, () => {
    test.use({colorScheme: scheme});
    for (const path of PAGES) {
      test(`${path} has no WCAG 2.2 AA violations`, async ({page}) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(results.violations.map(item => `${item.id}: ${item.nodes.slice(0, 2).map(node => node.target.join(' ')).join(' | ')}`)).toEqual([]);
      });
    }
  });
}
