'use strict';
// ES6
import OptionizedCoreconfigured from './optionizedCoreconfigured.js';

class DeskSimulator extends OptionizedCoreconfigured {
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
  
  static get widgetBuilderset() {
    return {
      input: {
        analog: (callback, {initialValue, label}) => {
          let $widget = $('<div></div').addClass('desk-simulator-widget desk-simulator-widget--analog');
          let $label = $('<div></div>').text(label).addClass('desk-simulator-widget__label');
          let $element = $('<input></input>').prop('type', 'range')
            .prop('min', 0).prop('max',  1)
            .prop('step', 0.001)
            .addClass('desk-simulator-widget__analog');
          $element.val(initialValue);
          $element.on('input', ()=>{
            callback($element.val());
          });
          $widget.append($element);
          $widget.append($label);
          return $widget;
        },
        switch: (callback, {initialValue, label}) => {
          let $widget = $('<div></div').addClass('desk-simulator-widget desk-simulator-widget--switch');
          let $label = $('<div></div>').text(label).addClass('desk-simulator-widget__label');
          let $element = $('<input></input>').prop('type', 'checkbox')
            .addClass('desk-simulator-widget__switch');
          $element.prop('checked', initialValue);
          $element.on('change', ()=>{
            callback($element.prop('checked'));
          });
          $widget.append($element);
          $widget.append($label);
          return $widget;
        },
        momentary: (callback, {initialValue, label}) => {
          let $widget = $('<div></div').addClass('desk-simulator-widget desk-simulator-widget--momentary');
          let $label = $('<div></div>').text(label).addClass('desk-simulator-widget__label');
          let $element = $('<button></button>').prop('type', 'checkbox')
            .addClass('desk-simulator-widget__momentary');
          if (initialValue) { throw new Error('Momentary cannot have nonfalse initialValue')};
          $element.on('mousedown', ()=>{
            callback(true);
          });
          $(window).on('mouseup', ()=>{
            callback(false);
          });
          $widget.append($element);
          $widget.append($label);
          return $widget;
        } 
      },
      output: {
        statusled: ({initialValue, label}) => {
          let $widget = $('<div></div').addClass('desk-simulator-widget desk-simulator-widget--statusled');
          let $label = $('<div></div>').text(label).addClass('desk-simulator-widget__label');
          let $element = $('<div></div>').addClass('desk-simulator-widget__statusled');
          let outputCallback = (value) => {
            $element.css({
              opacity: value || 0,
            });
          }
          outputCallback(initialValue);
          $widget.append($element);
          $widget.append($label);
          return {$widget, outputCallback};
        },
        alertled: ({initialValue, label}) => {
          let $widget = $('<div></div').addClass('desk-simulator-widget desk-simulator-widget--alertled');
          let $label = $('<div></div>').text(label).addClass('desk-simulator-widget__label');
          let $element = $('<div></div>').addClass('desk-simulator-widget__alertled');
          let outputCallback = (value) => {
            $element.css({
              opacity: value || 0,
            });
            console.log('meme');
          }
          outputCallback(initialValue);
          $widget.append($element);
          $widget.append($label);
          return {$widget, outputCallback};
        }
      }
    }
  }

  _constructInputFromIoconfig() {
    let ioconfig = this._initialOptions.ioconfig;
    this._$input = $('<div></div>').addClass('desk-simulator-widgets desk-simulator-widgets--input');
    this._initialOptions.$container.append(this._$input);
    Object.keys(ioconfig.input).forEach((inputKey) => {
      let inputIoconfig = ioconfig.input[inputKey];
      let inputCallback = (value) => {
        this._initialOptions.iobus.emit(inputKey, value);
      }
      let widgetBuilder = DeskSimulator.widgetBuilderset.input[inputIoconfig.type];
      let $widget = widgetBuilder(inputCallback, inputIoconfig);
      this._$input.append($widget);
    });
  }
  
  _constructOutputFromIoconfig() {
    let ioconfig = this._initialOptions.ioconfig;
    this._$output = $('<div></div>').addClass('desk-simulator-widgets desk-simulator-widgets--output');
    this._initialOptions.$container.append(this._$output);
    Object.keys(ioconfig.output).forEach((outputKey) => {
      let outputIoconfig = ioconfig.output[outputKey];
      let widgetBuilder = DeskSimulator.widgetBuilderset.output[outputIoconfig.type];
      let {$widget, outputCallback} = widgetBuilder(outputIoconfig);
      this._initialOptions.iobus.on(outputKey, (value) => {
        outputCallback(value);
      });
      this._$output.append($widget);
    });
  }
}
//let a = new DeskSimulator();
export default DeskSimulator;