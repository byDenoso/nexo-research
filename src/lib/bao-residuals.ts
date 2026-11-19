import {baoMeasurements,type BaoObservable} from './live-result-bao';
import {comovingDistance,hubble,LIGHT_KM_S,type Cosmology} from './expansion';

export function baoResiduals(model:Cosmology,ruler=147.5) {
  return baoMeasurements.map(measurement=>{
    const {z, observable, value, sigma}=measurement;
    const dm=comovingDistance(z,model)/ruler;
    const dh=LIGHT_KM_S/hubble(z,model)/ruler;
    const predictions:Record<BaoObservable,number>={DM:dm,DH:dh,DV:Math.cbrt(z*dm*dm*dh)};
    const prediction=predictions[observable];
    return {...measurement,prediction,residual:value-prediction,standardized:(value-prediction)/sigma};
  });
}
