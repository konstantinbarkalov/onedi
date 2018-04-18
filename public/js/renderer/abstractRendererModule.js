'use strict';
const coreconfig = require('./coreconfig.json');
// ES6
import OptionizedCoreconfigured from './optionizedCoreconfigured.js';

class AbstractRendererModule extends OptionizedCoreconfigured{
  constructor(initialOptions, runtimeOptions) {
    super(initialOptions, runtimeOptions);
    this._constructShortcuts();
    this._bindToWorld();
    this.reset();
  }
  _constructShortcuts() {
    this._renderer = this._initialOptions.renderer;
    this._world = this._initialOptions.renderer.world;
    this._input = this._initialOptions.renderer._input;
    this._iter = this._initialOptions.renderer._iter;
    this._ring = this._initialOptions.renderer._ring;
    this._rendererInitialOptions = this._initialOptions.renderer._initialOptions;
    this._rendererRuntimeOptions = this._runtimeOptions.renderer._runtimeOptions;
  }
  _bindToWorld() {
    this._world.on('reset', () => {
      this.reset();
    });
    this._world.on('live', () => {
      this.live();
    });
    this._world.on('draw', () => {
      this.draw();
    });
    this._world.on('explode', (explodes) => {
      this.explode(explodes);
    });
  }
  reset() {
    throw new Error('Not implemented');
  }
  live() {
    throw new Error('Not implemented');
  }
  draw() {
    throw new Error('Not implemented');
  }
  explode(explodes) {
    throw new Error('Not implemented');
  }

}
export default AbstractRendererModule;