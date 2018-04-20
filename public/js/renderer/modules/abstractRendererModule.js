'use strict';
const coreconfig = require('./../../coreconfig.json');
// ES6
import OptionizedCoreconfigured from './../../optionizedCoreconfigured.js';

class AbstractRendererModule extends OptionizedCoreconfigured{
  constructor(initialOptions, runtimeOptions) {
    super(initialOptions, runtimeOptions);
    this._construct();
    this._reset();
  }

  _reset() {
    if (this._onModuleReset) { this._onModuleReset(); }
  }

  _construct() {
    this._constructShortcuts();
    this._bindToModuleEventEmitter();
  }
  _constructShortcuts() {
    this._renderer = this._initialOptions.renderer;
    this._ee = this._initialOptions.renderer.ee.module;
    this._time = this._initialOptions.renderer._time;
    this._input = this._initialOptions.renderer._input;
    this._momento = this._initialOptions.renderer._momento;
    this._explodes = this._initialOptions.renderer._explodes;
    this._ring = this._initialOptions.renderer._ring;
    // Shortcuted variables must support shortcutting - means keeping it's reference 
    this._rendererInitialOptions = this._initialOptions.renderer._initialOptions;
    this._rendererRuntimeOptions = this._runtimeOptions.renderer._runtimeOptions;
  }
  _bindToModuleEventEmitter() {
    this._rendererInitialOptions.iterationSteps.concat(this._rendererInitialOptions.miscSteps).forEach((iterationStep) => {
      let callbackName = '_onModule' + iterationStep.charAt(0).toUpperCase() + iterationStep.slice(1);
      let callback = this[callbackName];
      if (callback) {
        this._ee.on(iterationStep, (...args) => {
          callback.apply(this, args);
        });
      }
    });
  }


}
export default AbstractRendererModule;