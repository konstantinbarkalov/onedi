'use strict';
const EventEmitter = require('events').EventEmitter;
const dataconfig = require('./dataconfig.json');
// ES6
import Optionized from './optionized.js';
class Datanica extends Optionized {
  static get _defaultOptions() {
    return { 
    }
  }
  constructor (databus, options) {
    super(options);
    this.databus = databus;
    this._constructFromIoconfig(dataconfig);
  }
  _constructFromIoconfig(dataconfig) {
    this._input = {};
    Object.keys(dataconfig.input).forEach((inputKey) => {
      let dataconfigForKey = dataconfig.input[inputKey];
      this._input[inputKey] = {
        value: dataconfigForKey.initialValue,
        dataconfig: dataconfigForKey,
      };
      this.databus.on(inputKey, (value) => {
        this._input[inputKey].value = value
      })
    });
  }
  
}
//let a = new Datanica();
export default Datanica;