'use strict';

// ES6
import IonicaClient from './ionicaClient.js';
import DeskSimulator from './deskSimulator.js';

function anchor2({iobus}) {
  let ionicaClient = new IonicaClient({iobus: iobus});
  let deskSimulator = new DeskSimulator({iobus: iobus, $container: $('.desk-simulator')});
}
export default anchor2;