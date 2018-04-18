'use strict';
// ES6
import OptionizedCoreconfigured from './optionizedCoreconfigured.js';

class Watchdog extends OptionizedCoreconfigured {
  static get _defaultInitialOptions() {
    return {
      ask: 'status',
      await: 'status',
      askTimestampDelta: 0,
      awaitTimestampDelta: 1000
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
    if (this._initialOptions.askTimestampDelta) {
      let intervalId = setInterval(()=>{
        this._askIteration();
      }, this._initialOptions.askTimestampDelta);
    }
    if (this._initialOptions.awaitTimestampDelta) {
      let intervalId = setInterval(()=>{
        this._awaitIteration();
      }, this._initialOptions.awaitTimestampDelta);
      
      this._initialOptions.bus.on(this._initialOptions.await, ()=>{
        this._awaitCallback();
      });  
    }
  }
  
  _askIteration() {
    this._initialOptions.bus.emit(this._initialOptions.ask);
  }

  _awaitIteration() {
    let timestampDelta = Date.now() - this._runtimeOptions.lastTimestamp;
    if (timestampDelta > this._initialOptions.awaitTimestampDelta) {
      _alert(new Error(`Watchdog alert! No ${this._initialOptions.await} events heared for more than ${timestampDelta} mesc (${this._initialOptions.awaitTimestampDelta} msec max allowed)`));
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
    this._runtimeOptions.lastTimestamp = Date.now();
  }
}
//let a = new Watchdog();
export default Watchdog;