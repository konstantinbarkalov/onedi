'use strict';
// ES6
class Helper {
  static safemod(divident, divisor) {
    return ((divident % divisor) + divisor) % divisor;
  }
}
export default Helper;