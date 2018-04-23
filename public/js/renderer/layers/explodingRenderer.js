'use strict';
// ES6
import MomentoRenderer from './momentoRenderer';
import Helper from './../helper.js';
import { EventEmitter } from 'events';

let safemod = Helper.safemod;
class ExplodingRenderer extends MomentoRenderer {
  
  /* extend */ static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
      iterationSteps: [
        ...super._defaultInitialOptions.iterationSteps,
        'explodes',
      ],
      maxExplodes: 16,
    });
  }


  _construct() {
    super._construct();
    this._explodes = [];
    this._pendingExplodes = [];
  }

  _resetExplodes(){
    this._explodes.length = 0;
    this._pendingExplodes.length = 0;
  }
  _updateExplodes() {
    //caring about keeping reference of arrays same
    this._explodes.length = 0;
    this._explodes.push(...this._pendingExplodes);
    this._pendingExplodes.length = 0;
  }

  /* extend */ _onKernelReset() {
    super._onKernelReset();
    this._resetExplodes();
  }
  /* declare */ _onKernelExplodes() {
    //super._onKernelExplodes();
    this._updateExplodes();
  }

  /* public */ explode(explodes) {
    if (this._pendingExplodes.length < this._initialOptions.maxExplodes) {
      this._pendingExplodes.push(...explodes);
    }
  }
  
  
}




export default ExplodingRenderer;