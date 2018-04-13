'use strict';
const ioconfig = require('./ioconfig.json');
// ES6
import Optionized from './optionized.js';
class DeskSimulator extends Optionized {
  static get _defaultOptions() {
    return {
    }
  }
  constructor (iobus, $container, options) {
    super(options);
    this._$container = $container;
    this._iobus = iobus;
    this._constructInputFromIoconfig(ioconfig);
    this._constructOutputFromIoconfig(ioconfig);
  }
  
  static get elementBuilderset() {
    return {
      input: {
        analog: (callback, initialValue = 0.5) => {
          let $element = $('<input></input>').prop('type', 'range')
            .prop('min', 0).prop('max',  1)
            .prop('step', 0.001)
            .addClass('desk-simulator-analog');
          $element.val(initialValue);
          $element.on('input', ()=>{
            callback($element.val());
          });
          return $element;
        },
        switch: (callback, initialValue = true) => {
          let $element = $('<input></input>').prop('type', 'checkbox')
            .addClass('desk-simulator-switch');
          $element.prop('checked', initialValue);
          $element.on('change', ()=>{
            callback($element.prop('checked'));
          });
          return $element;
        } 
      },
      output: {
        statusled: (initialValue = true) => {
          let $element = $('<div></div>').addClass('desk-simulator-statusled');
          let callback = (value) => {
            $element.css({
              opacity: value,
            });
          }
          callback(initialValue);
          return {$element, callback};
        }
      }
    }
  }

  _constructInputFromIoconfig(ioconfig) {
    this._$input = $('<div></div>').addClass('desk-simulator-input');
    this._$container.append(this._$input);
    Object.keys(ioconfig.input).forEach((inputKey) => {
      let inputIoconfig = ioconfig.input[inputKey];
      let inputCCallback = (value) => {
        this._iobus.emit(inputKey, value);
      }
      let elementBuilder = DeskSimulator.elementBuilderset.input[inputIoconfig.type];
      let $element = elementBuilder(inputCCallback);
      this._$input.append($element);
    });
  }
  
  _constructOutputFromIoconfig(ioconfig) {
    this._$output = $('<div></div>').addClass('desk-simulator-output');
    this._$container.append(this._$output);
    Object.keys(ioconfig.output).forEach((outputKey) => {
      let outputIoconfig = ioconfig.output[outputKey];
      let elementBuilder = DeskSimulator.elementBuilderset.output[outputIoconfig.type];
      let {$element, outputCallback} = elementBuilder(outputCallback);
      this._iobus.on(outputKey, (value) => {
        outputCallback(value);
      });
      this._$output.append($element);
    });
  }
}
//let a = new DeskSimulator();
export default DeskSimulator;