'use strict';
// ES6
import TimedRenderer from './timedRenderer';

class IonizedRenderer extends TimedRenderer {
  static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
      ionica: null,
      iterationSteps: [
        ...super._defaultInitialOptions.iterationSteps,
        'ionica',
      ],
    });
  }
  
  /* extend */ _construct() {
    if (!this._initialOptions.ionica) {
      throw new Error('Instance of ionica is required for renderer to work');
    }
    super._construct();
    this._input = this._initialOptions.ionica._input;
  }
  
  
}

export default IonizedRenderer;