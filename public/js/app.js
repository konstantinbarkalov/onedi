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
function Ledsim(sio, $masterCanvas, $composeCanvas, $windCanvas, $wearCanvas, $stat, $analogA, $switchA) {
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
    $switchA.on('input', () => {
      sio.emit('switchA', $switchA.val());  
    })
    sio.emit('switchA', $switchA.val());
  }
  that._stat = {
    count: 0,
    runStamps: new Array(config.runStampsCount),
    avgFps: 0,
    image: {
      master: null,
      compose: null,
      wind: null,
      wear: null,
    },
  }
  function stat({master, compose, wind, wear}) {
    statGenericImage('master', masterPixelCount, master);
    statGenericImage('compose', composePixelCount, compose);
    statGenericImage('wind', windPixelCount, wind);
    statGenericImage('wear', wearPixelCount, wear);
    statFps();
    updateStat();
  }
  function statGenericImage(statName, pixelCount, renderedData) {
    let median = {
      r: 0,
      g: 0,
      b: 0,
      s: 0,
      a: 0,
    }
    for (let i = 0; i < pixelCount; i++) {
      median.r += renderedData[i].r || 0; //TODO: remove '|| 0' after bad input NAN fix
      median.g += renderedData[i].g || 0;
      median.b += renderedData[i].b || 0;
      median.a += renderedData[i].a || 0;
    }
    median.r /= pixelCount;
    median.g /= pixelCount;
    median.b /= pixelCount;
    median.a /= pixelCount;
    median.s = median.r + median.g + median.b;
    median.s /= 3;
    that._stat.image[statName] = {
      median: median,
    }
  }
  function statFps() {
    that._stat.count++;
    that._stat.runStamps.pop();
    that._stat.runStamps.unshift(Date.now());
    let filledStampsCount = Math.min(config.runStampsCount, that._stat.count);
    if (filledStampsCount >= 2) {
      let avgDelta = (that._stat.runStamps[0] - that._stat.runStamps[filledStampsCount - 1]) / (filledStampsCount - 1);
      that._stat.avgFps = 1000 / avgDelta;
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
    updateGenericCanvas(that._masterCtx, masterPixelCount, master);
    updateGenericCanvas(that._composeCtx, composePixelCount, compose);
    updateGenericCanvas(that._windCtx, windPixelCount, wind);
    updateGenericCanvas(that._wearCtx, wearPixelCount, wear);
    stat({master, compose, wind, wear});
  }
  function updateStat() {
    let html = '';
    html += `fps: ${that._stat.avgFps.toFixed(1)}</br> `;
    html += `total: ${that._stat.count}</br> `;
    html += `master.median: ${that._stat.image.master.median.s.toFixed(1)} (r${that._stat.image.master.median.r.toFixed(1)} g${that._stat.image.master.median.g.toFixed(1)} b${that._stat.image.master.median.b.toFixed(1)})</br> `;
    html += `compose.median: ${that._stat.image.compose.median.s.toFixed(1)} (r${that._stat.image.compose.median.r.toFixed(1)} g${that._stat.image.compose.median.g.toFixed(1)} b${that._stat.image.compose.median.b.toFixed(1)})</br> `;
    html += `wind.median: ${that._stat.image.wind.median.s.toFixed(1)} (r${that._stat.image.wind.median.r.toFixed(1)} g${that._stat.image.wind.median.g.toFixed(1)} b${that._stat.image.wind.median.b.toFixed(1)})</br> `;
    html += `wear.median: ${that._stat.image.wear.median.s.toFixed(1)} (r${that._stat.image.wear.median.r.toFixed(1)} g${that._stat.image.wear.median.g.toFixed(1)} b${that._stat.image.wear.median.b.toFixed(1)})</br> `;

    $stat.html(html);
  }
  
  function updateGenericCanvas(ctx, pixelCount, renderedData) {
    let imd = ctx.createImageData(pixelCount, 1);
    let d  = imd.data;                       
    for (let i = 0; i < pixelCount; i++) {
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
let $switchA = $('.ledsim-switch-a'); 

let $stat = $('.ledsim-stat');
let ledsim = new Ledsim(sio, $masterCanvas, $composeCanvas, $windCanvas, $wearCanvas, $stat, $analogA, $switchA);