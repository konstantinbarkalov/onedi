'use strict';
// ES6
import OptionizedCoreconfigured from './../optionizedCoreconfigured.js';
import Helper from './helper.js';
import { EventEmitter } from 'events';

let safemod = Helper.safemod;
class AbstractIterativeRenderer extends OptionizedCoreconfigured {
  static get _defaultInitialOptions() {
    return {
      fps: 60,
    }
  }

  constructor (initialOptions, runtimeOptions) {
    super(initialOptions, runtimeOptions);
    this._construct();
    this._reset();
    setInterval(() => { this._iteration(); }, 1000 / this._initialOptions.fps);    
  }
  _construct() {
    this.world = new EventEmitter();
  }
  _reset() {
    this._localReset();
    this.world.emit('reset');
  }

  _iteration() {
    this._localPrepare();
    this.world.emit('prepare');
    this._localLive();
    this.world.emit('live');
    this._localExplode();
    this.world.emit('explode');
    this._localDraw();
    this.world.emit('draw');
    this._localPostdraw();
    this.world.emit('postdraw');
  }

  /* abstract */ _localReset() {

  }
  /* abstract */ _localPrepare() {

  }
  /* abstract */ _localLive() {

  }
  /* abstract */ _localExplode() {

  }
  /* abstract */ _localDraw() {

  }
  /* abstract */ _localPostdraw() {

  }

}

export default AbstractIterativeRenderer;