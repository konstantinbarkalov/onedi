'use strict';
// ES6
import MomentoRenderer from './momentoRenderer';

class RingedRenderer extends MomentoRenderer {

  static _getCoreconfigInitialOptions(coreconfig, coreconfigKey) {
    return {
      masterPixelCount: coreconfig.render.master.pixelCount,
      composePixelCount: coreconfig.render.composes[coreconfigKey].pixelCount,
    }
  }
  
  /* exptend */ _construct() {
    super._construct();
    this._ring = {
      g: {
        master: new Float32Array(this._initialOptions.masterPixelCount * 3),
        compose: new Float32Array(this._initialOptions.composePixelCount * 3),
        ingear: new Float32Array(this._initialOptions.composePixelCount * 3),
      },
      ph: {
        flow: new Float32Array(this._initialOptions.masterPixelCount),
      },
      outputBuffer: {
        master: new Uint8ClampedArray(this._initialOptions.masterPixelCount * 3),
        compose: new Uint8ClampedArray(this._initialOptions.composePixelCount * 3),
        ingear: new Uint8ClampedArray(this._initialOptions.composePixelCount * 3),
        flow: new Uint8ClampedArray(this._initialOptions.masterPixelCount * 3),
        heat: new Uint8ClampedArray(this._initialOptions.masterPixelCount * 3),        
      },
    }
  }

  /* exptend */ _localReset() {
    super._localReset();
    this._resetRing();
  }
  _resetRing() {
    this._fillMasterBlack();
    this._fillIngearBlack();
    this._fillFlowBlack();
  }
  _fillMasterBlack() {
    for (let i = 0; i < this._initialOptions.masterPixelCount * 3; i++) {
      this._ring.g.master[i] = 0;
    }
  }
  _fillIngearBlack() {
    for (let i = 0; i < this._runtimeOptions.ingearPixelCount * 3; i++) {
      this._ring.g.ingear[i] = 0;
    }
  }
  _fillFlowBlack() {
    for (let i = 0; i < this._initialOptions.masterPixelCount; i++) {
      this._ring.g.master[i] = 0;
    }
  }
}

export default RingedRenderer;