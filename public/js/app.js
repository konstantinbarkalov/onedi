'use strict';
const masterPixelCount = 960;
const composePixelCount = 30 * 5;
const windPixelCount = masterPixelCount;
const ingearPixelCount = composePixelCount;
const heatPixelCount = composePixelCount;

// ES6
import VisualProcessor from './visualProcessor.js';
import Ionica from './ionica.js';
import DeskSimulator from './deskSimulator.js';
import Ledsim from './ledsim.js';
let config = {
  runStampsCount: 100,
}
//let iobus = io();
let ionica = new Ionica();
let iobus = ionica.iobus;
let deskSimulator = new DeskSimulator($('.desk-simulator'), iobus);
let visualProcessor = new VisualProcessor(iobus, {masterPixelCount:masterPixelCount, composePixelCount:composePixelCount});
let databus = visualProcessor;
let $masterCanvas = $('.ledsim-master-canvas'); 
let $composeCanvas = $('.ledsim-compose-canvas'); 
let $windCanvas = $('.ledsim-wind-canvas'); 
let $ingearCanvas = $('.ledsim-ingear-canvas'); 
let $heatCanvas = $('.ledsim-heat-canvas'); 


let $stat = $('.ledsim-stat');
let ledsim = new Ledsim(databus, $masterCanvas, $composeCanvas, $windCanvas, $ingearCanvas, $heatCanvas, $stat);