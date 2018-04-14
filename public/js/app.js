'use strict';
const EventEmitter = require('events').EventEmitter;

// ES6

//  via socket.io
//let iobus = io();
//let databus = iobus;
// /via socket.io
let databus = new EventEmitter(); // TODO
let iobus = new EventEmitter(); // TODO

import anchor1 from './anchor1.js';
import anchor2 from './anchor2.js';
import anchor3 from './anchor3.js';

anchor1({databus, iobus});
anchor2({iobus});
anchor3({databus});
