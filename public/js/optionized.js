'use strict';
class Optionized {
  constructor(options) {
    this._applyOptions(options);
  }
  static get _defaultOptions() {
    return {};
  }
  _applyOptions(options) {
    this._options = Object.assign({}, this.constructor._defaultOptions, options);
  }
}
export default Optionized;