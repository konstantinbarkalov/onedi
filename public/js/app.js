'use strict';
const masterPixelCount = 960;
const composePixelCount = 30 * 5;
const premulator = require('./premulator.js');
let config = {
  runStampsCount: 100,
}
//let sio = io();
let sio = premulator({masterPixelCount:masterPixelCount, composePixelCount:composePixelCount});
function Ledsim(sio, $masterCanvas, $composeCanvas, $stat) {
  const that = this;
  that._masterCanvasScaledWidth = 0;
  that._masterCanvasScaledHeight = 0;
  that._masterCanvas = null;
  that._masterCtx = null;
  that._composeCanvasScaledWidth = 0;
  that._composeCanvasScaledHeight = 0;
  that._composeCanvas = null;
  that._composeCtx = null;
  
  function init() {
    sio.on('ledline', (masterData, composeData) => {
      readLedline(masterData, composeData);
    });
    that._masterCanvas = $masterCanvas[0];
    that._masterCtx = that._masterCanvas.getContext('2d');  
    that._masterCanvas.width = masterPixelCount;
    that._masterCanvas.height = 1;
    that._composeCanvas = $composeCanvas[0];
    that._composeCtx = that._composeCanvas.getContext('2d');  
    that._composeCanvas.width = composePixelCount;
    that._composeCanvas.height = 1;

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
    that._masterCanvasScaledWidth = $masterCanvas.width();
    that._masterCanvasScaledHeight = $masterCanvas.height();
    that._composeCanvasScaledWidth = $composeCanvas.width();
    that._composeCanvasScaledHeight = $composeCanvas.height();
  }

  function readLedline(ledlineMasterData, ledlineComposeData) {
    updateMasterCanvas(ledlineMasterData);
    updateComposeCanvas(ledlineComposeData);
    stat();
  }
  function updateStat() {
    $stat.html(`fps: ${that._stat.avgFps.toFixed(1)}</br> total: ${that._stat.count}`);
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
  init();
}

let $masterCanvas = $('.ledsim-master-canvas'); 
let $composeCanvas = $('.ledsim-compose-canvas'); 

let $stat = $('.ledsim-stat');
let ledsim = new Ledsim(sio, $masterCanvas, $composeCanvas, $stat);