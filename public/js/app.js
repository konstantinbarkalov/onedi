'use strict';
const composePixelCount = 4096;
const masterPixelCount = 30 * 5;
const premulator = require('./premulator.js');
let config = {
  runStampsCount: 100,
}
//let sio = io();
let sio = premulator(composePixelCount, masterPixelCount);
function Ledsim(sio, $composeCanvas, $masterCanvas, $stat) {
  const that = this;
  that._composeCanvasScaledWidth = 0;
  that._composeCanvasScaledHeight = 0;
  that._composeCanvas = null;
  that._composeCtx = null;
  that._masterCanvasScaledWidth = 0;
  that._masterCanvasScaledHeight = 0;
  that._masterCanvas = null;
  that._masterCtx = null;
  
  function init() {
    sio.on('ledline', (composeData, masterData) => {
      readLedline(composeData, masterData);
    });
    that._composeCanvas = $composeCanvas[0];
    that._composeCtx = that._composeCanvas.getContext('2d');  
    that._composeCanvas.width = composePixelCount;
    that._composeCanvas.height = 1;
    that._masterCanvas = $masterCanvas[0];
    that._masterCtx = that._masterCanvas.getContext('2d');  
    that._masterCanvas.width = masterPixelCount;
    that._masterCanvas.height = 1;

    $(window).on('resize', () => {
      updateCanvasScaledSize();
    });
    updateCanvasScaledSize();
  }
  that._stat = {
    count: 0,
    runStamps: new Array(config.runStampsCount),
  }
  function stat() {
    that._stat.count++;
    that._stat.runStamps.pop();
    that._stat.runStamps.unshift(Date.now());
    let filledStampsCount = Math.min(config.runStampsCount, that._stat.count);
    if (filledStampsCount >= 2) {
      let avgDelta = (that._stat.runStamps[0] - that._stat.runStamps[filledStampsCount - 1]) / (filledStampsCount - 1);
      that._stat.avgFps = 1000 / avgDelta;
      updateStat();
    }
  }
  function updateCanvasScaledSize() {
    that._composeCanvasScaledWidth = $composeCanvas.width();
    that._composeCanvasScaledHeight = $composeCanvas.height();
    that._masterCanvasScaledWidth = $masterCanvas.width();
    that._masterCanvasScaledHeight = $masterCanvas.height();
  }

  function readLedline(ledlineComposeData, ledlineMasterData) {
    updateComposeCanvas(ledlineComposeData);
    updateMasterCanvas(ledlineMasterData);
    stat();
  }
  function updateStat() {
    $stat.html(`fps: ${that._stat.avgFps.toFixed(1)}</br> total: ${that._stat.count}`);
  }
  function updateComposeCanvas(ledlineData) {
    let imd = that._composeCtx.createImageData(1,1);
    let d  = imd.data;                       
    d[3] = 255; //alpha
    for (let i = 0; i < composePixelCount; i++) {
      d[0] = ledlineData[i].r;
      d[1] = ledlineData[i].g;
      d[2] = ledlineData[i].b;
      that._composeCtx.putImageData(imd, i, 0 );  
    }
  }
  function updateMasterCanvas(ledlineData) {
    let imd = that._masterCtx.createImageData(1,1);
    let d  = imd.data;                       
    d[3] = 255; //alpha
    for (let i = 0; i < masterPixelCount; i++) {
      d[0] = ledlineData[i].r;
      d[1] = ledlineData[i].g;
      d[2] = ledlineData[i].b;
      that._masterCtx.putImageData(imd, i, 0 );  
    }
  }
  init();
}

let $composeCanvas = $('.ledsim-compose-canvas'); 
let $masterCanvas = $('.ledsim-master-canvas'); 

let $stat = $('.ledsim-stat');
let ledsim = new Ledsim(sio, $composeCanvas, $masterCanvas, $stat);