import {readFile} from 'node:fs/promises';
import {expect, test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({launchOptions: {args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']}});

type Sample = {counts: number[]; renderer: string; error: number; pixel: number[]; draws: number; issued: number};
type InstrumentedWindow = Window & {observatorySample?: Sample};

test('real WebGL2 draw, filtered viewport counts, gestures, export and both localized covers', async ({page, context, isMobile}, info) => {
  test.setTimeout(90_000);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.addInitScript(() => {
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function(mode, first, count) {
      draw.call(this, mode, first, count);
      if (mode !== this.POINTS || !(this.canvas instanceof HTMLCanvasElement) || !this.canvas.parentElement?.matches('.desi-stage')) return;
      const win = window as InstrumentedWindow;
      const sample = win.observatorySample ??= {counts: [], renderer: '', error: 0, pixel: [], draws: 0, issued: 0};
      sample.issued++;
      if (sample.counts.length < 8 && !sample.counts.includes(count)) sample.counts.push(count);
      if (sample.draws >= 2) return;
      const extension = this.getExtension('WEBGL_debug_renderer_info');
      sample.renderer = this.getParameter(extension?.UNMASKED_RENDERER_WEBGL ?? this.RENDERER);
      sample.error = this.getError();
      const size = Math.min(240, this.drawingBufferWidth, this.drawingBufferHeight);
      const pixels = new Uint8Array(size * size * 4);
      this.readPixels(Math.floor((this.drawingBufferWidth - size) / 2), Math.floor((this.drawingBufferHeight - size) / 2), size, size, this.RGBA, this.UNSIGNED_BYTE, pixels);
      let colored = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i]! > 8 || pixels[i + 1]! > 11 || pixels[i + 2]! > 18) colored++;
      }
      sample.pixel.push(colored);
      sample.draws++;
    };
  });
  await page.setViewportSize({width: isMobile ? 390 : 1440, height: isMobile ? 844 : 1000});
  const dataRequests: string[] = [];
  page.on('request', request => { if (/\/observatory\/.*\.bin$/.test(request.url())) dataRequests.push(request.url()); });
  await page.goto('/pt');
  const stage = page.locator('.desi-stage');
  const counts = page.locator('.desi-layers output');
  const countValues = () => counts.evaluateAll(nodes => nodes.map(node => Number((node as HTMLOutputElement).dataset.count)));
  await expect(stage.getByRole('img')).toBeVisible();
  await expect(counts).toHaveText(['143.633', '941']);
  expect(dataRequests).toHaveLength(0);
  await page.getByRole('button', {name: 'Ativar 3D'}).click();
  await expect(stage).toHaveAttribute('data-backend', 'webgl2', {timeout: 30_000});
  await expect.poll(() => countValues()).toEqual([143633, 941]);
  const initialSample = await page.evaluate(() => (window as InstrumentedWindow).observatorySample!);
  expect(initialSample.renderer).toMatch(/ANGLE|GL|SwiftShader|GPU|Mesa/i);
  expect(initialSample.error).toBe(0);
  expect(initialSample.counts).toEqual([143633, 941]);
  expect(initialSample.pixel[0]).toBeGreaterThan(50);
  expect(initialSample.pixel[1]).toBeGreaterThan(initialSample.pixel[0]!);
  expect(dataRequests).toHaveLength(5);
  const canvasSize = await stage.locator('canvas').evaluate(node => {
    const canvas = node as HTMLCanvasElement;
    return canvas.width * canvas.height;
  });
  expect(canvasSize).toBeLessThanOrEqual(902000);
  await expect(stage).not.toHaveAttribute('data-running', 'true');
  const audit = await new AxeBuilder({page}).include('.desi-observatory').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(audit.violations.map(issue => [issue.id, issue.nodes.map(node => node.target)])).toEqual([]);

  await page.getByRole('checkbox', {name: 'DESI DR1'}).uncheck();
  await expect(counts.first()).toHaveText('0');
  await page.getByRole('checkbox', {name: 'eROSITA eRASS1'}).uncheck();
  await expect(counts.last()).toHaveText('0');
  await page.getByRole('checkbox', {name: 'DESI DR1'}).check();
  await page.getByRole('checkbox', {name: 'eROSITA eRASS1'}).check();
  await page.getByRole('slider', {name: 'Redshift mínimo'}).press('ArrowRight');
  await page.getByRole('slider', {name: 'Redshift máximo'}).press('ArrowLeft');
  await expect.poll(async () => (await countValues())[0]).toBeLessThan(143633);
  await expect.poll(async () => (await countValues())[1]).toBeGreaterThan(0);
  await page.getByRole('slider', {name: 'Redshift mínimo'}).press('Home');
  await page.getByRole('slider', {name: 'Redshift máximo'}).press('End');
  await expect.poll(countValues).toEqual([143633, 941]);

  await stage.scrollIntoViewIfNeeded();
  const box = (await stage.boundingBox())!;
  const x = box.x + box.width * .5, y = box.y + box.height * .45;
  if (isMobile) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: x - 20, y}, {x: x + 20, y}]});
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: x - 95, y}, {x: x + 95, y}]});
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await cdp.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 90, y + 38, {steps: 4});
    await page.mouse.up();
    for (let i = 0; i < 5; i++) await page.getByRole('button', {name: 'Ampliar', exact: true}).click();
  }
  await expect.poll(async () => (await countValues())[0]).toBeLessThan(143633);
  await page.getByRole('button', {name: 'Restaurar câmera'}).click();
  await expect.poll(countValues).toEqual([143633, 941]);
  await stage.press('ArrowLeft');
  await stage.press('+');
  await page.getByRole('button', {name: 'Restaurar câmera'}).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', {name: 'Exportar PNG'}).click()]);
  expect(download.suggestedFilename()).toBe('NEXO-DESI-eROSITA-3D.png');
  const file = await readFile((await download.path())!);
  expect(file.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(file.byteLength).toBeGreaterThan(3000);
  await page.getByRole('button', {name: 'Tela cheia', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Sair da tela cheia'})).toBeVisible();
  await page.getByRole('button', {name: 'Sair da tela cheia'}).click();
  await page.getByRole('button', {name: 'Retomar rotação'}).click();
  await expect(stage).toHaveAttribute('data-running', 'true');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-running', 'false');
  await page.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
  await expect(stage).toHaveAttribute('data-running', 'true');
  await page.getByRole('button', {name: 'Pausar rotação'}).click();
  await expect(stage).toHaveAttribute('data-running', 'false');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = (await cdp.send('Performance.getMetrics')).metrics;
  await cdp.detach();
  const memory = metrics.find(metric => metric.name === 'JSHeapUsedSize')!.value;
  expect(memory).toBeLessThan(96 * 1024 * 1024);
  console.log('NEXO WebGL2', info.project.name, JSON.stringify({renderer: initialSample.renderer, drawCounts: initialSample.counts, coloredPixels: initialSample.pixel, canvasPixels: canvasSize, jsHeapBytes: memory}));

  for (const lang of ['pt', 'en']) {
    if (lang === 'en') {
      await page.goto('/en');
      await page.getByRole('button', {name: 'Enable 3D'}).click();
      await expect(stage).toHaveAttribute('data-backend', 'webgl2', {timeout: 30_000});
      await expect(page.getByRole('heading', {level: 1, name: 'Cosmic expansion and structure formation'})).toBeVisible();
    } else {
      await page.getByRole('button', {name: 'Restaurar câmera'}).click();
    }
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
    const name = `home-${lang}-${info.project.name}-webgl2.png`;
    const path = info.outputPath(name);
    await page.screenshot({path, animations: 'disabled', scale: 'css'});
    await info.attach(name, {path, contentType: 'image/png'});
  }
});

test('automatic 3D starts after paint, rotates only while visible and preserves manual pause', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  const requests: string[] = [];
  page.on('request', request => { if (/\/observatory\/.*\.bin$/.test(request.url())) requests.push(request.url()); });
  await page.goto('/pt');
  const stage = page.locator('.desi-stage');
  await expect(stage).toHaveAttribute('data-backend', 'webgl2', {timeout: 30_000});
  expect(requests).toHaveLength(5);
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-running', 'true');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-running', 'false');
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-running', 'true');
  await page.getByRole('button', {name: 'Pausar rotação'}).click();
  await expect(stage).toHaveAttribute('data-running', 'false');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-running', 'false');
  await page.getByRole('button', {name: 'Retomar rotação'}).click();
  // On a short viewport the control can scroll the stage out of view; return to the scene.
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-running', 'true');
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(stage).toHaveAttribute('data-running', 'false');
});

