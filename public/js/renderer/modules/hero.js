'use strict';

// ES6
import Helper from './../helper.js';
let safemod = Helper.safemod;


import AbstractRendererModule from './abstractRendererModule';

class Hero extends AbstractRendererModule {
  static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
      ///////ionica: null,
    });
  }
  static get _defaultRuntimeOptions() {
    return Object.assign({}, super._defaultRuntimeOptions, {
      particHeroesBaseBrightness: 1,
      burnBornMultiplier: 1 / 2,
      burnDieMultiplier: 2,
    });
  }
  static _getCoreconfigInitialOptions(coreconfig, coreconfigKey) {
    return Object.assign({}, super._getCoreconfigInitialOptions(coreconfig, coreconfigKey), {
      particHeroesMaxCount: coreconfig.renderer.hero.particsMaxCount, 
    });
  }
  /* extend */ _construct() {
    super._construct();
    this._partics = new Float32Array(this._initialOptions.particHeroesMaxCount * 6);
  }
  /* declare */ _onModuleReset() {
    this._fillParticHeroesRandom();  
  }
  /* declare */ _onModuleLive() {
    this._liveParticHeroes();
    this._drawOnFlowParticHeroes();
    this._liveAndDrawOnFlowExplodes();
  }
  /* declare */ _onModuleDraw() {
    this._drawOnMasterParticHeroes();
    
  }
  _fillParticHeroesRandom() {
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      this._partics[i * 6 + 0] = 0; //TODO drop
      this._partics[i * 6 + 1] = Math.random() * this._rendererInitialOptions.masterPixelCount;
      this._partics[i * 6 + 2] = (Math.random() - 0.5) * 500;
      this._partics[i * 6 + 3] = Math.random();
      this._partics[i * 6 + 4] = Math.random();
      this._partics[i * 6 + 5] = Math.random();
    }
  }
  _liveParticHeroesFromClone() {
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      let ttl = (this._momento.loopstampPos) - i / this._initialOptions.particHeroesMaxCount; // shift per beat
      ttl = safemod(ttl, 1);    
      let vel = this._momento.turnstampVel * this._rendererInitialOptions.masterPixelCount;      
      let pos = this._momento.turnstampPos * this._rendererInitialOptions.masterPixelCount;
       
      pos += i / this._initialOptions.particHeroesMaxCount * this._rendererInitialOptions.masterPixelCount; // shift per beat
      pos = safemod(pos, this._rendererInitialOptions.masterPixelCount);
      
      this._partics[i * 6 + 0] = ttl;
      this._partics[i * 6 + 1] = pos;
      this._partics[i * 6 + 2] = vel;
    }
  }
  _liveParticHeroes() {
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      let ttl = (this._momento.loopstampPos) - i / this._initialOptions.particHeroesMaxCount; // shift per beat
      ttl *= 4;
      ttl = safemod(ttl, 1);    
      let vel = this._momento.loopstampVel * this._rendererInitialOptions.masterPixelCount;      
      let pos = this._momento.loopstampPos * this._rendererInitialOptions.masterPixelCount;
      
      vel += (0.5 - this._input.analogD.value) * (this._momento.squeazeBeatstampVel - this._momento.beatstampVel) * this._rendererInitialOptions.masterPixelCount;      
      pos += (0.5 - this._input.analogD.value) * (this._momento.squeazeBeatstampPos - this._momento.beatstampPos) * this._rendererInitialOptions.masterPixelCount;
      
      vel += this._momento.turnstampVel * this._rendererInitialOptions.masterPixelCount;      
      pos += this._momento.turnstampPos * this._rendererInitialOptions.masterPixelCount;
      
      
      pos = safemod(pos, this._rendererInitialOptions.masterPixelCount);
      
      this._partics[i * 6 + 0] = ttl;
      this._partics[i * 6 + 1] = pos;
      this._partics[i * 6 + 2] = vel;
    }
  }
  _liveAndDrawOnFlowExplodes() {
    let nowHeroInt = Math.floor(this._momento.loopstampPos * this._initialOptions.particHeroesMaxCount);
    let prevHeroInt = Math.floor(this._momento.previousExplodeToParticHeroesloopstamp * this._initialOptions.particHeroesMaxCount);
    if (nowHeroInt != prevHeroInt) {
      this._explodeParticHero(nowHeroInt);
    }
    this._momento.previousExplodeToParticHeroesloopstamp = this._momento.loopstampPos; 
  }
  
  _explodeParticHero(heroIndex) {
    let pos = this._partics[heroIndex * 6 + 1];
    let vel = this._partics[heroIndex * 6 + 2];
    let r = this._partics[heroIndex * 6 + 3];
    let g = this._partics[heroIndex * 6 + 4];
    let b = this._partics[heroIndex * 6 + 5];
    console.log('boom lp, heroIndex, rgb', this._momento.loopstampPos, heroIndex, r,g,b);
    //this._renderer.explode([ {pos, vel, rgb: [r, g, b] } ]);
  }  
  

  _particHeroesBurnRatioToBrightnessFactor(burnRatio) {
    let burnBornInvRatio = 1 / this._runtimeOptions.burnBornMultiplier;
    let burnDieInvRatio = 1 / this._runtimeOptions.burnDieMultiplier;
    // TODO put this invRatios (precalced  1 / val) in _internalOptions instead multipliers
    let burnInvRatio = burnBornInvRatio - (burnBornInvRatio - burnDieInvRatio) * burnRatio;

    let burnBornBrightnessFactor = 1 / burnInvRatio; 
    return burnBornBrightnessFactor;    
  }
  
  _drawOnMasterParticHeroes() {
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      let ttl = this._partics[i * 6 + 0];
      let pos = this._partics[i * 6 + 1];
      let r = this._partics[i * 6 + 3];
      let g = this._partics[i * 6 + 4];
      let b = this._partics[i * 6 + 5];

      let halfSize = 12; // TODO: masterPixelCount changes agnostic
      halfSize *= ttl * ttl * 3;
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      let baseStrobeFactor = 0;
      let burnRatio = 0.5; // TODO loopstamp it
      let brightnessFactor = -baseStrobeFactor + this._runtimeOptions.particHeroesBaseBrightness + this._particHeroesBurnRatioToBrightnessFactor(burnRatio);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        this._ring.g.master[ii * 3 + 0] += r * 3.0 * brightnessFactor;
        this._ring.g.master[ii * 3 + 1] += g * 3.0; // * brightnessFactor;
        this._ring.g.master[ii * 3 + 2] += b * 3.0; // * brightnessFactor;  
      }
    }
  }  

  _drawOnFlowParticHeroes() {
    let affectOnFlowRatio = 1 - Math.pow(0.00001, this._momento.dt);
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      let pos = this._partics[i * 6 + 1];
      let vel = this._partics[i * 6 + 2];

   
      let halfSize = 12; // TODO: masterPixelCount changes agnostic
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

export default Hero;