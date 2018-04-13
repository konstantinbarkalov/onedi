'use strict';
const coreconfig = require('./coreconfig.json');
const masterPixelCount = coreconfig.render.master.pixelCount;
const composePixelCount = coreconfig.render.composes.ledlineA.pixelCount;
const windPixelCount = masterPixelCount;
const ingearPixelCount = composePixelCount;
const heatPixelCount = composePixelCount;


// ES6
import VisualProcessor from './visualProcessor.js';
import Ionica from './ionica.js';
import DeskSimulator from './deskSimulator.js';
import Ledsim from './ledsim.js';
import { EventEmitter } from 'events';
let config = {
  runStampsCount: 100,
}
//  via socket.io
//let iobus = io();
//let databus = iobus;
// /via socket.io

let databus = new EventEmitter(); // TODO
let iobus = new EventEmitter(); // TODO
//let ionica = new Ionica({iobus: iobus});
let deskSimulator = new DeskSimulator({iobus: iobus, $container: $('.desk-simulator')});
let visualProcessor = new VisualProcessor({databus: databus, iobus: iobus, coreconfigKey: 'ledlineA'});

let $masterCanvas = $('.ledsim-master-canvas'); 
let $composeCanvas = $('.ledsim-compose-canvas'); 
let $windCanvas = $('.ledsim-wind-canvas'); 
let $ingearCanvas = $('.ledsim-ingear-canvas'); 
let $heatCanvas = $('.ledsim-heat-canvas'); 


let $stat = $('.ledsim-stat');
let ledsim = new Ledsim(databus, $masterCanvas, $composeCanvas, $windCanvas, $ingearCanvas, $heatCanvas, $stat);