'use strict';
const coreconfig = require('./../../coreconfig.json');
// ES6
import OptionizedCoreconfigured from './../../optionizedCoreconfigured.js';

class AbstractRendererModule extends OptionizedCoreconfigured{
  constructor(initialOptions, runtimeOptions) {
    super(initialOptions, runtimeOptions);
    this._construct();
    this.reset();
  }
  _construct() {
    this._constructShortcuts();
    this._bindToWorld();
  }
  _constructShortcuts() {
    this._renderer = this._initialOptions.renderer;
    this._world = this._initialOptions.renderer.world;
    this._input = this._initialOptions.renderer._input;
    this._momento = this._initialOptions.renderer._momento;
    this._ring = this._initialOptions.renderer._ring;
    this._rendererInitialOptions = this._initialOptions.renderer._initialOptions;
    this._rendererRuntimeOptions = this._runtimeOptions.renderer._runtimeOptions;
  }
  _bindToWorld() {
    this._world.on('reset', () => {
      this.reset();
    });
    this._world.on('prepare', () => {
      this.prepare();
    });
    this._world.on('live', () => {
      this.live();
    });
    this._world.on('explode', (explodes) => {
      this.explode(explodes);
    });
    this._world.on('draw', () => {
      this.draw();
    });
    this._world.on('postdraw', () => {
      this.postdraw();
    });
  }
  /* API abstract */ reset() {
    throw new Error('Not implemented');
  }
  /* API abstract */ prepare() {
    throw new Error('Not implemented');
  }
  /* API abstract */ live() {
    throw new Error('Not implemented');
  }
  /* API abstract */ explode(explodes) {
    throw new Error('Not implemented');
  }
  /* API abstract */ draw() {
    throw new Error('Not implemented');
  }
  /* API abstract */ postdraw() {
    throw new Error('Not implemented');
  }


}
export default AbstractRendererModule;