'use strict';
class Optionized {
  constructor(initialOptions, runtimeOptions) {
    this._constructOptions(initialOptions, runtimeOptions); 
  }
  static get _defaultInitialOptions() {
    return {};
  }
  static get _defaultRuntimeOptions() {
    return {};
  }

  // static get _defaultAndSuperInitialOptions() {
  //   return Object.assign({}, this._defaultInitialOptions, super._defaultAndSuperInitialOptions);
  // }
  // static get _defaultAndSuperRuntimeOptions() {
  //   return Object.assign({}, this._defaultRuntimeOptions, super._defaultAndSuperRuntimeOptions);
  // }

  static _weldInitialOptionsWithDefault(initialOptions) {
    // return Object.assign({}, this._defaultAndSuperInitialOptions, initialOptions);
    return Object.assign({}, this._defaultInitialOptions, initialOptions);
  }

  static _weldRuntimeOptionsWithDefault(runtimeOptions) {
    // return Object.assign({}, this._defaultAndSuperRuntimeOptions, runtimeOptions);
    return Object.assign({}, this._defaultRuntimeOptions, runtimeOptions);
  }

  static _lockInitialOptions(initialOptions) {
    Object.defineProperties(initialOptions,
      Object.keys(initialOptions).map(() => {
        return {
          //writable: false,
          // TODO: switch to { writable: false} on prod
          set: () => {
            throw new Error('Initial options is read-only, any changes in runtime are prohibited.')
          }
        }
      })
    );
  }

  _constructOptions(initialOptions, runtimeOptions = initialOptions, lockOnConstruct = true) {
    console.log('bbb');
    this._initialOptions = this.constructor._weldInitialOptionsWithDefault(initialOptions);
    if (lockOnConstruct) { this.constructor._lockInitialOptions(initialOptions); }
    // options, that are setted at init-time and expect to be read-only (unexpected to be changed at runtime)
    // must be read from this._initialOptions

    this._runtimeOptions = this.constructor._weldRuntimeOptionsWithDefault(runtimeOptions);
    // options, that are allowed to be changed at runtime
    // must be read (and write) from this._runtimeOptions
  }
    
}
export default Optionized;