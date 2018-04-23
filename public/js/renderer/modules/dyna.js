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
      //particDynasBurnTtl: 5,
      particDynasBaseBrightness: 0.0,
      //burnBornMultiplier: 10,
      //burnDieMultiplier: 1 / 10,
      burnBornMultiplier: 5,
      burnDieMultiplier: 1 / 50,
      particDynasBurnTtl: 10,
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

    console.log('boom dyna, rgb', this._momento.loopStampPos, r,g,b);
    let backetsCount = 16;
    for (let backetId = 0; backetId < backetsCount; backetId++) {
      let backetVel = (Math.random() - 0.5) * this._runtimeOptions.particDynasBoomVel * Math.SQRT2 * 0.75;
      // sqrt2 as a compensation of rnd + rnd, multiplier as a weight between backet influence and dyna
      let backetR = (Math.random() - 0.5) * 0.25;
      let backetG = (Math.random() - 0.5) * 0.25;
      let backetB = (Math.random() - 0.5) * 0.25;

      for (let i = 0; i < this._runtimeOptions.particDynasBoomCount / backetsCount; i++) {
        let spawnedparticdynasindex = Math.floor(Math.random() * this._initialOptions.particDynasMaxCount)
        // todo: smart grave
        let dynaTtl = Math.random() * this._runtimeOptions.particDynasAverageTtl * 2;
        let dynaVel = (Math.random() - 0.5) * this._runtimeOptions.particDynasBoomVel * Math.SQRT2 * 0.25;
        // sqrt2 as a compensation of rnd + rnd, multiplier as a weight between backet influence and dyna
        let dynaR = (Math.random() - 0.5) * 0.25;
        let dynaG = (Math.random() - 0.5) * 0.25;
        let dynaB = (Math.random() - 0.5) * 0.25;
        let dynaBurnTtl = this._runtimeOptions.particDynasBurnTtl;
        this._partics[spawnedparticdynasindex * 8 + 0] = dynaTtl;
        this._partics[spawnedparticdynasindex * 8 + 1] = pos;
        this._partics[spawnedparticdynasindex * 8 + 2] = vel + backetVel + dynaVel;
        this._partics[spawnedparticdynasindex * 8 + 3] = r + backetR + dynaR;
        this._partics[spawnedparticdynasindex * 8 + 4] = g + backetG + dynaG;
        this._partics[spawnedparticdynasindex * 8 + 5] = b + backetB + dynaB;
        if (Math.random() < 0.1)  { console.log('## putting b to partics', dynaB, 'with rgb', r,g,b); }
        this._partics[spawnedparticdynasindex * 8 + 6] = dynaBurnTtl;
      }
    }
  }
  _liveExplode() {
    let explodes = this._explodes;
    explodes.forEach((explode) => {
     this._explodeParticFat(explode);
    });
  }
  _liveParticDynas() {
    let timeFactor = 1;
    if (this._input.momentaryB.value) {
      timeFactor = (this._momento.beatStampPos * 1 % 1 < 0.5)?1:-1;
    }
    let flowAffectRatio = 1 - Math.pow(0.25, this._time.dt);
    for (let i = 0; i < this._initialOptions.particDynasMaxCount; i++) {
      let ttl = this._partics[i * 8 + 0];
      if (ttl > this._time.dt) {
        ttl -= this._time.dt;
        let pos = this._partics[i * 8 + 1];
        let vel = this._partics[i * 8 + 2];
        let burnTtl = this._partics[i * 8 + 6];
        burnTtl -= this._time.dt;
        burnTtl = Math.max(0, burnTtl);
        let intPos = Math.floor(pos);
        let flowVel = this._ring.ph.flow[intPos];
        vel -= (vel - flowVel) * flowAffectRatio;

        pos += (vel * this._time.dt) * timeFactor;
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
      baseStrobeFactor = (this._momento.beatStampPos * 2 % 1 > 0.75)?10:-1;
    }
    for (let i = 0; i < this._initialOptions.particDynasMaxCount; i++) {
      let ttl = this._partics[i * 8 + 0];
      let pos = this._partics[i * 8 + 1];
      let vel = this._partics[i * 8 + 2];
      let burnTtl = this._partics[i * 8 + 6];

      let r = this._partics[i * 8 + 3];
      let g = this._partics[i * 8 + 4];
      let b = this._partics[i * 8 + 5];
      if (Math.random() < 0.0001)  { console.log('## getting b from partics', b); }

      let intPos = Math.floor(pos);
      let brightnessFactor = baseStrobeFactor + this._runtimeOptions.particDynasBaseBrightness + this._particDynasBurnTtlToBrightnessFactor(burnTtl);
      this._ring.g.master[intPos * 3 + 0] += r * brightnessFactor;
      this._ring.g.master[intPos * 3 + 1] += g * brightnessFactor;
      this._ring.g.master[intPos * 3 + 2] += b * brightnessFactor;
    }
  }


}

export default Dyna;