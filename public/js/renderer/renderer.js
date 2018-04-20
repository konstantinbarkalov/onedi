'use strict';
// ES6
import Limiter from './limiter.js';
import ParticedRenderer from './layers/particedRenderer';
import Helper from './helper.js';

import Dyna from './modules/dyna.js';
import Fat from './modules/fat.js';
import Hero from './modules/hero.js';
import Flow from './modules/flow.js';

let safemod = Helper.safemod;
class Renderer extends ParticedRenderer {
  static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
      ionica: null,
      particHeroesMaxCount: 1, // RingedRenderer based
      fps: 60,  // AbstractIterativeRenderer based
      iterationSteps: [
        ...super._defaultInitialOptions.iterationSteps,
        'live', 'draw', 'postdraw', 'final'
      ],
    });
  }
  
  static _getCoreconfigInitialOptions(coreconfig, coreconfigKey) {
    return Object.assign({}, super._getCoreconfigInitialOptions(coreconfig, coreconfigKey), {
      masterPixelCount: coreconfig.render.master.pixelCount,  // RingedRenderer based
      composePixelCount: coreconfig.render.composes[coreconfigKey].pixelCount,  // RingedRenderer based
    });
  }

  _construct() {
    if (!this._initialOptions.ionica) {
      throw new Error('Instance of ionica is required for renderer to work');
    }
    super._construct();
    this._input = this._initialOptions.ionica._input;

    //TODO limiter as a module
    this._limiter = new Limiter({coreconfigKey: this._runtimeOptions.coreconfigKey});
    
    this.modules = {
      dyna: new Dyna({renderer: this, coreconfigKey: this._initialOptions.coreconfigKey}),
      fat: new Fat({renderer: this, coreconfigKey: this._initialOptions.coreconfigKey}),
      hero: new Hero({renderer: this, coreconfigKey: this._initialOptions.coreconfigKey}),
      flow: new Flow({renderer: this}),
    }
  }


  /* declare */ _onKernelDraw() {
    //super._onKernelDraw();

    this._fillMasterBlack();

    //this._fillMasterRandom();
  }
  /* declare */ _onKernelPostdraw() {
    //super._onKernelPostdraw();

    this._masterToCompose();
    //this._fillComposeDebug();
    this._drawOnComposeDigitalStrobe();  
    this._composeToIngear();
    this._processComposeWithIngear();
  }
  /* declare */ _onKernelFinal() {
    //super._onKernelPostdraw();

    //
    this._finalUpdateOutputBuffer();
  }

  _finalUpdateOutputBuffer() {
    this._updateOutputBuffer();
    this._processLimiter();
    this._emitOutputBuffer();    
  }

  _processLimiter() {
    let outputBufferputCompose = this._ring.outputBuffer.compose;
    this._limiter.bypass = !this._input.switchB.value;  
    this._limiter.process(outputBufferputCompose, this._momento.dt, outputBufferputCompose, {from: 0, to: 255});
  }



  _masterToCompose() {
    let rescaleRate = this._initialOptions.masterPixelCount / this._initialOptions.composePixelCount;
    
    let blurFactor = 1;
    blurFactor += 12 * this._input.analogG.value;
    blurFactor += 12 * this._input.momentaryA.value;
    if (this._input.momentaryB.value) {
      let zigScratchstampPos = this._momento.beatstampPos;
      let zigScratchRatio = Math.abs(zigScratchstampPos - 0.5) * 2;
      //console.log('zsr', zigScratchRatio);
      //blurFactor += 12 * Math.pow(10, zigScratchRatio);
    }

    for (let i = 0; i < this._initialOptions.composePixelCount; i++) {
      let masterPos = i * rescaleRate;
 
      let masterHalfSize = rescaleRate * blurFactor; // dat BLURRNESS
      let intMasterPosFrom = Math.floor(masterPos - masterHalfSize);
      let intMasterPosTo = Math.floor(masterPos + masterHalfSize);
      this._ring.g.compose[i * 3 + 0] = 0;
      this._ring.g.compose[i * 3 + 1] = 0;
      this._ring.g.compose[i * 3 + 2] = 0;
      for (let ii = intMasterPosFrom; ii <= intMasterPosTo; ii++) {
        let iim = (((ii % this._initialOptions.masterPixelCount) + this._initialOptions.masterPixelCount) % this._initialOptions.masterPixelCount);
        this._ring.g.compose[i * 3 + 0] += this._ring.g.master[iim * 3 + 0];
        this._ring.g.compose[i * 3 + 1] += this._ring.g.master[iim * 3 + 1];
        this._ring.g.compose[i * 3 + 2] += this._ring.g.master[iim * 3 + 2];
      }
      this._ring.g.compose[i * 3 + 0] /= masterHalfSize * 2;
      this._ring.g.compose[i * 3 + 1] /= masterHalfSize * 2;
      this._ring.g.compose[i * 3 + 2] /= masterHalfSize * 2;
      
      //this._ring.g.compose[i * 3 + 0] = Math.pow(10 * this._ring.g.compose[i * 3 + 0], 10);
      //this._ring.g.compose[i * 3 + 1] = Math.pow(10 * this._ring.g.compose[i * 3 + 1], 10);
      //this._ring.g.compose[i * 3 + 2] = Math.pow(10 * this._ring.g.compose[i * 3 + 2], 10); 
      
      //this._ring.g.compose[i * 3 + 0] = Math.pow(this._ring.g.compose[i * 3 + 0], 3);
      //this._ring.g.compose[i * 3 + 1] = Math.pow(this._ring.g.compose[i * 3 + 1], 3);
      //this._ring.g.compose[i * 3 + 2] = Math.pow(this._ring.g.compose[i * 3 + 2], 3); 
      


      //this._ring.g.compose[i * 3 + 0] = Math.log(1 + 100 * this._ring.g.compose[i * 3 + 0]) / 5;
      //this._ring.g.compose[i * 3 + 1] = Math.log(1 + 100 * this._ring.g.compose[i * 3 + 1]) / 5;
      //this._ring.g.compose[i * 3 + 2] = Math.log(1 + 100 * this._ring.g.compose[i * 3 + 2]) / 5;

     
      let ratio = this._input.analogB.value;
      let exp = (0.5 - ratio) * 2;
      if (this._input.switchC.value) {
      let gamma = Math.pow(Math.E, exp);
        this._ring.g.compose[i * 3 + 0] = Math.pow(Math.max(0, this._ring.g.compose[i * 3 + 0]), gamma);
        this._ring.g.compose[i * 3 + 1] = Math.pow(Math.max(0, this._ring.g.compose[i * 3 + 1]), gamma);
        this._ring.g.compose[i * 3 + 2] = Math.pow(Math.max(0, this._ring.g.compose[i * 3 + 2]), gamma); 
      }
      ///// 

      
      let med = this._ring.g.compose[i * 3 + 0] + this._ring.g.compose[i * 3 + 1] + this._ring.g.compose[i * 3 + 2];
      med /= 3;
      this._ring.g.compose[i * 3 + 0] -= med;
      this._ring.g.compose[i * 3 + 1] -= med;
      this._ring.g.compose[i * 3 + 2] -= med;
    
      this._ring.g.compose[i * 3 + 0] *= 1 + 2 * ratio;
      this._ring.g.compose[i * 3 + 1] *= 1 + 2 * ratio;
      this._ring.g.compose[i * 3 + 2] *= 1 + 2 * ratio;
    
      this._ring.g.compose[i * 3 + 0] += med / (1 + 1 * ratio);
      this._ring.g.compose[i * 3 + 1] += med / (1 + 1 * ratio);
      this._ring.g.compose[i * 3 + 2] += med / (1 + 1 * ratio);
      /////
      if (this._input.switchD.value) {
        this._ring.g.compose[i * 3 + 0] -= 0.2;
        this._ring.g.compose[i * 3 + 1] -= 0.2;
        this._ring.g.compose[i * 3 + 2] -= 0.2; 
        this._ring.g.compose[i * 3 + 0] *= 2;
        this._ring.g.compose[i * 3 + 1] *= 2;
        this._ring.g.compose[i * 3 + 2] *= 2; 
      }
    

    }
  }
  _drawOnComposeDigitalStrobe() {
    let partsCount = 2;
    if (this._input.momentaryD.value) {
      let strobestamp = this._momento.beatstampPos * 4 % 1;
      let strobeValue = (strobestamp > 0.5) ? 1 : -1;
      let strobeLoopstampPos = (this._momento.loopstampPos * 4) % 1;
      let strobingPartId = Math.floor(strobeLoopstampPos * partsCount);
      for (let i = 0; i < this._initialOptions.composePixelCount; i++) {
        let partId = Math.floor(i / this._initialOptions.composePixelCount * partsCount); 
        if (partId === strobingPartId) {
          // glow
          this._ring.g.compose[i * 3 + 0] += strobeValue * 2;
          this._ring.g.compose[i * 3 + 1] += strobeValue * 2;
          this._ring.g.compose[i * 3 + 2] += strobeValue * 2;  
        } else {
          // dim
          this._ring.g.compose[i * 3 + 0] += strobeValue * 2 - 2;
          this._ring.g.compose[i * 3 + 1] += strobeValue * 2 - 2;
          this._ring.g.compose[i * 3 + 2] += strobeValue * 2 - 2;  
            
        }
      }
    }
  }  

  _composeToIngear() {
    let chillingRatio = Math.pow(0.5, this._momento.dt / 10);
    let gainingRatio = 1 - chillingRatio;

    for (let i = 0; i < this._initialOptions.composePixelCount; i++) {
      this._ring.g.ingear[i * 3 + 0] = 0;
      this._ring.g.ingear[i * 3 + 1] = 0;
      this._ring.g.ingear[i * 3 + 2] = 0;
    
      let halfSize = 32;
      let intPosFrom = Math.floor(i - halfSize);
      let intPosTo = Math.floor(i + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        let iim = (((ii % this._initialOptions.composePixelCount) + this._initialOptions.composePixelCount) % this._initialOptions.composePixelCount);
        this._ring.g.ingear[i * 3 + 0] += this._ring.g.compose[iim * 3 + 0];
        this._ring.g.ingear[i * 3 + 1] += this._ring.g.compose[iim * 3 + 1];
        this._ring.g.ingear[i * 3 + 2] += this._ring.g.compose[iim * 3 + 2];  
      }
      this._ring.g.ingear[i * 3 + 0] /= halfSize * 2;
      this._ring.g.ingear[i * 3 + 1] /= halfSize * 2;
      this._ring.g.ingear[i * 3 + 2] /= halfSize * 2;

    }
  }
  _processComposeWithIngear() {
    //let sharpenRatio = Math.max(0,Math.min(1,this._input.analogH.value));
    let sharpenRatio = this._input.analogH.value;

    for (let i = 0; i < this._initialOptions.composePixelCount; i++) {
      this._ring.g.compose[i * 3 + 0] -= this._ring.g.ingear[i * 3 + 0] * sharpenRatio;
      this._ring.g.compose[i * 3 + 1] -= this._ring.g.ingear[i * 3 + 1] * sharpenRatio;
      this._ring.g.compose[i * 3 + 2] -= this._ring.g.ingear[i * 3 + 2] * sharpenRatio;
      this._ring.g.compose[i * 3 + 0] *= 1 + 1 * sharpenRatio;
      this._ring.g.compose[i * 3 + 1] *= 1 + 1 * sharpenRatio;
      this._ring.g.compose[i * 3 + 2] *= 1 + 1 * sharpenRatio;  
    }

  }
  _updateOutputBuffer() {
    for (let i = 0; i < this._initialOptions.masterPixelCount; i++) {
      this._ring.outputBuffer.master[i * 3 + 0] = Math.min(255, Math.max(0, Math.floor(this._ring.g.master[i * 3 + 0] * 256)));
      this._ring.outputBuffer.master[i * 3 + 1] = Math.min(255, Math.max(0, Math.floor(this._ring.g.master[i * 3 + 1] * 256)));
      this._ring.outputBuffer.master[i * 3 + 2] = Math.min(255, Math.max(0, Math.floor(this._ring.g.master[i * 3 + 2] * 256)));
    }

    for (let i = 0; i < this._initialOptions.composePixelCount; i++) {
      this._ring.outputBuffer.compose[i * 3 + 0] = Math.min(255, Math.max(0, Math.floor(this._ring.g.compose[i * 3 + 0] * 256)));
      this._ring.outputBuffer.compose[i * 3 + 1] = Math.min(255, Math.max(0, Math.floor(this._ring.g.compose[i * 3 + 1] * 256)));
      this._ring.outputBuffer.compose[i * 3 + 2] = Math.min(255, Math.max(0, Math.floor(this._ring.g.compose[i * 3 + 2] * 256)));
    }
    
    for (let i = 0; i < this._initialOptions.masterPixelCount; i++) {
      this._ring.outputBuffer.flow[i * 3 + 0] = Math.min(255, Math.max(0, Math.floor(         this._ring.ph.flow[i] / 1000 * 256)));
      this._ring.outputBuffer.flow[i * 3 + 1] = Math.min(255, Math.max(0, Math.floor(     1 - this._ring.ph.flow[i] / 1000  * 256)));
      this._ring.outputBuffer.flow[i * 3 + 2] = Math.min(255, Math.max(0, Math.floor(Math.abs(this._ring.ph.flow[i]) / 1000  * 256)));
    }

    for (let i = 0; i < this._initialOptions.composePixelCount; i++) { 
      this._ring.outputBuffer.ingear[i * 3 + 0] = Math.min(255, Math.max(0, Math.floor(this._ring.g.ingear[i * 3 + 0] * 256)));
      this._ring.outputBuffer.ingear[i * 3 + 1] = Math.min(255, Math.max(0, Math.floor(this._ring.g.ingear[i * 3 + 1] * 256)));
      this._ring.outputBuffer.ingear[i * 3 + 2] = Math.min(255, Math.max(0, Math.floor(this._ring.g.ingear[i * 3 + 2] * 256)));
    }
    
    for (let i = 0; i < this._initialOptions.composePixelCount; i++) { 
      this._ring.outputBuffer.heat[i * 3 + 0] = Math.min(255, Math.max(0, Math.floor(this._limiter._heatRing[i * 3 + 0] * 256)));
      this._ring.outputBuffer.heat[i * 3 + 1] = Math.min(255, Math.max(0, Math.floor(this._limiter._heatRing[i * 3 + 1] * 256)));
      this._ring.outputBuffer.heat[i * 3 + 2] = Math.min(255, Math.max(0, Math.floor(this._limiter._heatRing[i * 3 + 2] * 256)));
    }
  }
  _emitOutputBuffer() {
    let rendered = {
      master: this._ring.outputBuffer.master,
      compose: this._ring.outputBuffer.compose,
      flow: this._ring.outputBuffer.flow,
      ingear: this._ring.outputBuffer.ingear,
      heat: this._ring.outputBuffer.heat
    };
    this._runtimeOptions.databus.emit('rendered', rendered);
  }
}

export default Renderer;