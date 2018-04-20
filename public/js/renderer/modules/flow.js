'use strict';

// ES6
import Helper from './../helper.js';
let safemod = Helper.safemod;


import AbstractRendererModule from './abstractRendererModule';

class Dyna extends AbstractRendererModule {
  static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
    });
  }
  static get _defaultRuntimeOptions() {
    return Object.assign({}, super._defaultRuntimeOptions, {
      flowBoomVel: 500,
      pumpMaxPower: 10,
    });
  }

  /* declare */ _onModuleLive() {
    this._dimAndPumpFlow();
    this._liveExplode();
  }
  _dimAndPumpFlow() {
    let dimFlowRatio = Math.pow(0.5, this._momento.dt);
    let pumpPower = (this._input.analogF.value - 0.5) * this._runtimeOptions.pumpMaxPower;
    for (let i = 0; i < this._rendererInitialOptions.masterPixelCount; i++) {
      // dim
      this._ring.ph.flow[i] *= dimFlowRatio;
      
      // pump
      this._ring.ph.flow[i] += (1 - dimFlowRatio) * pumpPower * this._rendererInitialOptions.masterPixelCount
    }
      
  }
  _liveExplode() {
    let explodes = this._explodes;
    explodes.forEach((explode) => {
     this._explodeFlow(explode);
    });
  } 
  _explodeFlow({pos}) {    
    for (let i = 0; i <= this._rendererInitialOptions.masterPixelCount; i++) {
      let flow = this._ring.ph.flow[i];
      let diffRatio = (pos - i) / this._rendererInitialOptions.masterPixelCount; 
      diffRatio = safemod(diffRatio, 1) - 0.5;
      let flowExplodeRatio = diffRatio;
      flow += flowExplodeRatio * this._runtimeOptions.flowBoomVel;
      this._ring.ph.flow[i] = flow;
    }
  } 
  

}

export default Dyna;