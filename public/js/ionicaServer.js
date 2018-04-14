'use strict';
const EventEmitter = require('events').EventEmitter;

// ES6
import IonicaClient from './ionicaClient.js';

class IonicaServer extends IonicaClient {
  static get _defaultInitialOptions() {
    return {
      canAskForRepeat: false,
      canRepeat: true,
    }
  }
  static get _defaultRuntimeOptions() {
    return {
    }
  }

}
//let a = new IonicaServer();
export default IonicaServer;