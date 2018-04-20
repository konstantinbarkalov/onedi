'use strict';
// ES6
import OptionizedCoreconfigured from './optionizedCoreconfigured.js';

class Watchdog extends OptionizedCoreconfigured {
  static get _defaultInitialOptions() {
    return {
      ask: 'status',
      await: 'status',
      askTimeStampDelta: 0,
      awaitTimeStampDelta: 1000
    }
  }
  static get _defaultRuntimeOptions() {
    return {
    }
  }

  static _getCoreconfigInitialOptions(coreconfig, coreconfigKey) {
    return {
    }
  }
  
  constructor (initialOptions, runtimeOptions) {
    super(initialOptions, runtimeOptions);
    this._constructTimer();
  }
  
  _constructTimer() {
    if (this._initialOptions.askTimeStampDelta) {
      let intervalId = setInterval(()=>{
        this._askIteration();
      }, this._initialOptions.askTimeStampDelta);
    }
    if (this._initialOptions.awaitTimeStampDelta) {
      let intervalId = setInterval(()=>{
        this._awaitIteration();
      }, this._initialOptions.awaitTimeStampDelta);
      
      this._initialOptions.bus.on(this._initialOptions.await, ()=>{
        this._awaitCallback();
      });  
    }
  }
  
  _askIteration() {
    this._initialOptions.bus.emit(this._initialOptions.ask);
  }

  _awaitIteration() {
    let timeStampDelta = Date.now() - this._runtimeOptions.lastTimeStamp;
    if (timeStampDelta > this._initialOptions.awaitTimeStampDelta) {
      _alert(new Error(`Watchdog alert! No ${this._initialOptions.await} events heared for more than ${timeStampDelta} mesc (${this._initialOptions.awaitTimeStampDelta} msec max allowed)`));
    }
  }
  _alert(error) {
    if (this._initialOptions.dieFast) {
      throw error;
    } else {
      console.warn(error);
    }
  }

  _awaitCallback() {
    this._runtimeOptions.lastTimeStamp = Date.now();
  }
}
//let a = new Watchdog();
export default Watchdog;