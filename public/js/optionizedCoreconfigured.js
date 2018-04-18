'use strict';
const coreconfig = require('./coreconfig.json');
// ES6
import Optionized from './optionized.js';
class OptionizedCoreconfigured extends Optionized {
  
  static _getCoreconfigInitialOptions(coreconfig, coreconfigKey) {
    return {  
    }
  }
  static _notifyDefaultOverrides(defaultOptions, coreconfigOptions) {
    Object.keys(defaultOptions).forEach((coreconfigOptionsKey) => {
      let newValue = coreconfigOptions[coreconfigOptionsKey];
      if (newValue !== undefined) {
        let oldValue = defaultOptions[coreconfigOptionsKey];
        console.warn(`Overriding defaultOptions variable with coreconfigOptions ${coreconfigOptionsKey} with ${newValue} (default was ${oldValue})`);
      }
    })
  }
  static _warnCoreconfigOverrides(coreconfigOptions, initialOptions) {
    Object.keys(coreconfigOptions).forEach((coreconfigOptionsKey) => {
      let newValue = initialOptions[coreconfigOptionsKey];
      if (newValue !== undefined) {
        let oldValue = coreconfigOptions[coreconfigOptionsKey];
        console.warn(`Overriding coreconfigOptions variable with initialOptions ${coreconfigOptionsKey} with ${newValue} (coreconfig was ${oldValue})`);
      }
    })
  }
  static /* override */ _weldInitialOptionsWithDefault(initialOptions) {
    let coreconfigKey = undefined;
    if  (initialOptions) {
      coreconfigKey = initialOptions.coreconfigKey;
    };
    let coreconfigOptions = this._getCoreconfigInitialOptions(coreconfig, coreconfigKey);
    this._notifyDefaultOverrides(this._defaultInitialOptions, coreconfigOptions);
    this._warnCoreconfigOverrides(coreconfigOptions, initialOptions);
    return super._weldInitialOptionsWithDefault(Object.assign({}, coreconfigOptions, initialOptions));
  }

}
export default OptionizedCoreconfigured;