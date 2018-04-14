'use strict';

// ES6
import LedlineSimulator from './ledlineSimulator.js';

function anchor3({databus}) {
  let ledlineSimulator = new LedlineSimulator({databus:databus, $container: $('.ledline-simulator')});
}
export default anchor3;