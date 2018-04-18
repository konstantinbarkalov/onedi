'use strict';
// ES6
import Limiter from './limiter.js';
import RingedRenderer from './ringedRenderer.js';
import Helper from './helper.js';

let safemod = Helper.safemod;
class Renderer extends RingedRenderer {
  static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
      ionica: null,
      particDynasMaxCount: 2048,
      particFatsMaxCount: 8,
      particHeroesMaxCount: 1,
      fps: 60,  // AbstractIterativeRenderer based
    });
  }
  static get _defaultRuntimeOptions() {
    return Object.assign({}, super._defaultRuntimeOptions, {
      beatPerLoop: 8,  // AbstractIterativeRenderer based
      particDynasBoomCount: 512,
      particDynasBoomVel: 1500,
      flowBoomVel: 1500,
      particDynasAverageTtl: 10,
      particDynasBurnTtl: 5,
      particDynasBaseBrightness: 0.0,
      burnBornMultiplier: 10,
      burnDieMultiplier: 1 / 10,
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
 
    this._partic = {
      dynas: new Float32Array(this._initialOptions.particDynasMaxCount * 8),
      fats: new Float32Array(this._initialOptions.particFatsMaxCount * 6),
      heroes: new Float32Array(this._initialOptions.particHeroesMaxCount * 6),
    }

    this._limiter = new Limiter({coreconfigKey: this._runtimeOptions.coreconfigKey});
    
  }

  _reset() {
    super._reset();
    this._resetPartic();
  }
  _resetPartic() {
    this._fillParticDynasRandom();
    this._fillParticFatsRandom();
    this._fillParticHeroesRandom();
  }

  _iteration() {
    super._iteration();
    this._iterationPhisic();
    this._iterationGraphic();
    this._iterationUpdateOutputBuffer();
    this._iterationPostprocessOutputBuffer();
    this._iterationEmitOutputBuffer();
  }
  _iterationPhisic() {
    this._dimAndPumpFlow();
    this._liveParticFats();
    this._drawOnFlowParticFats();
    
    this._liveParticHeroes();
    this._drawOnFlowParticHeroes();

    this._liveAndDrawOnFlowExlodes();
    this._liveParticDynas();    
  }
  _iterationGraphic() {
    this._fillMasterBlack();
    this._drawOnMasterParticDynas();
    this._drawOnMasterParticFats();
    this._drawOnMasterParticHeroes();
    //this._fillMasterRandom();
    this._masterToCompose();
    //this._fillComposeDebug();
    this._drawOnComposeDigitalStrobe();  
    this._composeToIngear();
    this._processComposeWithIngear();
  }
  _iterationUpdateOutputBuffer() {
    this._updateOutputBuffer();
  }
  _iterationPostprocessOutputBuffer() {
    this._processLimiter();
  }
  _iterationEmitOutputBuffer() {
    this._emitOutputBuffer();    
  }

  _processLimiter() {
    let outputBufferputCompose = this._ring.outputBuffer.compose;
    this._limiter.bypass = !this._input.switchB.value;  
    this._limiter.process(outputBufferputCompose, this._iter.dt, outputBufferputCompose, {from: 0, to: 255});
  }
  _dimAndPumpFlow() {
    let dimFlowRatio = Math.pow(0.5, this._iter.dt);
    let pumpPower = (this._input.analogF.value - 0.5) * this._runtimeOptions.pumpMaxPower;
    for (let i = 0; i < this._initialOptions.masterPixelCount; i++) {
      // dim
      this._ring.ph.flow[i] *= dimFlowRatio;
      
      // pump
      this._ring.ph.flow[i] += (1 - dimFlowRatio) * pumpPower * this._initialOptions.masterPixelCount
    }
      
  }

  _fillParticDynasRandom() {
    for (let i = 0; i < this._initialOptions.particDynasMaxCount; i++) {
      this._partic.dynas[i * 8 + 0] = Math.random() * this._runtimeOptions.particDynasAverageTtl * 2;
      this._partic.dynas[i * 8 + 1] = Math.random() * this._initialOptions.masterPixelCount;
      this._partic.dynas[i * 8 + 2] = Math.random() - 0.5;
      this._partic.dynas[i * 8 + 3] = Math.random();
      this._partic.dynas[i * 8 + 4] = Math.random();
      this._partic.dynas[i * 8 + 5] = Math.random();
      this._partic.dynas[i * 8 + 6] = 0; // burnTtl
      this._partic.dynas[i * 8 + 7] = Math.random(); // entropy
    }
  }
  _fillParticFatsRandom() {
    for (let i = 0; i < this._initialOptions.particFatsMaxCount; i++) {
      this._partic.fats[i * 6 + 0] = 0; //TODO drop
      this._partic.fats[i * 6 + 1] = Math.random() * this._initialOptions.masterPixelCount;
      this._partic.fats[i * 6 + 2] = (Math.random() - 0.5) * 500;
      this._partic.fats[i * 6 + 3] = Math.random();
      this._partic.fats[i * 6 + 4] = Math.random();
      this._partic.fats[i * 6 + 5] = Math.random();
    }
  }
  _fillParticHeroesRandom() {
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      this._partic.heroes[i * 6 + 0] = 0; //TODO drop
      this._partic.heroes[i * 6 + 1] = Math.random() * this._initialOptions.masterPixelCount;
      this._partic.heroes[i * 6 + 2] = (Math.random() - 0.5) * 500;
      this._partic.heroes[i * 6 + 3] = Math.random();
      this._partic.heroes[i * 6 + 4] = Math.random();
      this._partic.heroes[i * 6 + 5] = Math.random();
    }
  }

  _liveParticFats() {
    for (let i = 0; i < this._initialOptions.particFatsMaxCount; i++) {
      let ttl = (this._iter.loopstampPos) - i / this._initialOptions.particFatsMaxCount; // shift per beat
      ttl = safemod(ttl, 1);    
      let vel = this._iter.turnstampVel * this._initialOptions.masterPixelCount;      
      let pos = this._iter.turnstampPos * this._initialOptions.masterPixelCount;
       
      pos += i / this._initialOptions.particFatsMaxCount * this._initialOptions.masterPixelCount; // shift per beat
      pos = safemod(pos, this._initialOptions.masterPixelCount);
      
      this._partic.fats[i * 6 + 0] = ttl;
      this._partic.fats[i * 6 + 1] = pos;
      this._partic.fats[i * 6 + 2] = vel;
    }
  }
  _liveParticHeroes() {
    for (let i = 0; i < this._initialOptions.particHeroesMaxCount; i++) {
      let vel = this._iter.loopstampVel * this._initialOptions.masterPixelCount;      
      let pos = this._iter.loopstampPos * this._initialOptions.masterPixelCount;
      
      vel += (0.5 - this._input.analogD.value) * (this._iter.squeazeBeatstampVel - this._iter.beatstampVel) * this._initialOptions.masterPixelCount;      
      pos += (0.5 - this._input.analogD.value) * (this._iter.squeazeBeatstampPos - this._iter.beatstampPos) * this._initialOptions.masterPixelCount;
     
      vel += this._iter.turnstampVel * this._initialOptions.masterPixelCount;      
      pos += this._iter.turnstampPos * this._initialOptions.masterPixelCount;


      pos = safemod(pos, this._initialOptions.masterPixelCount);
      
      this._partic.heroes[i * 6 + 1] = pos;
      this._partic.heroes[i * 6 + 2] = vel;
    }
  }
  
  _liveAndDrawOnFlowExlodes() {
    let nowFatInt = Math.floor(this._iter.loopstampPos * this._initialOptions.particFatsMaxCount);
    let prevFatInt = Math.floor(this._iter.previousExplodeToParticDynasloopstamp * this._initialOptions.particFatsMaxCount);
    if (nowFatInt != prevFatInt) {
      this._explodeParticFat(nowFatInt);
      this._explodeFlow(nowFatInt);
    }
    this._iter.previousExplodeToParticDynasloopstamp = this._iter.loopstampPos; 
  }
  
  _explodeParticFat(fatIndex) {
    let pos = this._partic.fats[fatIndex * 6 + 1];
    let vel = this._partic.fats[fatIndex * 6 + 2];
    let r = this._partic.fats[fatIndex * 6 + 3];
    let g = this._partic.fats[fatIndex * 6 + 4];
    let b = this._partic.fats[fatIndex * 6 + 5];
    console.log('boom lp, fatIndex, rgb', this._iter.loopstampPos, fatIndex, r,g,b);
    for (let i = 0; i < this._runtimeOptions.particDynasBoomCount; i++) {
      let spawnedparticdynasindex = Math.floor(Math.random() * this._initialOptions.particDynasMaxCount)
      // todo: smart grave
      let dynaTtl = Math.random() * this._runtimeOptions.particDynasAverageTtl * 2;
      let dynaPos = pos;
      let dynaVel = vel + (Math.random() - 0.5) * this._runtimeOptions.particDynasBoomVel;
      let dynaR = r + (Math.random() - 0.5) * 0.5;
      let dynaG = g + (Math.random() - 0.5) * 0.5;
      let dynaB = b + (Math.random() - 0.5) * 0.5;
      let dynaBurnTtl = this._runtimeOptions.particDynasBurnTtl;
      
      this._partic.dynas[spawnedparticdynasindex * 8 + 0] = dynaTtl;
      this._partic.dynas[spawnedparticdynasindex * 8 + 1] = dynaPos;
      this._partic.dynas[spawnedparticdynasindex * 8 + 2] = dynaVel;
      this._partic.dynas[spawnedparticdynasindex * 8 + 3] = dynaR;
      this._partic.dynas[spawnedparticdynasindex * 8 + 4] = dynaG;
      this._partic.dynas[spawnedparticdynasindex * 8 + 5] = dynaB;
      this._partic.dynas[spawnedparticdynasindex * 8 + 6] = dynaBurnTtl;
    }
  }  
  _explodeFlow(fatIndex) {
    let explodedFatPos = this._partic.fats[fatIndex * 6 + 1];
    
    for (let i = 0; i <= this._initialOptions.masterPixelCount; i++) {
      let flow = this._ring.ph.flow[i];
      let diffRatio = (explodedFatPos - i) / this._initialOptions.masterPixelCount; 
      let flowExplodeRatio = ((diffRatio % 1) + 1) % 1 - 0.5;
      flow += flowExplodeRatio * this._runtimeOptions.flowBoomVel;
      this._ring.ph.flow[i] = flow;
    }
  }  

  _liveParticDynas() {
    let timeFactor = 1;
    if (this._input.momentaryB.value) {
      timeFactor = (this._iter.beatstampPos * 1 % 1 < 0.5)?1:-1;
    }
    let flowAffectRatio = 1 - Math.pow(0.25, this._iter.dt);        
    for (let i = 0; i < this._initialOptions.particDynasMaxCount; i++) {
      let ttl = this._partic.dynas[i * 8 + 0];
      if (ttl > this._iter.dt) {
        ttl -= this._iter.dt;
        let pos = this._partic.dynas[i * 8 + 1];
        let vel = this._partic.dynas[i * 8 + 2];
        let burnTtl = this._partic.dynas[i * 8 + 6];
        burnTtl -= this._iter.dt;
        burnTtl = Math.max(0, burnTtl);
        let intPos = Math.floor(pos);
        let flowVel = this._ring.ph.flow[intPos];
        vel -= (vel - flowVel) * flowAffectRatio;
        
        pos += (vel * this._iter.dt) * timeFactor;
        pos = safemod(pos, this._initialOptions.masterPixelCount);
      
        
        this._partic.dynas[i * 8 + 0] = ttl;
        this._partic.dynas[i * 8 + 1] = pos;
        this._partic.dynas[i * 8 + 2] = vel;
        this._partic.dynas[i * 8 + 6] = burnTtl;
      } else {
        this._buryParcticDyna(i);
      }
    }
  }
  _buryParcticDyna(i) {
    //TODO
    // respawn as dirty solution
    this._partic.dynas[i * 8 + 0] = Math.random() * this._runtimeOptions.particDynasAverageTtl * 2; // ttl
    this._partic.dynas[i * 8 + 6] = 0; // burnTtl
  } 
  _particDynasBurnTtlToBrightnessFactor(burnTtl) {
    let burnTtlRatio = 1 - burnTtl / this._runtimeOptions.particDynasBurnTtl;
   
    let burnBornInvRatio = 1 / this._runtimeOptions.burnBornMultiplier;
    let burnDieInvRatio = 1 / this._runtimeOptions.burnDieMultiplier;
    // TODO put this invRatios (precalced  1 / val) in _internalOptions instead multipliers
    let burnInvRatio = burnBornInvRatio - (burnBornInvRatio - burnDieInvRatio) * burnTtlRatio;

    let burnBornBrightnessFactor = 1 / burnInvRatio; 
    return burnBornBrightnessFactor;    
  }

  _drawOnMasterParticDynas() {
    let baseStrobeFactor = 0;
    if (this._input.momentaryC.value) {
      baseStrobeFactor = (this._iter.beatstampPos * 2 % 1 > 0.75)?10:-1;
    }
    for (let i = 0; i < this._initialOptions.particDynasMaxCount; i++) {
      let ttl = this._partic.dynas[i * 8 + 0];
      let pos = this._partic.dynas[i * 8 + 1];
      let vel = this._partic.dynas[i * 8 + 2];
      let burnTtl = this._partic.dynas[i * 8 + 6];

      let r = this._partic.dynas[i * 8 + 3];
      let g = this._partic.dynas[i * 8 + 4];
      let b = this._partic.dynas[i * 8 + 5];

      let intPos = Math.floor(pos);

      let brightnessFactor = baseStrobeFactor + this._runtimeOptions.particDynasBaseBrightness + this._particDynasBurnTtlToBrightnessFactor(burnTtl);      
      this._ring.g.master[intPos * 3 + 0] += r * brightnessFactor;
      this._ring.g.master[intPos * 3 + 1] += g * brightnessFactor;
      this._ring.g.master[intPos * 3 + 2] += b * brightnessFactor;
    }
  }
  
  _drawOnMasterParticFats() {
    for (let i = 0; i < this._initialOptions.particFatsMaxCount; i++) {
      let ttl = this._partic.fats[i * 6 + 0];
      let pos = this._partic.fats[i * 6 + 1];
      let r = this._partic.fats[i * 6 + 3];
      let g = this._partic.fats[i * 6 + 4];
      let b = this._partic.fats[i * 6 + 5];

      let halfSize = 6; // TODO: masterPixelCount changes agnostic
      halfSize *= ttl * 3;
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        this._ring.g.master[ii * 3 + 0] += r * 2.0;
        this._ring.g.master[ii * 3 + 1] += g * 2.0;
        this._ring.g.master[ii * 3 + 2] += b * 2.0;  
      }
    }
  }  

  _drawOnFlowParticFats() {
    let dimFlowRatio = Math.pow(0.5, this._iter.dt);
    for (let i = 0; i < this._initialOptions.particFatsMaxCount; i++) {
      let pos = this._partic.fats[i * 6 + 1];
      let vel = this._partic.fats[i * 6 + 2];

   
      let halfSize = 6; // TODO: masterPixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        let flow = this._ring.ph.flow[ii];
        flow = (vel - flow) * dimFlowRatio;
        this._ring.ph.flow[ii] = flow;
      }
    }
  }  

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
    let dimFlowRatio = Math.pow(0.5, this._iter.dt);
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
      let zigScratchstampPos = this._iter.beatstampPos;
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
      let strobestamp = this._iter.beatstampPos * 4 % 1;
      let strobeValue = (strobestamp > 0.5) ? 1 : -1;
      let strobeLoopstampPos = (this._iter.loopstampPos * 4) % 1;
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
    let chillingRatio = Math.pow(0.5, this._iter.dt / 10);
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