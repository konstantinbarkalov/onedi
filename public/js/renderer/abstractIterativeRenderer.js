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
      iterationSteps: [
      ],
      miscSteps: [
        'reset', 
      ]
    }
  }

  constructor (initialOptions, runtimeOptions) {
    super(initialOptions, runtimeOptions);
    this._construct();
    this._bindToKernelEventEmitter();
    this._reset();
    setInterval(() => { this._iteration(); }, 1000 / this._initialOptions.fps);    
  }
  _construct() {
    this.ee = {
      module: new EventEmitter(),
      kernel: new EventEmitter(),
    }
  }
  _bindToKernelEventEmitter() {
    this._initialOptions.iterationSteps.concat(this._initialOptions.miscSteps).forEach((iterationStep) => {
      let callbackName = '_onKernel' + iterationStep.charAt(0).toUpperCase() + iterationStep.slice(1);
      let callback = this[callbackName];
      if (callback) {
        this.ee.kernel.on(iterationStep, (...args) => {
          callback.apply(this, args);
        });
      }
    });
  }
  _reset() {
    this._emitStep('reset');
  }
  _emitStep(step) {
    this.ee.kernel.emit(step);
    this.ee.module.emit(step);
  }
  _iteration() {
    this._initialOptions.iterationSteps.forEach((iterationStep) => {
      this._emitStep(iterationStep);
    });
  }

}

export default AbstractIterativeRenderer;