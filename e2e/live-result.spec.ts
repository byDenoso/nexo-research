import AxeBuilder from '@axe-core/playwright';
import {expect, test} from '@playwright/test';

const route = '/pt/resultado-vivo';

// The Linux CI runner has no physical GPU. Exercise the scene through Chromium's software GPU.
if (process.platform === 'linux') {
  test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
}

test('compares published references and each sensitivity scenario, with readable sources', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
  await page.goto(route);
  await expect(page.getByRole('heading',{level:1,name:'Resultado vivo'})).toBeVisible();
  const impact = page.locator('[data-scenario]');
  const option = (name: string) => page.getByRole('button',{name,exact:true});

  await option('Offset do DES').click();
  await expect(impact).toContainText('Submetido à Physical Review D');
  await expect(impact).toContainText('0,03 mag');
  await expect(impact).toContainText('7,16 → 0,52');
  await expect(impact).toContainText('DES-Dovekie');
  await option('Offset do DES').click();
  await expect(impact).toHaveAttribute('data-scenario','baseline');

  await option('Sem o bin LRG2').click();
  await expect(impact).toContainText('Ωₘ 0,2993 · H₀ 68,40');
  await expect(impact).toContainText('4,65 → 1,86');

  await option('Régua acústica encurtada').click();
  await expect(option('Sem o bin LRG2')).toHaveAttribute('aria-pressed','false');
  await expect(impact).toContainText('72,63');
  await expect(impact).toContainText('12,6 σ');
  await expect(impact).toContainText('3,88 → 0,34 σ');
  await expect(impact).toContainText('143,6 Mpc');

  await option('Neutrinos sem massa').click();
  await expect(impact).toContainText('Planck + DESI');
  await expect(impact).toContainText('Ωₘ 0,2985 · H₀ 68,67');
  await expect(impact).toContainText('4,3');

  await page.getByText('Valores, faixas e comparações',{exact:true}).click();
  await expect(page.getByText('Ωₘ 0,2972 · H₀ 68,69',{exact:true}).last()).toBeVisible();
  await expect(page.getByText('Ωₘ 0,352 ± 0,017',{exact:true}).last()).toBeVisible();
  await expect(page.getByText('H₀ 73,04 ± 1,04',{exact:true}).last()).toBeVisible();
  await expect(page.getByText('100θ*',{exact:false})).toContainText('1,04110 ± 0,00031');
  await page.getByText('Fontes e estado da evidência',{exact:true}).click();
  await expect(page.getByRole('link',{name:/Covariância das medidas/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
  expect(errors).toEqual([]);
});

test('orbits a real GPU scene and keeps controls usable in lite mode', async ({page, isMobile}) => {
  await page.goto(route);
  const viewport = page.locator('[data-renderer]');
  await expect(viewport).toHaveAttribute('data-renderer',/^(webgpu|webgl2)$/,{timeout:20_000});
  const view = page.getByRole('img',{name:/Cena tridimensional/});
  expect(await view.evaluate(node => (node as HTMLCanvasElement).width)).toBeGreaterThan(250);
  const axis = viewport.locator('span').first();
  await expect.poll(()=>axis.evaluate(node=>node.style.transform)).toContain('translate');
  const projectedLabel = () => axis.evaluate(node => {
    const transform = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return {x: transform.m41, y: transform.m42};
  });
  const initial = await projectedLabel();
  const displacement = async () => {
    const point = await projectedLabel();
    return Math.hypot(point.x - initial.x, point.y - initial.y);
  };
  await view.focus();
  await view.press('ArrowLeft');
  await expect.poll(displacement).toBeGreaterThan(1);
  await page.getByRole('button',{name:'Recentrar câmera'}).click();
  await expect.poll(displacement).toBeLessThan(1);

  await view.scrollIntoViewIfNeeded();
  const box = (await view.boundingBox())!;
  const x = box.x + box.width * 0.54, y = box.y + box.height * 0.48;
  if (isMobile) {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-72,y}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await session.detach();
  } else {
    await page.mouse.move(x,y);
    await page.mouse.down();
    await page.mouse.move(x-72,y+20,{steps:7});
    await page.mouse.up();
  }
  await expect.poll(displacement).toBeGreaterThan(1);

  await page.getByRole('button',{name:'Modo leve'}).click();
  await expect(viewport).toHaveAttribute('data-renderer','text');
  await expect(viewport.getByText('Leitura sem 3D')).toBeVisible();
  await page.getByRole('button',{name:'BAO · DESI DR2'}).click();
  await expect(viewport.getByText('BAO · DESI DR2')).toHaveCount(0);
  await page.getByRole('button',{name:'Sem o bin LRG2'}).click();
  await expect(viewport.getByText('Ωₘ 0,2993 · H₀ 68,40')).toBeVisible();
  await page.getByRole('button',{name:'Abrir em 3D'}).click();
  await expect(viewport).toHaveAttribute('data-renderer',/^(webgpu|webgl2)$/,{timeout:20_000});
});

test('reads in both themes and survives browsers without GPU support', async ({page}) => {
  await page.addInitScript(()=>{
    Object.defineProperty(Navigator.prototype,'gpu',{value:undefined,configurable:true});
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement,type: string, options?: unknown) {
      if (type === 'webgl2' || type === 'webgpu') return null;
      return Reflect.apply(getContext,this,[type,options]);
    } as typeof getContext;
  });
  await page.goto(route);
  const viewport = page.locator('[data-renderer]');
  await expect(viewport.getByText('Leitura sem 3D')).toBeVisible({timeout:15_000});
  await page.getByText('Valores, faixas e comparações',{exact:true}).click();
  await page.getByText('Fontes e estado da evidência',{exact:true}).click();
  for (const theme of ['light','dark']) {
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    const findings = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(findings.violations.map(item=>item.id)).toEqual([]);
    if (theme==='light') await page.locator('button.theme-toggle').click();
  }
  await page.getByRole('link',{name:'Idioma: EN'}).click();
  await expect(page).toHaveURL(/\/en\/resultado-vivo$/);
  await expect(page.getByRole('heading',{name:'Living result',level:1})).toBeVisible();
});
