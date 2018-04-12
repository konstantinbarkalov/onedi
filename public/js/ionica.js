'use strict';
const EventEmitter = require('events').EventEmitter;
const ioconfig = require('./ioconfig.json');
// ES6
import Optionized from './optionized.js';
class Ionica extends Optionized {
  static get _defaultOptions() {
    return { 
    }
  }
  constructor (iobus, options) {
    super(options);
    this.iobus = new EventEmitter();
    this._initInputFromIoconfig(ioconfig);
    this._initOutputFromIoconfig(ioconfig);
  }
  _initInputFromIoconfig(ioconfig) {
    this._input = {};
    Object.keys(ioconfig.input).forEach((inputKey) => {
      let ioconfigForKey = ioconfig.input[inputKey];
      this._input[inputKey] = {
        value: ioconfigForKey.initialValue,
        ioconfig: ioconfigForKey,
      };
      this.iobus.on(inputKey, (value) => {
        this._input[inputKey].value = value
      })
    });
  }
  
  _initOutputFromIoconfig(ioconfig) {
    this._output = {}; 
    Object.keys(ioconfig.output).forEach((outputKey) => {
      let ioconfigForKey = ioconfig.output[outputKey];
      this._output[outputKey] = {
        value: ioconfigForKey.initialValue,
        ioconfig: ioconfigForKey,
      };
      this.iobus.on(outputKey, (value) => {
        this._output[outputKey].value = value
      });
    });
  }
}
//let a = new Ionica();
export default Ionica;