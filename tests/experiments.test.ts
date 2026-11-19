import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {ageAtScale,comovingDistance,expansionPoint,hubble,LIGHT_KM_S,referenceModel,scaleAtAge,skyPositions} from '@/lib/expansion';
import {baoGrid,baoMarginal} from '@/lib/bao-grid';
import {BAO_LEVEL,baoDelta,evaluateProfile,makeBaoFootprint} from '@/lib/live-result-bao';
import sky from '../data/source/pantheon-sky-summary.json';

describe('physical quantities shared by the plots, scenes and exports',()=>{
  it('recovers the analytic Einstein–de Sitter distance and expansion',()=>{
    const model={...referenceModel,omegaM:1};
    for (const z of [0,.1,1,2]) {
      expect(hubble(z,model)).toBeCloseTo(70*(1+z)**1.5,10);
      expect(comovingDistance(z,model)).toBeCloseTo(2*LIGHT_KM_S/70*(1-1/Math.sqrt(1+z)),3);
    }
  });
  it('keeps cosmic age, lookback and displayed wavelength on the same clock',()=>{
    for(const a of [1/3,.5,2/3,1]){
      expect(scaleAtAge(ageAtScale(a))).toBeCloseTo(a,12);
      expect(expansionPoint(1/a-1,referenceModel).lookback).toBeCloseTo(ageAtScale(1)-ageAtScale(a),5);
    }
  });
  it('retains all 1543 unique CIDs, published redshift bins and equatorial positions',()=>{
    const rows=skyPositions(readFileSync(new URL('../public/pantheon-positions.csv',import.meta.url),'utf8'));
    const counts=sky.redshiftCounts.map(()=>0);
    for(const row of rows){
      const b=Math.floor(row.z/sky.redshiftBinWidth);
      counts[b]=counts[b]!+1;
      expect(Math.hypot(...row.xyz)).toBeCloseTo(row.distance,7);
      expect(Math.asin(row.xyz[1]/row.distance)*180/Math.PI).toBeCloseTo(row.dec,6);
      expect((Math.atan2(row.xyz[2],row.xyz[0])*180/Math.PI+360)%360).toBeCloseTo(row.ra,6);
    }
    expect(new Set(rows.map(p=>p.cid)).size).toBe(sky.uniqueCID);
    expect(counts).toEqual(sky.redshiftCounts);
    expect(rows[0]).toMatchObject({cid:'2011fe',ra:210.774,dec:54.2737,z:.00122});
  });
  for(const cut of [false,true])it('3D heights reproduce both published 2D contours, posterior normalises; omit LRG2='+cut,()=>{
    const {best,rows}=baoGrid(cut);
    expect(baoDelta(best,best.h0,best.chiSquared)).toBe(0);
    for(const level of [68,95] as const){
      for(const p of makeBaoFootprint(147.5,cut,BAO_LEVEL[level])){
        expect(baoDelta(evaluateProfile(p.omegaM,147.5,cut),p.h0,best.chiSquared)).toBeCloseTo(BAO_LEVEL[level],6);
      }
    }
    expect(rows.flat().every(p=>p.delta>=0)).toBe(true);
    const density=baoMarginal(cut);
    expect(density.reduce((s,v,i)=>i?s+.001*(v.density+density[i-1]!.density):0,0)).toBeCloseTo(1,10);
    expect(density[0]!.density).toBeLessThan(1e-5);
    expect(density.at(-1)!.density).toBeLessThan(1e-5);
  });
});
