import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createHash} from 'node:crypto';

test('survey payloads retain the exact supplied hashes and counts',async({request})=>{
  const base='/data/desi-erosita/';
  const meta=await (await request.get(base+'provenance.json')).json();
  expect(meta.counts).toEqual({DESI:143633,eROSITA:941});
  for(const [i,name,count] of [[0,'galaxies.bin',143633],[1,'clusters.bin',941]] as const){
    const response=await request.get(base+name);expect(response.ok()).toBeTruthy();
    const bytes=await response.body();expect(bytes.length).toBe(count*16);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(meta.payload_sha256[i]);
  }
  const poster=await (await request.get(base+'poster.webp')).body();
  expect(createHash('sha256').update(poster).digest('hex')).toBe('aaba12998089824e9adaa7bd2544d99c595ebaebff9af44366f682ba3829d75d');
});

test('native WebGL controls, rendering, exact counts and keyboard',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/pt');const figure=page.locator('.survey-volume');
  await expect(figure).toHaveAttribute('data-backend','poster');
  await figure.getByRole('button',{name:'Explorar em 3D'}).click();
  await expect(figure).toHaveAttribute('data-backend','webgl',{timeout:20000});
  const canvas=figure.locator('canvas');
  await expect(canvas).toBeVisible();
  const first=await canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL());
  await canvas.press('ArrowRight');
  await expect.poll(()=>canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL())).not.toBe(first);
  await figure.getByRole('checkbox',{name:'DESI',exact:true}).uncheck();
  await expect(figure.locator('.survey-counts')).toHaveText('0 galáxias · 941 aglomerados/grupos');
  await figure.getByRole('button',{name:'Restaurar'}).click();
  await expect(figure.locator('.survey-counts')).toHaveText('143.633 galáxias · 941 aglomerados/grupos');
  await figure.getByRole('slider',{name:'Redshift máximo'}).press('Home');
  await expect(figure.locator('.survey-counts')).not.toHaveText('143.633 galáxias · 941 aglomerados/grupos');
  await figure.getByRole('button',{name:'Restaurar'}).click();
  await figure.getByRole('button',{name:'Aumentar zoom'}).click();
  await figure.getByRole('button',{name:'Restaurar'}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),figure.getByRole('button',{name:'PNG',exact:true}).click()]);
  expect(download.suggestedFilename()).toBe('NEXO-DESI-eROSITA-3D.png');
  await figure.getByRole('button',{name:'Tela cheia'}).click();
  await expect(figure.getByRole('button',{name:'Fechar tela cheia'})).toBeVisible();
  await figure.getByRole('button',{name:'Fechar tela cheia'}).click();
  await expect(figure.getByRole('button',{name:'Tela cheia'})).toBeVisible();
  const findings=await new AxeBuilder({page}).include('.survey-volume').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(findings.violations.map(x=>x.id)).toEqual([]);
  const shot=info.outputPath('survey-active.png');await figure.screenshot({path:shot});await info.attach('survey-active',{path:shot,contentType:'image/png'});
  expect(await canvas.evaluate(c=>(c as HTMLCanvasElement).width*(c as HTMLCanvasElement).height)).toBeLessThanOrEqual(725000);
});

test('missing WebGL and reduced motion preserve the real poster',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,options?:unknown){if(type==='webgl'||type==='webgl2')return null;return Reflect.apply(original,this,[type,options]);} as typeof original;});
  await page.goto('/en');const figure=page.locator('.survey-volume');
  await expect(figure).toHaveAttribute('data-backend','poster');
  await figure.getByRole('button',{name:'Explore in 3D'}).click();
  await expect(figure).toHaveAttribute('data-backend','fallback');
  await expect(figure.locator('picture img')).toBeVisible();
  await expect(figure.getByRole('status')).toContainText('WebGL unavailable');
  await expect(figure.getByRole('link',{name:/Pantheon/})).toHaveAttribute('href','/en/data#pantheon-volume');
});
