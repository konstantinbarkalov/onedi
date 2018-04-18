'use strict';

// ES6
import OptionizedCoreconfigured from './optionizedCoreconfigured.js';

class IonicaClient extends OptionizedCoreconfigured {
  static get _defaultInitialOptions() {
    return {
      canAskForRepeat: true,
      canRepeat: false,
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
    if (this._initialOptions.canAskForRepeat && this._initialOptions.canRepeat) {
      throw new Error('Cannot do both askForRepeat and repeat at start')
    } else if (this._initialOptions.canAskForRepeat) {
      this._askForRepeat();
    } else if (this._initialOptions.canRepeat) {
      this._repeat();
      this._initialOptions.iobus.on('repeat', (state)=>{
        this._repeat(state);
      });
    }
  }

  _askForRepeat() {
    this._initialOptions.iobus.emit('repeat');
  }

  _repeat(state) {
    if (state) {
      let inputValue = this._input[state].value;
      if (inputValue !== undefined) {
        this._initialOptions.iobus.emit(state, inputValue);
      }
      let outputValue = this._input[state].value;
      if (outputValue !== undefined) {
        this._initialOptions.iobus.emit(state, outputValue);
      }      
    } else {
      Object.keys(this._input).forEach((inputKey) => {
        let value = this._input[inputKey].value;
        this._initialOptions.iobus.emit(inputKey, value);
      });
      Object.keys(this._output).forEach((outputKey) => {
        let value = this._output[outputKey].value;
        this._initialOptions.iobus.emit(outputKey, value);
      });
    };
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
//let a = new IonicaClient();
export default IonicaClient;