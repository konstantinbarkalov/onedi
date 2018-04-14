'use strict';

// ES6
import IonicaClient from './ionicaClient.js';
import Renderer from './renderer.js';

function anchor1({databus, iobus}) {
  let ionicaClient = new IonicaClient({iobus: iobus});
  let renderer = new Renderer({databus: databus, iobus: iobus, coreconfigKey: 'ledlineA'});
}
export default anchor1;