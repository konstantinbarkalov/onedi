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
      particDynasBoomCount: 512,
      particDynasBoomVel: 1000,
      particDynasAverageTtl: 10,
      particDynasBurnTtl: 5,
      particDynasBaseBrightness: 0.1,
      burnBornMultiplier: 10,
      burnDieMultiplier: 1 / 100,
    });
  }
  static _getCoreconfigInitialOptions(coreconfig, coreconfigKey) {
    return Object.assign({}, super._getCoreconfigInitialOptions(coreconfig, coreconfigKey), {
      particDynasMaxCount: coreconfig.renderer.dyna.particsMaxCount, 
    });
  }
  /* extend */ _construct() {
    super._construct();
    this._partics = new Float32Array(this._initialOptions.particDynasMaxCount * 8);
  }
  /* declare */ _onModuleReset() {
    this._fillParticDynasRandom();  
  }
  /* declare */ _onModuleLive() {
    this._liveExplode();
    this._liveParticDynas();        
  }
  /* declare */ _onModuleDraw() {
    this._drawOnMasterParticDynas();    
  }

  _fillParticDynasRandom() {
    for (let i = 0; i < this._initialOptions.particDynasMaxCount; i++) {
      this._partics[i * 8 + 0] = Math.random() * this._runtimeOptions.particDynasAverageTtl * 2;
      this._partics[i * 8 + 1] = Math.random() * this._rendererInitialOptions.masterPixelCount;
      this._partics[i * 8 + 2] = Math.random() - 0.5;
      this._partics[i * 8 + 3] = Math.random();
      this._partics[i * 8 + 4] = Math.random();
      this._partics[i * 8 + 5] = Math.random();
      this._partics[i * 8 + 6] = 0; // burnTtl
      this._partics[i * 8 + 7] = Math.random(); // entropy
    }
  }
  _explodeParticFat({pos, vel, rgb: [r, g, b] }) {

    console.log('boom dyna, rgb', this._momento.loopstampPos, r,g,b);
    for (let i = 0; i < this._runtimeOptions.particDynasBoomCount; i++) {
      let spawnedparticdynasindex = Math.floor(Math.random() * this._initialOptions.particDynasMaxCount)
      // todo: smart grave
      let dynaTtl = Math.random() * this._runtimeOptions.particDynasAverageTtl * 2;
      let dynaPos = pos;
      let dynaVel = vel + (Math.random() - 0.5) * this._runtimeOptions.particDynasBoomVel;
      let dynaR = r + (Math.random() - 0.5) * 0.5;
      let dynaG = g + (Math.random() - 0.5) * 0.5;
      let dynaB = b + (Math.random() - 0.5) * 0.5;
      let dynaBurnTtl = this._runtimeOptions.particDynasBurnTtl;
      
      this._partics[spawnedparticdynasindex * 8 + 0] = dynaTtl;
      this._partics[spawnedparticdynasindex * 8 + 1] = dynaPos;
      this._partics[spawnedparticdynasindex * 8 + 2] = dynaVel;
      this._partics[spawnedparticdynasindex * 8 + 3] = dynaR;
      this._partics[spawnedparticdynasindex * 8 + 4] = dynaG;
      this._partics[spawnedparticdynasindex * 8 + 5] = dynaB;
      this._partics[spawnedparticdynasindex * 8 + 6] = dynaBurnTtl;
    }
  }
  _liveExplode() {
    let explodes = this._momento.explodes;
    explodes.forEach((explode) => {
     this._explodeParticFat(explode);
    });
  }  
  _liveParticDynas() {
    let timeFactor = 1;
    if (this._input.momentaryB.value) {
      timeFactor = (this._momento.beatstampPos * 1 % 1 < 0.5)?1:-1;
    }
    let flowAffectRatio = 1 - Math.pow(0.25, this._momento.dt);        
    for (let i = 0; i < this._initialOptions.particDynasMaxCount; i++) {
      let ttl = this._partics[i * 8 + 0];
      if (ttl > this._momento.dt) {
        ttl -= this._momento.dt;
        let pos = this._partics[i * 8 + 1];
        let vel = this._partics[i * 8 + 2];
        let burnTtl = this._partics[i * 8 + 6];
        burnTtl -= this._momento.dt;
        burnTtl = Math.max(0, burnTtl);
        let intPos = Math.floor(pos);
        let flowVel = this._ring.ph.flow[intPos];
        vel -= (vel - flowVel) * flowAffectRatio;
        
        pos += (vel * this._momento.dt) * timeFactor;
        pos = safemod(pos, this._rendererInitialOptions.masterPixelCount);
      
        
        this._partics[i * 8 + 0] = ttl;
        this._partics[i * 8 + 1] = pos;
        this._partics[i * 8 + 2] = vel;
        this._partics[i * 8 + 6] = burnTtl;
      } else {
        this._buryParcticDyna(i);
      }
    }
  }
  _buryParcticDyna(i) {
    //TODO
    // respawn as dirty solution
    this._partics[i * 8 + 0] = Math.random() * this._runtimeOptions.particDynasAverageTtl * 2; // ttl
    this._partics[i * 8 + 6] = 0; // burnTtl
  } 
  _particDynasBurnTtlToBrightnessFactor(burnTtl) {
    let burnTtlRatio = 1 - burnTtl / this._runtimeOptions.particDynasBurnTtl;
   
    let burnBornInvRatio = 1 / this._runtimeOptions.burnBornMultiplier;
    let burnDieInvRatio = 1 / this._runtimeOptions.burnDieMultiplier;
    // TODO put this invRatios (precalced  1 / val) in _internalOptions instead multipliers
    let burnInvRatio = burnBornInvRatio - (burnBornInvRatio - burnDieInvRatio) * burnTtlRatio;

    let burnBornBrightnessFactor = 1 / burnInvRatio; 
    return burnBornBrightnessFactor;    
  }
  _drawOnMasterParticDynas() {
    let baseStrobeFactor = 0;
    if (this._input.momentaryC.value) {
      baseStrobeFactor = (this._momento.beatstampPos * 2 % 1 > 0.75)?10:-1;
    }
    for (let i = 0; i < this._initialOptions.particDynasMaxCount; i++) {
      let ttl = this._partics[i * 8 + 0];
      let pos = this._partics[i * 8 + 1];
      let vel = this._partics[i * 8 + 2];
      let burnTtl = this._partics[i * 8 + 6];

      let r = this._partics[i * 8 + 3];
      let g = this._partics[i * 8 + 4];
      let b = this._partics[i * 8 + 5];

      let intPos = Math.floor(pos);

      let brightnessFactor = baseStrobeFactor + this._runtimeOptions.particDynasBaseBrightness + this._particDynasBurnTtlToBrightnessFactor(burnTtl);      
      this._ring.g.master[intPos * 3 + 0] += r * brightnessFactor;
      this._ring.g.master[intPos * 3 + 1] += g * brightnessFactor;
      this._ring.g.master[intPos * 3 + 2] += b * brightnessFactor;
    }
  }
  

}

export default Dyna;