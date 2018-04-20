'use strict';
// ES6
import AbstractIterativeRenderer from './abstractIterativeRenderer';
import Helper from './../helper.js';
import { EventEmitter } from 'events';

let safemod = Helper.safemod;
class TimedRenderer extends AbstractIterativeRenderer {
  
  /* extend */ static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
      iterationSteps: [
        ...super._defaultInitialOptions.iterationSteps,
        'time',
      ],
    });
  }

  _construct() {
    super._construct();
    this._time = {
      // keys and zero values will be filled in _resetTime() via _reset()
    }
  }

  _resetTime() {
    let t = Date.now() / 1000;
    let dt = 50;
    this._time.t = t;
    this._time.dt = dt;
  }
  _updateTime() {
    let t = Date.now() / 1000;
    let dt = t - this._time.t;
    this._time.t = t;
    this._time.dt = dt;
  }

  /* declare */ _onKernelReset() {
    //super._onKernelReset();
    this._resetTime();
  }
  /* declare */ _onKernelTime() {
    //super._onKernelMomento();
    this._updateTime();
  }
}

export default TimedRenderer;