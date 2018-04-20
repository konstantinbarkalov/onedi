'use strict';

// ES6
import Helper from './../helper.js';
let safemod = Helper.safemod;


import AbstractRendererModule from './abstractRendererModule';

class Fat extends AbstractRendererModule {
  static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
    });
  }
  static get _defaultRuntimeOptions() {
    return Object.assign({}, super._defaultRuntimeOptions, {
      particFatsBaseBrightness: 0.1,
      burnBornMultiplier: 10,
      burnDieMultiplier: 1 / 10,
    });
  }
  static _getCoreconfigInitialOptions(coreconfig, coreconfigKey) {
    return Object.assign({}, super._getCoreconfigInitialOptions(coreconfig, coreconfigKey), {
      particFatsMaxCount: coreconfig.renderer.fat.particsMaxCount, 
    });
  }
  /* extend */ _construct() {
    super._construct();
    this._partics = new Float32Array(this._initialOptions.particFatsMaxCount * 6);
    this._previousExplodeToParticFatsloopStamp = 0;
  }
  /* declare */ _onModuleReset() {
    this._fillParticFatsRandom();  
  }
  /* declare */ _onModuleLive() {
    this._liveParticFats();
    this._drawOnFlowParticFats();
    this._liveAndDrawOnFlowExplodes()
        
  }
  /* declare */ _onModuleDraw() {
    this._drawOnMasterParticFats();
    
  }
  _fillParticFatsRandom() {
    for (let i = 0; i < this._initialOptions.particFatsMaxCount; i++) {
      this._partics[i * 6 + 0] = 0; //TODO drop
      this._partics[i * 6 + 1] = Math.random() * this._initialOptions.masterPixelCount;
      this._partics[i * 6 + 2] = (Math.random() - 0.5) * 500;
      this._partics[i * 6 + 3] = Math.random();
      this._partics[i * 6 + 4] = Math.random();
      this._partics[i * 6 + 5] = Math.random();
    }
  }
  _liveParticFats() {
    for (let i = 0; i < this._initialOptions.particFatsMaxCount; i++) {
      let ttl = (this._momento.loopStampPos) - i / this._initialOptions.particFatsMaxCount; // shift per beat
      ttl = safemod(ttl, 1);    
      let vel = this._momento.turnStampVel * this._rendererInitialOptions.masterPixelCount;      
      let pos = this._momento.turnStampPos * this._rendererInitialOptions.masterPixelCount;
       
      pos += i / this._initialOptions.particFatsMaxCount * this._rendererInitialOptions.masterPixelCount; // shift per beat
      pos = safemod(pos, this._rendererInitialOptions.masterPixelCount);
      
      this._partics[i * 6 + 0] = ttl;
      this._partics[i * 6 + 1] = pos;
      this._partics[i * 6 + 2] = vel;
    }
  }

  _liveAndDrawOnFlowExplodes() {
    let nowFatInt = Math.floor(this._momento.loopStampPos * this._initialOptions.particFatsMaxCount);
    let prevFatInt = Math.floor(this._previousExplodeToParticFatsloopStamp * this._initialOptions.particFatsMaxCount);
    if (nowFatInt != prevFatInt) {
      this._explodeParticFat(nowFatInt);
    }
    this._previousExplodeToParticFatsloopStamp = this._momento.loopStampPos; 
  }
  
  _explodeParticFat(fatIndex) {
    let pos = this._partics[fatIndex * 6 + 1];
    let vel = this._partics[fatIndex * 6 + 2];
    let r = this._partics[fatIndex * 6 + 3];
    let g = this._partics[fatIndex * 6 + 4];
    let b = this._partics[fatIndex * 6 + 5];
    console.log('boom lp, fatIndex, rgb', this._momento.loopStampPos, fatIndex, r,g,b);
    this._renderer.explode([ {pos, vel, rgb: [r, g, b] } ]);
  }  
  

  _particFatsBurnRatioToBrightnessFactor(burnRatio) {
    let burnBornInvRatio = 1 / this._runtimeOptions.burnBornMultiplier;
    let burnDieInvRatio = 1 / this._runtimeOptions.burnDieMultiplier;
    // TODO put this invRatios (precalced  1 / val) in _internalOptions instead multipliers
    let burnInvRatio = burnBornInvRatio - (burnBornInvRatio - burnDieInvRatio) * burnRatio;

    let burnBornBrightnessFactor = 1 / burnInvRatio; 
    return burnBornBrightnessFactor;    
  }
  
  _drawOnMasterParticFats() {
    for (let i = 0; i < this._initialOptions.particFatsMaxCount; i++) {
      let ttl = this._partics[i * 6 + 0];
      let pos = this._partics[i * 6 + 1];
      let r = this._partics[i * 6 + 3];
      let g = this._partics[i * 6 + 4];
      let b = this._partics[i * 6 + 5];

      let halfSize = 6; // TODO: masterPixelCount changes agnostic
      halfSize *= ttl * ttl * 3;
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      let baseStrobeFactor = 0;
      let burnRatio = 0.5; // TODO loopStamp it
      let brightnessFactor = -baseStrobeFactor + this._runtimeOptions.particFatsBaseBrightness + this._particFatsBurnRatioToBrightnessFactor(burnRatio);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        this._ring.g.master[ii * 3 + 0] += r * 2.0 * brightnessFactor;
        this._ring.g.master[ii * 3 + 1] += g * 2.0; // * brightnessFactor;
        this._ring.g.master[ii * 3 + 2] += b * 2.0; // * brightnessFactor;  
      }
    }
  }  

  _drawOnFlowParticFats() {
    let affectOnFlowRatio = 1 - Math.pow(0.0001, this._momento.dt);
    for (let i = 0; i < this._initialOptions.particFatsMaxCount; i++) {
      let pos = this._partics[i * 6 + 1];
      let vel = this._partics[i * 6 + 2];

   
      let halfSize = 6; // TODO: masterPixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        let flow = this._ring.ph.flow[ii];
        flow += (vel - flow) * affectOnFlowRatio;
        this._ring.ph.flow[ii] = flow;
      }
    }
  }  


}

export default Fat;