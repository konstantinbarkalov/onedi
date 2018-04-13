'use strict';
// ES6
import OptionizedCorecofigured from './optionizedCorecofigured.js';

class Limiter extends OptionizedCorecofigured {
  static get _defaultInitialOptions() {
    return {
    }
  }
  static get _defaultRuntimeOptions() {
    return {
      bypass: false,
    }
  }

  static _getCoreconfigInitialOptions(coreconfig, composeKey) {
    return {
      pixelCount: coreconfig.render.composes[composeKey].pixelCount,
      heatLimit: coreconfig.render.composes[composeKey].limit.heat,
      electricLimit: coreconfig.render.composes[composeKey].limit.electric,
    }
  }
  
  constructor (initialOptions, runtimeOptions) {
    super(initialOptions, runtimeOptions);
    this._heatRing = new Float32Array(this._initialOptions.pixelCount * 3);
    this.reset();
  }

  reset() {
    this._fillHeatBlack();
  }
  get bypass() {
    return this._runtimeOptions.bypass;
  }
  set bypass(bypass) {
    this._runtimeOptions.bypass = bypass;
  }

  process(pixels, dt, target = pixels, clamp = {from: 0, to: 1}) {
    if (pixels.length !== this._initialOptions.pixelCount * 3) {
      throw new Error(`Input length: ${pixels.length}, but expect: ${this._initialOptions.pixelCount * 3}`);
    }
    if (!(dt > 0)) {
      throw new Error(`Delta time: ${dt}, but expect more than 0`);
    }
    if (this._runtimeOptions.bypass) {
      if (pixels !== target) {
        throw new Error('Cannot work in bypass mode when target and source are not same');
      }
    }  else {
      this._limit(pixels, target, clamp);
    }
    this._calcHeat(pixels, dt, clamp);
  }
  _fillHeatBlack() {
    for (let i = 0; i < this._initialOptions.pixelCount * 3; i++) {
      this._heatRing[i] = 0;
    }
  }
  _calcHeat(pixels, dt, clamp = {from: 0, to: 1}) { 
    let chillingRatio = Math.pow(0.5, dt / 10);
    let gainingRatio = 1 - chillingRatio;
    let clampDiff = clamp.to - clamp.from;
    for (let i = 0; i < this._initialOptions.pixelCount; i++) {
      this._heatRing[i * 3 + 0] *= chillingRatio;
      this._heatRing[i * 3 + 1] *= chillingRatio;
      this._heatRing[i * 3 + 2] *= chillingRatio;
      let clampedPixel = [
        (Math.max(clamp.from, Math.min(clamp.to, pixels[i * 3 + 0])) - clamp.from) / clampDiff,
        (Math.max(clamp.from, Math.min(clamp.to, pixels[i * 3 + 1])) - clamp.from) / clampDiff,
        (Math.max(clamp.from, Math.min(clamp.to, pixels[i * 3 + 2])) - clamp.from) / clampDiff,
      ]
      this._heatRing[i * 3 + 0] += gainingRatio * clampedPixel[0];
      this._heatRing[i * 3 + 1] += gainingRatio * clampedPixel[1];
      this._heatRing[i * 3 + 2] += gainingRatio * clampedPixel[2];
    }
  }  
  _limit(pixels, target, clamp = {from: 0, to: 1}) {
    let affects = [0, 0, 0];
    let clampDiff = clamp.to - clamp.from;
    for (let i = 0; i < this._initialOptions.pixelCount; i++) {
      
      affects[0] = Math.max(0, -6 + 12 * this._heatRing[i * 3 + 0]);
      affects[1] = Math.max(0, -6 + 12 * this._heatRing[i * 3 + 1]);
      affects[2] = Math.max(0, -6 + 12 * this._heatRing[i * 3 + 2]);

      target[i * 3 + 0] = pixels[i * 3 + 0] - affects[0] * clampDiff;
      target[i * 3 + 1] = pixels[i * 3 + 1] - affects[1] * clampDiff;
      target[i * 3 + 2] = pixels[i * 3 + 2] - affects[2] * clampDiff;
      
      target[i * 3 + 0] = Math.max(clamp.from, target[i * 3 + 0]);
      target[i * 3 + 1] = Math.max(clamp.from, target[i * 3 + 1]);
      target[i * 3 + 2] = Math.max(clamp.from, target[i * 3 + 2]);
    }
  }
}

export default Limiter;