test('WebGL unavailable retains the true poster and catalogue counts without fetching binaries', async ({page}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl2') return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  const requests: string[] = [];
  page.on('request', request => { if (request.url().endsWith('.bin')) requests.push(request.url()); });
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/en');
  await expect(page.getByText('Static preview. The 3D view is unavailable on this device.')).toBeVisible();
  const stage = page.locator('.desi-stage');
  await expect(stage.getByRole('img')).toBeVisible();
  await expect(stage.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.desi-layers output')).toHaveText(['143,633', '941']);
  expect(requests).toHaveLength(0);
});

test('offscreen observatory avoids downloading the catalogue until it approaches the viewport', async ({page}) => {
  await page.setViewportSize({width: 390, height: 240});
  await page.emulateMedia({reducedMotion: 'no-preference'});
  const requests: string[] = [];
  page.on('request', request => {if (/\/observatory\/.*\.bin$/.test(request.url())) requests.push(request.url());});
  await page.goto('/pt');
  const stage = page.locator('.desi-stage');
  await page.waitForLoadState('load');
  await page.waitForTimeout(600);
  expect(requests).toHaveLength(0);
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-backend', 'webgl2', {timeout: 30_000});
  expect(requests).toHaveLength(5);
  expect(requests.every(url => url.includes('/packed-v1/'))).toBe(true);
});

test('packed catalogue failure falls back to the exact canonical coordinates', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.route('**/observatory/packed-v1/**', route => route.fulfill({status: 503, body: ''}));
  const raw: string[] = [];
  page.on('request', request => {if (/\/observatory\/(desi|erosita)-.*\.bin$/.test(request.url())) raw.push(request.url());});
  await page.goto('/pt');
  await page.getByRole('button', {name: 'Ativar 3D'}).click();
  await expect(page.locator('.desi-stage')).toHaveAttribute('data-backend', 'webgl2', {timeout: 30_000});
  await expect(page.locator('.desi-layers output')).toHaveText(['143.633', '941']);
  expect(raw).toHaveLength(5);
});
