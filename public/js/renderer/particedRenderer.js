'use strict';
// ES6
import RingedRenderer from './ringedRenderer.js';

class ParticedRenderer extends RingedRenderer {
  static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
      particFatsMaxCount: 8,
      particHeroesMaxCount: 1,
    });
  }
    
  _construct() {
    super._construct();
    this._partic = {
      fats: new Float32Array(this._initialOptions.particFatsMaxCount * 6),
      heroes: new Float32Array(this._initialOptions.particHeroesMaxCount * 6),
    }
  }

  _reset() {
    super._reset();
    this._resetPartic();
  }
  _resetPartic() {
    this._fillParticFatsRandom();
    this._fillParticHeroesRandom()
  }

  _fillParticFatsRandom() {
    for (let i = 0; i < this._initialOptions.particFatsMaxCount; i++) {
      this._partic.fats[i * 6 + 0] = 0; //TODO drop
      this._partic.fats[i * 6 + 1] = Math.random() * this._initialOptions.masterPixelCount;
      this._partic.fats[i * 6 + 2] = (Math.random() - 0.5) * 500;
      this._partic.fats[i * 6 + 3] = Math.random();
      this._partic.fats[i * 6 + 4] = Math.random();
      this._partic.fats[i * 6 + 5] = Math.random();
    }
  }
  _fillParticHeroesRandom() {
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      this._partic.heroes[i * 6 + 0] = 0; //TODO drop
      this._partic.heroes[i * 6 + 1] = Math.random() * this._initialOptions.masterPixelCount;
      this._partic.heroes[i * 6 + 2] = (Math.random() - 0.5) * 500;
      this._partic.heroes[i * 6 + 3] = Math.random();
      this._partic.heroes[i * 6 + 4] = Math.random();
      this._partic.heroes[i * 6 + 5] = Math.random();
    }
  }
}

export default ParticedRenderer;