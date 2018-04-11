'use strict';
class Limiter {
  ////////
  //////// LIMITER
  //////// describe me...
  ////////
  constructor (options) {
    this._setup(options);  
  }

  _setup(options) {
    this._options = Object.assign({
      pixelCount: 128,
      bypass: false,
    }, options);
    this._heatRing = new Float32Array(this._options.pixelCount * 3);
    this.reset();
  }

  reset() {
    this._fillHeatBlack();
  }
  get bypass() {
    return this._options.bypass;
  }
  set bypass(bypass) {
    this._options.bypass = bypass;
  }

  process(pixels, dt, target = pixels) {
    if (pixels.length !== this._options.pixelCount) {
      throw new Error(`Input length: ${pixels.length}, but expect: ${this._options.pixelCount}`);
    }
    if (!(dt > 0)) {
      throw new Error(`Delta time: ${dt}, but expect more than 0`);
    }
    this._calcHeat(pixels, dt);
    if (this._options.bypass) {
      if (pixels === target) {
        return; // TODO: something (status maybe)
      } else {
        throw new Error('Cannot work in bypass mode when target and source are not same');
      }
    }  else {
      this._limit(pixels, target);
      return; // TODO: something (status maybe)
    }
  }
  _fillHeatBlack() {
    for (let i = 0; i < this._options.pixelCount * 3; i++) {
      this._heatRing[i] = 0;
    }
  }
  _calcHeat(pixels, dt) { 
    let chillingRatio = Math.pow(0.5, dt / 10);
    let gainingRatio = 1 - chillingRatio;
    for (let i = 0; i < this._options.pixelCount; i++) {
      this._heatRing[i * 3 + 0] *= chillingRatio;
      this._heatRing[i * 3 + 1] *= chillingRatio;
      this._heatRing[i * 3 + 2] *= chillingRatio;
    
      this._heatRing[i * 3 + 0] += gainingRatio * pixels[i].r;
      this._heatRing[i * 3 + 1] += gainingRatio * pixels[i].g;
      this._heatRing[i * 3 + 2] += gainingRatio * pixels[i].b;
    }
  }  
  _limit(pixels, target) {
    for (let i = 0; i < this._options.pixelCount; i++) {
      target[i].r = pixels[i].r - this._heatRing[i * 3 + 0];
      target[i].g = pixels[i].g - this._heatRing[i * 3 + 1];
      target[i].b = pixels[i].b - this._heatRing[i * 3 + 2];
      target[i].r = Math.max(0, target[i].r);
      target[i].g = Math.max(0, target[i].g);
      target[i].b = Math.max(0, target[i].b);
    }
  }
  
  ////////
  //////// LIMITER END
  ////////
}

module.exports = Limiter;