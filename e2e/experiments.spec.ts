import AxeBuilder from '@axe-core/playwright';
import {expect,test, type Page} from '@playwright/test';

const storyId='#expansao-em-etapas', desi='/pt/results/t-28160180cded';
async function disableGpu(page:Page){
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'gpu',{value:undefined,configurable:true});
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){
      return type==='webgl2'||type==='webgpu'?null:Reflect.apply(original,this,[type,...args]);
    } as typeof original;
  });
}
test('timeline uses cosmic time, remains keyboard operable and exports calculated values',async({page,isMobile})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:295,height:850});
  await page.goto('/pt#expansao-em-etapas');
  const story=page.locator(storyId);
  const end=story.getByRole('button',{name:'Observação',exact:true});
  if(isMobile) await end.tap(); else {await end.focus();await end.press('Enter');}
  await expect(story.locator('tbody')).toContainText('1.500 nm');
  await story.getByRole('button',{name:'Reiniciar'}).click();
  await expect(story.locator('tbody')).toContainText('500 nm');
  await story.getByRole('combobox',{name:'Velocidade'}).selectOption('2');
  await story.getByRole('button',{name:'Reproduzir'}).click();
  const pause=story.getByRole('button',{name:'Pausar',exact:true});
  await expect(pause).toBeVisible();await expect(story.locator('tbody')).not.toContainText('500 nm');
  await pause.click();const frozen=await story.locator('tbody').innerText();
  await page.waitForTimeout(150);expect(await story.locator('tbody').innerText()).toBe(frozen);
  const file=page.waitForEvent('download');await story.getByRole('button',{name:'Exportar dados (CSV)'}).click();
  expect((await file).suggestedFilename()).toBe('nexo-expansion-time.csv');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
});

test('DESI and the illustrative model expose matched numbers, filters and accessible tables',async({page})=>{
  await page.setViewportSize({width:295,height:850});await page.goto(desi);
  const tracer=page.locator('#desi-tracer-exclusion');
  await tracer.getByLabel('Examinar retirada').selectOption({label:'LRG2'});
  await expect(tracer.locator('output')).toContainText(/1,67/);await expect(tracer.locator('output')).toContainText(/2,23/);
  const model=page.locator('#expansion-models');
  await model.getByLabel('Grandeza',{exact:true}).selectOption('residual');
  for(const [label,steps] of [['w₀',10],['wₐ',20]] as const){
    const slider=model.getByRole('slider',{name:label,exact:true});
    await slider.press('Home');
    for(let i=0;i<steps;i++) await slider.press('ArrowRight');
  }
  await expect(model.locator('.lab-reading')).toContainText('= 0%');
  await model.getByLabel('Grandeza',{exact:true}).selectOption('a');
  await expect(model.getByRole('img')).toHaveAccessibleName(/retrospecto/);
  const file=page.waitForEvent('download');await model.getByRole('button',{name:'Capturar figura'}).click();expect((await file).suggestedFilename()).toMatch(/\.svg$/);
  await model.getByText('Resíduos das 13 medidas BAO do DESI',{exact:true}).click();
  const residuals=model.getByRole('table',{name:'Medidas DESI DR2 e resíduos em σᵢ'});
  await expect(residuals.locator('tbody tr')).toHaveCount(13);
  await model.getByLabel('Medida BAO',{exact:true}).selectOption('DH');
  await expect(residuals.locator('tbody tr')).toHaveCount(6);
  const matched=await residuals.locator('tbody tr').first().locator('td').allTextContents();
  expect(matched[1]).toBe(matched[2]);
  const audit=await new AxeBuilder({page}).include('#expansion-models').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(audit.violations.map(x=>x.id)).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
});

