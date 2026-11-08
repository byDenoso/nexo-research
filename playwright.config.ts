import {defineConfig, devices} from '@playwright/test';

const port = Number(process.env.PORT ?? 3100);
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {baseURL: `http://localhost:${port}`, channel: process.env.PW_CHANNEL || undefined},
  projects: [
    {name: 'desktop', use: {...devices['Desktop Chrome']}},
    {name: 'mobile', use: {...devices['Pixel 5']}}
  ],
  webServer: process.env.NO_SERVER ? undefined : {command: `npx next start -p ${port}`, url: `http://localhost:${port}/pt`, reuseExistingServer: true, timeout: 120000}
});
