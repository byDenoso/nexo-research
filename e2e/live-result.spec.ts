import AxeBuilder from '@axe-core/playwright';
import {expect, test} from '@playwright/test';

const route = '/pt/resultado-vivo';

test('compares published references and each sensitivity scenario, with readable sources', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
  await page.goto(route);
  await expect(page.getByRole('heading',{level:1,name:'Resultado vivo'})).toBeVisible();
  const impact = page.locator('[data-scenario]');
  const select=page.getByRole('combobox',{name:'Cenário',exact:true});
  await expect(select).toHaveValue('baseline');
  await expect(page.locator('[data-level]')).toHaveCount(2);
  await select.selectOption('desOffset');
  await expect(impact).toContainText('Submetido à Physical Review D');
  await expect(impact).toContainText('0,03 mag');
  await expect(impact).toContainText('7,16 → 0,52');
  await expect(impact).toContainText('DES-Dovekie');
  await select.selectOption('withoutLrg2');
  await expect(impact).toContainText('Ωₘ 0,2993 · H₀ 68,40');
  await expect(impact).toContainText('1,86');
  await expect(impact).not.toContainText('4,65');
  await expect(impact).toContainText('-0,27 ± 0,21');
  await expect(page.locator('[data-reference="bao"]')).toBeVisible();
  await expect(page).toHaveURL(/scenario=withoutLrg2/);
  await select.selectOption('shortRuler');
  await expect(impact).toContainText('72,63');
  await expect(impact).toContainText('12,6 σ');
  await expect(impact).toContainText('3,88 → 0,34 σ');
  await expect(impact).toContainText('143,6 Mpc');
  await expect(impact).toContainText('Incertezas pareadas indisponíveis');
  await expect(page.locator('[data-level]')).toHaveCount(0);
  await select.selectOption('masslessNeutrinos');
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

test('opens in the labelled plane and enables a quantitative 3D surface on request',async({page})=>{
  await page.goto(route);
  const plane=page.getByRole('img',{name:/vista superior/});
  await expect(plane).toContainText('H₀ (km/s/Mpc)');
  await page.getByRole('button',{name:'Aproximar'}).click();
  await expect(page.getByRole('button',{name:'Restaurar escala'})).toBeEnabled();
  await page.getByRole('button',{name:'Restaurar escala'}).click();
  for(const name of ['BAO · DESI DR2','Pantheon+']){
    const button=page.getByRole('button',{name,exact:true}); await button.focus(); await button.press('Space');
    await expect(button).toHaveAttribute('aria-pressed','true');
  }
  await page.getByRole('button',{name:'3D · BAO'}).click();
  await expect(page.getByRole('img',{name:/altura em Δχ²/})).toBeVisible();
  const angle=page.getByRole('slider',{name:'Rotação'});await angle.focus();await angle.press('ArrowRight');await expect(angle).toHaveValue('36');
  await page.getByRole('button',{name:'Recentrar'}).click();await expect(angle).toHaveValue('35');
  await page.getByRole('button',{name:'Voltar a 2D'}).click();await expect(plane).toBeVisible();
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
  await expect(page.getByRole('img',{name:/vista superior/})).toBeVisible();
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
