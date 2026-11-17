import {BAO_LEVEL,evaluateProfile,pairedLrg2Shift} from '../src/lib/live-result-bao';
import {describe, expect, it} from 'vitest';
import {
  baoFootprint, LIVE_RESULT_COMPARISONS, LIVE_RESULT_IMPLIED, LIVE_RESULT_PLANCK_REFERENCE,
  LIVE_RESULT_PROBES, LIVE_RESULT_SCENARIOS, LIVE_RESULT_SOURCE_LINKS, LIVE_RESULT_STATUS,
  liveResultNumber,
} from '../src/lib/live-result';

describe('live result reference data', () => {
  it('preserves the authorized quantities at the precision shown on the page', () => {
    expect(LIVE_RESULT_PROBES.cmb.anchor).toEqual({omegaM: 0.3151, h0: 67.36});
    expect(LIVE_RESULT_PROBES.bao.anchor).toEqual({omegaM: 0.2972, h0: 68.69});
    expect(LIVE_RESULT_PROBES.des.anchor).toEqual({omegaM: 0.352, sigmaOmegaM: 0.017});
    expect(LIVE_RESULT_PROBES.pantheon.anchor).toEqual({omegaM: 0.334, sigmaOmegaM: 0.018});
    expect(LIVE_RESULT_PROBES.ladder.anchor).toEqual({h0: 73.04, sigmaH0: 1.04});
    expect(LIVE_RESULT_PLANCK_REFERENCE).toEqual({omegaMh2: 0.143, sigmaOmegaMh2: 0.0011, theta100: 1.04110, sigmaTheta100: 0.00031});
    expect(LIVE_RESULT_IMPLIED.map(row => row.h0)).toEqual([63.8, 65.4, 67.4, 69.4]);
    expect(LIVE_RESULT_COMPARISONS.map(row => row.sigma)).toEqual([2.25, 2.84, 1.82, 5.13, 3.88, 0.34]);
    expect(liveResultNumber(LIVE_RESULT_SCENARIOS.withoutLrg2.bao!.h0, 2, 'pt')).toBe('68,40');
    expect(liveResultNumber(LIVE_RESULT_PLANCK_REFERENCE.omegaMh2, 4, 'en')).toBe('0.1430');
  });

  it('keeps the tested conditions and evidentiary status attached to each result', () => {
    const {desOffset, withoutLrg2, shortRuler, masslessNeutrinos} = LIVE_RESULT_SCENARIOS;
    expect(desOffset).toMatchObject({status: 'submitted', sourceIds: ['offset', 'desi']});
    expect(LIVE_RESULT_STATUS[desOffset.status].pt).toBe('Submetido à Physical Review D');
    expect(desOffset.metrics.map(row => [row.previous, row.value])).toEqual([[undefined, 0.03], [undefined, 7.16], [undefined, 0.52]]);
    expect(desOffset.description.pt).toContain('DES-Dovekie');
    expect(desOffset.bao).toBeUndefined();
    expect(desOffset.joint).toBeUndefined();
    expect(withoutLrg2.bao).toEqual({omegaM: 0.2993, h0: 68.4});
    expect(withoutLrg2.metrics[0]).toMatchObject({value: 1.86});
    expect(withoutLrg2.metrics[0]?.previous).toBeUndefined();
    expect(withoutLrg2.description.en).toContain('fixed points with BAO alone');
    expect(shortRuler.bao).toEqual({omegaM: 0.2972, h0: 72.63});
    expect(shortRuler.metrics.map(row => row.value)).toEqual([143.6, 0.157, 12.6]);
    expect(shortRuler.metrics[0]?.previous).toBe(147.5);
    expect(shortRuler.description.en).toContain('would give a different H₀');
    expect(masslessNeutrinos.joint).toEqual({omegaM: 0.2985, h0: 68.67});
    expect(masslessNeutrinos.metrics[0]?.value).toBe(4.3);
    expect(masslessNeutrinos.bao).toBeUndefined();
    for (const scenario of [withoutLrg2, shortRuler, masslessNeutrinos]) expect(scenario.status).toBe('provisional');
  });

  it('links to primary survey sources and allows unlinked unpublished analyses', () => {
    expect(LIVE_RESULT_SOURCE_LINKS.planck.href).toBe('https://arxiv.org/abs/1807.06209');
    expect(LIVE_RESULT_SOURCE_LINKS.desi.href).toBe('https://arxiv.org/abs/2503.14738');
    expect(LIVE_RESULT_SOURCE_LINKS.baoMean.href).toContain('/v2.6/');
    expect(LIVE_RESULT_SOURCE_LINKS.baoCovariance.href).toContain('/v2.6/');
    expect(LIVE_RESULT_SOURCE_LINKS.synthesis).not.toHaveProperty('href');
    expect(LIVE_RESULT_SOURCE_LINKS.offset).not.toHaveProperty('href');
  });
});

describe('BAO likelihood footprint', () => {
  // Benchmark from adaptive quadrature, dense inversion, and root solving on the release files.
  it.each([
    ['baseline', .29746182], ['withoutLrg2', .29961163],
  ] as const)('puts each joint contour at its declared likelihood level for %s',(id,m)=>{
    const profile=(v:number)=>evaluateProfile(v,147.5,id==='withoutLrg2');
    for(const level of [68,95] as const){
      const points=baoFootprint(id,level)!;
      expect(points).toHaveLength(49); expect(points.at(-1)).toEqual(points[0]);
      for(const p of points){
        const r=profile(p.omegaM);
        expect(r.chiSquared-profile(m).chiSquared+r.inverseH0Curvature*(1/p.h0-1/r.h0)**2).toBeCloseTo(BAO_LEVEL[level],5);
      }
    }
  });
  it('matches the paired displacement computed by independent dense GLS on the released files',()=>{
    const d=pairedLrg2Shift();
    expect(d.omegaM).toBeCloseTo(.00214981,6);expect(d.h0).toBeCloseTo(-.26934778,4);
    expect(d.sigmaOmegaM).toBeCloseTo(.00248424,6);expect(d.sigmaH0).toBeCloseTo(.20798979,5);
  });
  it('preserves BAO-only contours for other tests and omits an unverified short-ruler contour', () => {
    expect(baoFootprint('desOffset')).toBe(baoFootprint('baseline'));
    expect(baoFootprint('masslessNeutrinos')).toBe(baoFootprint('baseline'));
    expect(baoFootprint('shortRuler')).toBeUndefined();
  });
});
