'use strict';
// ES6
import MomentoRenderer from './momentoRenderer.js';

class ExplodedRenderer extends MomentoRenderer {
  /* public */ explode(explodes) {
    this._pendingExplodes.push(...explodes);
  }
  /* extend */ _construct() {
    super._construct();
    this._pendingExplodes = [];
  }
  
  /* extend */ _resetMomento() {
    super._resetMomento();
    this._momento.explodes = [];
    this._pendingExplodes = [];
  }

  /* extend */ _liveMomento() {
    super._liveMomento();
    this._momento.explodes = this._pendingExplodes;
    this._pendingExplodes = [];
  }
}

export default ExplodedRenderer;