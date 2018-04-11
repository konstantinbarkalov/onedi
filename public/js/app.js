'use strict';
const masterPixelCount = 960;
const composePixelCount = 30 * 5;
const windPixelCount = masterPixelCount;
const wearPixelCount = composePixelCount;
const premulator = require('./premulator.js');
let config = {
  runStampsCount: 100,
}
//let sio = io();
let sio = premulator({masterPixelCount:masterPixelCount, composePixelCount:composePixelCount});
function Ledsim(sio, $masterCanvas, $composeCanvas, $windCanvas, $wearCanvas, $stat, $analogA) {
  const that = this;
  that._masterCanvasScaledWidth = 0;
  that._masterCanvasScaledHeight = 0;
  that._masterCanvas = null;
  that._masterCtx = null;
  that._composeCanvasScaledWidth = 0;
  that._composeCanvasScaledHeight = 0;
  that._composeCanvas = null;
  that._composeCtx = null;
  that._windCanvasScaledWidth = 0;
  that._windCanvasScaledHeight = 0;
  that._windCanvas = null;
  that._windCtx = null;
  that._wearCanvasScaledWidth = 0;
  that._wearCanvasScaledHeight = 0;
  that._wearCanvas = null;
  that._wearCtx = null;
  
  function init() {
    sio.on('rendered', (datum) => {
      onRendered(datum);
    });
    that._masterCanvas = $masterCanvas[0];
    that._masterCtx = that._masterCanvas.getContext('2d');  
    that._masterCanvas.width = masterPixelCount;
    that._masterCanvas.height = 1;
    that._composeCanvas = $composeCanvas[0];
    that._composeCtx = that._composeCanvas.getContext('2d');  
    that._composeCanvas.width = composePixelCount;
    that._composeCanvas.height = 1;
    that._windCanvas = $windCanvas[0];
    that._windCtx = that._windCanvas.getContext('2d');  
    that._windCanvas.width = windPixelCount;
    that._windCanvas.height = 1;
    that._wearCanvas = $wearCanvas[0];
    that._wearCtx = that._wearCanvas.getContext('2d');  
    that._wearCanvas.width = wearPixelCount;
    that._wearCanvas.height = 1;

    $(window).on('resize', () => {
      updateCanvasScaledSize();
    });
    updateCanvasScaledSize();
    $analogA.on('input', () => {
      sio.emit('analogA', $analogA.val());  
    })
    sio.emit('analogA', $analogA.val());
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
    that._windCanvasScaledWidth = $windCanvas.width();
    that._windCanvasScaledHeight = $windCanvas.height();
    that._wearCanvasScaledWidth = $wearCanvas.width();
    that._wearCanvasScaledHeight = $wearCanvas.height();
  }

  function onRendered({master, compose, wind, wear}) {
    updateMasterCanvas(master);
    updateComposeCanvas(compose);
    updateWindCanvas(wind);
    updateWearCanvas(wear);
    stat();
  }
  function updateStat() {
    $stat.html(`fps: ${that._stat.avgFps.toFixed(1)}</br> total: ${that._stat.count}`);
  }
  function updateMasterCanvas(renderedData) {
    updateGenericCanvas(that._masterCtx, masterPixelCount, renderedData);
  }
  function updateComposeCanvas(renderedData) {
    updateGenericCanvas(that._composeCtx, composePixelCount, renderedData);
  }
  function updateWindCanvas(renderedData) {
    updateGenericCanvas(that._windCtx, windPixelCount, renderedData);
  }
  function updateWearCanvas(renderedData) {
    updateGenericCanvas(that._wearCtx, wearPixelCount, renderedData);
  }
  function updateGenericCanvas(ctx, pixelcount, renderedData) {
    let imd = ctx.createImageData(pixelcount, 1);
    let d  = imd.data;                       
    for (let i = 0; i < pixelcount; i++) {
      d[i * 4 + 0] = renderedData[i].r;
      d[i * 4 + 1] = renderedData[i].g;
      d[i * 4 + 2] = renderedData[i].b;
      d[i * 4 + 3] = 255; //alpha
    }
    ctx.putImageData(imd, 0, 0 );  
  }
init();
}

let $masterCanvas = $('.ledsim-master-canvas'); 
let $composeCanvas = $('.ledsim-compose-canvas'); 
let $windCanvas = $('.ledsim-wind-canvas'); 
let $wearCanvas = $('.ledsim-wear-canvas'); 
let $analogA = $('.ledsim-analog-a'); 

let $stat = $('.ledsim-stat');
let ledsim = new Ledsim(sio, $masterCanvas, $composeCanvas, $windCanvas, $wearCanvas, $stat, $analogA);