'use strict';
// ES6
import Limiter from './limiter.js';
import ParticedRenderer from './particedRenderer';
import Helper from './helper.js';
import Dyna from './modules/dyna.js';

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
  static get _defaultRuntimeOptions() {
    return Object.assign({}, super._defaultRuntimeOptions, {
      beatPerLoop: 8,  // AbstractIterativeRenderer based
      flowBoomVel: 1500,
      pumpMaxPower: 10,
      bpm: 175 / 2,  // AbstractIterativeRenderer based
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
      dyna: new Dyna({renderer: this, coreconfigKey: this._initialOptions.coreconfigKey})
    }
  }
  /* expend */ _onKernelReset() {
    super._onKernelReset();
  }

  /* extend */ _onKernelMomento() {
    super._onKernelMomento();
  }
  /* declare */ _onKernelLive() {
    //super._onKernelLive();

    this._dimAndPumpFlow();
    
    this._liveParticHeroes();
    this._drawOnFlowParticHeroes();

    //this._liveAndDrawOnFlowExplodes();
  }
  /* declare */ _onKernelDraw() {
    //super._onKernelDraw();

    this._fillMasterBlack();
    this._drawOnMasterParticHeroes();
    //this._fillMasterRandom();
  }
  /* declare */ _onKernelPostdraw() {
    //super._onKernelPostdraw();

    this._masterToCompose();
    //this._fillComposeDebug();
    this._drawOnComposeDigitalStrobe();  
    this._composeToIngear();
    this._processComposeWithIngear();

    //
    this._kernelPostdrawUpdateOutputBuffer();
    this._kernelPostdrawOutputBuffer();
    this._kernelPostdrawEmitOutputBuffer();
  }

  _kernelPostdrawUpdateOutputBuffer() {
    this._updateOutputBuffer();
  }
  _kernelPostdrawOutputBuffer() {
    this._processLimiter();
  }
  _kernelPostdrawEmitOutputBuffer() {
    this._emitOutputBuffer();    
  }

  _processLimiter() {
    let outputBufferputCompose = this._ring.outputBuffer.compose;
    this._limiter.bypass = !this._input.switchB.value;  
    this._limiter.process(outputBufferputCompose, this._momento.dt, outputBufferputCompose, {from: 0, to: 255});
  }
  _dimAndPumpFlow() {
    let dimFlowRatio = Math.pow(0.5, this._momento.dt);
    let pumpPower = (this._input.analogF.value - 0.5) * this._runtimeOptions.pumpMaxPower;
    for (let i = 0; i < this._initialOptions.masterPixelCount; i++) {
      // dim
      this._ring.ph.flow[i] *= dimFlowRatio;
      
      // pump
      this._ring.ph.flow[i] += (1 - dimFlowRatio) * pumpPower * this._initialOptions.masterPixelCount
    }
      
  }


  _liveParticHeroes() {
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      let vel = this._momento.loopstampVel * this._initialOptions.masterPixelCount;      
      let pos = this._momento.loopstampPos * this._initialOptions.masterPixelCount;
      
      vel += (0.5 - this._input.analogD.value) * (this._momento.squeazeBeatstampVel - this._momento.beatstampVel) * this._initialOptions.masterPixelCount;      
      pos += (0.5 - this._input.analogD.value) * (this._momento.squeazeBeatstampPos - this._momento.beatstampPos) * this._initialOptions.masterPixelCount;
     
      vel += this._momento.turnstampVel * this._initialOptions.masterPixelCount;      
      pos += this._momento.turnstampPos * this._initialOptions.masterPixelCount;


      pos = safemod(pos, this._initialOptions.masterPixelCount);
      
      this._partic.heroes[i * 6 + 1] = pos;
      this._partic.heroes[i * 6 + 2] = vel;
    }
  }
  
  // _liveAndDrawOnFlowExplodes() {
  //   let nowFatInt = Math.floor(this._momento.loopstampPos * this._initialOptions.particFatsMaxCount);
  //   let prevFatInt = Math.floor(this._momento.previousExplodeToParticHeroesloopstamp * this._initialOptions.particFatsMaxCount);
  //   if (nowFatInt != prevFatInt) {
  //     this._explodeFlow(nowFatInt);
  //   }
  //   this._momento.previousExplodeToParticHeroesloopstamp = this._momento.loopstampPos; 
  // }
    
  // _explodeFlow(fatIndex) {
  //   let explodedFatPos = this._partic.fats[fatIndex * 6 + 1];
    
  //   for (let i = 0; i <= this._initialOptions.masterPixelCount; i++) {
  //     let flow = this._ring.ph.flow[i];
  //     let diffRatio = (explodedFatPos - i) / this._initialOptions.masterPixelCount; 
  //     let flowExplodeRatio = ((diffRatio % 1) + 1) % 1 - 0.5;
  //     flow += flowExplodeRatio * this._runtimeOptions.flowBoomVel;
  //     this._ring.ph.flow[i] = flow;
  //   }
  // }  


  _drawOnMasterParticHeroes() {
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      let pos = this._partic.heroes[i * 6 + 1];
      let r = this._partic.heroes[i * 6 + 3];
      let g = this._partic.heroes[i * 6 + 4];
      let b = this._partic.heroes[i * 6 + 5];

      let halfSize = 12; // TODO: masterPixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        this._ring.g.master[ii * 3 + 0] += r * 3.0;
        this._ring.g.master[ii * 3 + 1] += g * 3.0;
        this._ring.g.master[ii * 3 + 2] += b * 3.0;  
      }
    }
  }  

  _drawOnFlowParticHeroes() {
    let dimFlowRatio = Math.pow(0.5, this._momento.dt);
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      let pos = this._partic.heroes[i * 6 + 1];
      let vel = this._partic.heroes[i * 6 + 2];
      let halfSize = 12; // TODO: masterPixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        let flow = this._ring.ph.flow[ii];
        flow = (vel - flow) * dimFlowRatio;
        this._ring.ph.flow[ii] = flow;
      }
    }
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