'use strict';
const EventEmitter = require('events').EventEmitter;
let databus = new EventEmitter();
let iobus = new EventEmitter();

//const sio = require('socket.io');
//let iobus = sio();
//let databus = iobus;

// ES6
import anchor1 from './anchor1.js';
import anchor2 from './anchor2.js';
import anchor3 from './anchor3.js';

anchor1({databus, iobus});
anchor2({iobus});
anchor3({databus});