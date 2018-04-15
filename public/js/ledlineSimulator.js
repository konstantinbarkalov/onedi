'use strict';
const coreconfig = require('./coreconfig.json');
const masterPixelCount = coreconfig.render.master.pixelCount;
const composePixelCount = coreconfig.render.composes.ledlineA.pixelCount;
const windPixelCount = masterPixelCount;
const ingearPixelCount = composePixelCount;
const heatPixelCount = composePixelCount;

let config = {
  runStampsCount: 100,
}

function LedlineSimulator({databus, $container}) {
  const that = this;

  let $masterCanvas = $('<canvas></canvas>').addClass('ledline-simulator-master-canvas'); 
  $container.append($masterCanvas);
  let $composeCanvas = $('<canvas></canvas>').addClass('ledline-simulator-compose-canvas'); 
  $container.append($composeCanvas);
  let $windCanvas = $('<canvas></canvas>').addClass('ledline-simulator-wind-canvas'); 
  $container.append($windCanvas);
  let $ingearCanvas = $('<canvas></canvas>').addClass('ledline-simulator-ingear-canvas'); 
  $container.append($ingearCanvas);
  let $heatCanvas = $('<canvas></canvas>').addClass('ledline-simulator-heat-canvas'); 
  $container.append($heatCanvas);
  let $stat = $('<canvas></canvas>').addClass('ledline-simulator-stat');
  $container.append($stat);
  
  that._isDebugShown = false;
  let $debugSwitch = $('<input type="checkbox"></input>').addClass('ledline-simulator-debug-switch');
  $container.append($stat);

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
  that._ingearCanvasScaledWidth = 0;
  that._ingearCanvasScaledHeight = 0;
  that._ingearCanvas = null;
  that._ingearCtx = null;
  
  function init() {
    databus.on('rendered', (datum) => {
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
    that._ingearCanvas = $ingearCanvas[0];
    that._ingearCtx = that._ingearCanvas.getContext('2d');  
    that._ingearCanvas.width = ingearPixelCount;
    that._ingearCanvas.height = 1;
    that._heatCanvas = $heatCanvas[0];
    that._heatCtx = that._heatCanvas.getContext('2d');  
    that._heatCanvas.width = heatPixelCount;
    that._heatCanvas.height = 1;

    $(window).on('resize', () => {
      updateCanvasScaledSize();
    });
    updateCanvasScaledSize();
  }
  that._stat = {
    count: 0,
    runStamps: new Array(config.runStampsCount),
    avgFps: 0,
    image: {
      master: null,
      compose: null,
      wind: null,
      ingear: null,
      heat: null,
    },
  }
  function stat({master, compose, wind, ingear, heat}) {
    statGenericImage('master', masterPixelCount, master);
    statGenericImage('compose', composePixelCount, compose);
    statGenericImage('wind', windPixelCount, wind);
    statGenericImage('ingear', ingearPixelCount, ingear);
    statGenericImage('heat', heatPixelCount, heat);
    statFps();
    updateStat();
  }
  function statGenericImage(statName, pixelCount, renderedData) {
    let median = {
      r: 0,
      g: 0,
      b: 0,
      s: 0,
    }
    for (let i = 0; i < pixelCount; i++) {
      median.r += renderedData[i * 3 + 0] || 0; //TODO: remove '|| 0' after bad input NAN fix
      median.g += renderedData[i * 3 + 1] || 0;
      median.b += renderedData[i * 3 + 2] || 0;
    }
    median.r /= pixelCount;
    median.g /= pixelCount;
    median.b /= pixelCount;
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
    that._ingearCanvasScaledWidth = $ingearCanvas.width();
    that._ingearCanvasScaledHeight = $ingearCanvas.height();
    that._heatCanvasScaledWidth = $heatCanvas.width();
    that._heatCanvasScaledHeight = $heatCanvas.height();
  }

  function onRendered({master, compose, wind, ingear, heat}) {
    updateGenericCanvas(that._masterCtx, masterPixelCount, master);
    updateGenericCanvas(that._composeCtx, composePixelCount, compose);
    updateGenericCanvas(that._windCtx, windPixelCount, wind);
    updateGenericCanvas(that._ingearCtx, ingearPixelCount, ingear);
    updateGenericCanvas(that._heatCtx, heatPixelCount, heat);
    stat({master, compose, wind, ingear, heat});
  }
  function updateStat() {
    let html = '';
    html += `fps: ${that._stat.avgFps.toFixed(1)}</br> `;
    html += `total: ${that._stat.count}</br> `;
    html += `master.median: ${that._stat.image.master.median.s.toFixed(1)} (r${that._stat.image.master.median.r.toFixed(1)} g${that._stat.image.master.median.g.toFixed(1)} b${that._stat.image.master.median.b.toFixed(1)})</br> `;
    html += `compose.median: ${that._stat.image.compose.median.s.toFixed(1)} (r${that._stat.image.compose.median.r.toFixed(1)} g${that._stat.image.compose.median.g.toFixed(1)} b${that._stat.image.compose.median.b.toFixed(1)})</br> `;
    html += `wind.median: ${that._stat.image.wind.median.s.toFixed(1)} (r${that._stat.image.wind.median.r.toFixed(1)} g${that._stat.image.wind.median.g.toFixed(1)} b${that._stat.image.wind.median.b.toFixed(1)})</br> `;
    html += `ingear.median: ${that._stat.image.ingear.median.s.toFixed(1)} (r${that._stat.image.ingear.median.r.toFixed(1)} g${that._stat.image.ingear.median.g.toFixed(1)} b${that._stat.image.ingear.median.b.toFixed(1)})</br> `;
    html += `heat.median: ${that._stat.image.heat.median.s.toFixed(1)} (r${that._stat.image.heat.median.r.toFixed(1)} g${that._stat.image.heat.median.g.toFixed(1)} b${that._stat.image.heat.median.b.toFixed(1)})</br> `;

    $stat.html(html);
  }
  
  function updateGenericCanvas(ctx, pixelCount, renderedData) {
    let imd = ctx.createImageData(pixelCount, 1);
    let d  = imd.data;                       
    for (let i = 0; i < pixelCount; i++) {
      d[i * 4 + 0] = renderedData[i * 3 + 0];
      d[i * 4 + 1] = renderedData[i * 3 + 1];
      d[i * 4 + 2] = renderedData[i * 3 + 2];
      d[i * 4 + 3] = 255; //alpha
    }
    ctx.putImageData(imd, 0, 0 );  
  }
init();
}
export default LedlineSimulator;