test('atlas handles a missing catalogue, retries, and filters exact positions without WebGL',async({page})=>{
  await disableGpu(page);
  let release!:()=>void;
  const waiting=new Promise<void>(resolve=>{release=resolve;});
  let fail=true;
  await page.route('**/pantheon-positions.csv',async route=>{
    if (!fail) return route.continue();
    await waiting;
    await route.fulfill({status:503,body:'Unavailable'});
  });
  await page.goto('/pt/data#atlas');const atlas=page.locator('#atlas');
  await atlas.getByRole('button',{name:'3D · Pantheon+'}).click();
  await expect(atlas.locator('.experiment-viewport').getByRole('status')).toHaveText('Carregando cena 3D…');
  await expect(atlas.getByRole('img',{name:/Mapa celeste/})).toBeVisible();
  release();
  await expect(atlas.getByRole('button',{name:'Recarregar catálogo'})).toBeVisible();
  fail=false;await atlas.getByRole('button',{name:'Recarregar catálogo'}).click();
  await expect(atlas.locator('.experiment-viewport')).toHaveAttribute('data-scene-state','fallback',{timeout:20000});
  await expect(atlas.getByRole('combobox',{name:'Supernova selecionada'}).locator('option')).toHaveCount(1543);
  const z=atlas.getByRole('slider',{name:'Redshift máximo'});await z.focus();await z.press('Home');
  await expect(atlas.getByRole('combobox',{name:'Supernova selecionada'}).locator('option')).not.toHaveCount(1543);
  await expect(atlas.getByRole('table')).toContainText('2011fe');
  await expect(atlas.getByRole('img',{name:'Mapa celeste da seleção'})).toBeVisible();
});

test('BAO fallback exposes the exact minimum and posterior with its prior and export',async({page})=>{
  await disableGpu(page);
  await page.goto('/pt/resultado-vivo');await page.getByRole('button',{name:'3D · BAO'}).click();
  const panel=page.locator('.bao-lab');
  await expect(panel.locator('.experiment-viewport')).toHaveAttribute('data-scene-state','fallback',{timeout:20000});
  await expect(panel.getByRole('row',{name:/Δχ²/})).toContainText('0,0000');
  await panel.getByRole('slider',{name:'H₀ (km/s/Mpc)'}).press('End');
  await expect(panel.getByRole('row',{name:/Δχ²/})).not.toContainText('0,0000');
  await panel.getByText('Posterior marginal de Ωₘ',{exact:true}).click();
  await expect(panel.getByRole('table',{name:'Posterior na grade'})).toBeVisible();
  await expect(panel).toContainText('55 a 85');
  const file=page.waitForEvent('download');await panel.getByRole('button',{name:'Exportar posterior (CSV)'}).click();
  expect((await file).suggestedFilename()).toBe('desi-posterior.csv');
  await page.getByRole('combobox',{name:'Cenário',exact:true}).selectOption('shortRuler');
  await expect(page.getByRole('button',{name:'3D · BAO'})).toBeDisabled();
  await expect(page.locator('.bao-lab')).toHaveCount(0);
});

test('3D expansion exports a frame and recovers after losing the graphics context',async({page,isMobile})=>{
  await page.goto('/pt');
  await page.getByRole('navigation',{name:'Capítulos'}).getByRole('link',{name:'Luz e redshift'}).click();
  const story=page.locator('#expansao-em-etapas'),stage=story.locator('.experiment-viewport');
  const supported=await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl2');gl?.getExtension('WEBGL_lose_context')?.loseContext();return !!gl;});
  const mode=story.getByRole('button',{name:'3D · Volume'});
  if(isMobile) await mode.tap(); else await mode.click();
  if(!supported){await expect(stage).toHaveAttribute('data-scene-state','fallback',{timeout:20000});return;}
  await expect(stage).toHaveAttribute('data-scene-state','ready',{timeout:20000});
  await story.getByRole('button',{name:'Observação',exact:true}).click();
  await expect(story.locator('tbody')).toContainText('1.500 nm');
  const png=page.waitForEvent('download');await story.getByRole('button',{name:'Capturar figura'}).click();
  expect((await png).suggestedFilename()).toBe('nexo-flow.png');
  await stage.locator('canvas').evaluate(c=>(c as HTMLCanvasElement).getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await expect(stage).toHaveAttribute('data-scene-state','fallback');
  await story.getByRole('button',{name:'Tentar 3D novamente'}).click();
  await expect(stage).toHaveAttribute('data-scene-state','ready',{timeout:20000});
});
