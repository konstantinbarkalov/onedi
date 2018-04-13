'use strict';
const EventEmitter = require('events').EventEmitter;

// ES6
import OptionizedCorecofigured from './optionizedCorecofigured.js';

class Ionica extends OptionizedCorecofigured {
  static get _defaultInitialOptions() {
    return {
    }
  }
  static get _defaultRuntimeOptions() {
    return {
    }
  }

  static _getCoreconfigInitialOptions(coreconfig, coreconfigKey) {
    return {
      ioconfig: coreconfig.io
    }
  }
  
  constructor (initialOptions, runtimeOptions) {
    super(initialOptions, runtimeOptions);
    this._constructInputFromIoconfig();
    this._constructOutputFromIoconfig();
  }
  _constructInputFromIoconfig() {
    let ioconfig = this._initialOptions.ioconfig;
    this._input = {};
    Object.keys(ioconfig.input).forEach((inputKey) => {
      let ioconfigForKey = ioconfig.input[inputKey];
      this._input[inputKey] = {
        value: ioconfigForKey.initialValue,
        ioconfig: ioconfigForKey,
      };
      this._initialOptions.iobus.on(inputKey, (value) => {
        this._input[inputKey].value = value
      })
    });
  }
  
  _constructOutputFromIoconfig() {
    let ioconfig = this._initialOptions.ioconfig;
    this._output = {}; 
    Object.keys(ioconfig.output).forEach((outputKey) => {
      let ioconfigForKey = ioconfig.output[outputKey];
      this._output[outputKey] = {
        value: ioconfigForKey.initialValue,
        ioconfig: ioconfigForKey,
      };
      this._initialOptions.iobus.on(outputKey, (value) => {
        this._output[outputKey].value = value
      });
    });
  }
}
//let a = new Ionica();
export default Ionica;