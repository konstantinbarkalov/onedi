'use strict';
const util = require('util');
const EventEmitter = require('events').EventEmitter;

class Premulator extends EventEmitter {
  ////////
  //////// RREMULATOR
  //////// to be ported into low-level lib (c or c++)
  ////////
  constructor (options) {
    super();
    this._setup(options);
    setInterval(() => { this._iteration(); }, 20);  
  }

  _setup(options) {
    this._options = Object.assign({
      composePixelCount: 150,
      masterPixelCount: 4096,
      particDynasMaxCount: 1024,
      particFatsMaxCount: 8,
      particHeroesMaxCount: 1,
      beatPerRing: 8,
      bpm: 120,
      particDynasBoomCount: 128,
    }, options);
    this._composeRing = new Float32Array(this._options.composePixelCount * 3);
    this._masterRing = new Float32Array(this._options.masterPixelCount * 3);
    
    this._windRing = new Float32Array(this._options.composePixelCount);
    this._particDynas = new Float32Array(this._options.particDynasMaxCount * 6);
    this._particFats = new Float32Array(this._options.particFatsMaxCount * 6);
    this._particHeroes = new Float32Array(this._options.particHeroesMaxCount * 6);
    
    this._beatstamp = 0;
    this._turnstamp = 0;
    this._previousExplodeToParticDynasBeatstamp = 0;
    
    this._fillWindRandom();
    this._fillComposeRandom();
    this._fillParticDynasRandom();
    this._fillParticFatsRandom();
    this._fillParticHeroesRandom();

    //setInterval(()=>{
    //  this._fillWindRandom();
    //}, 3000);
  }
  _iteration() {
    let timestampDelta = 20;
    this._beatstamp += timestampDelta / 1000 / 60 * this._options.bpm / this._options.beatPerRing;
    this._beatstamp %= 1;
    this._beatstamp += 1;
    this._beatstamp %= 1;
    this._turnstamp += timestampDelta / 1000 / 3 + Math.sin((this._beatstamp) * 8 / 4 * Math.PI * 2) * 0.001 ;
    this._turnstamp %= 1;
    this._turnstamp += 1;
    this._turnstamp %= 1;

    this._dimWind(timestampDelta);
    this._liveParticFats(timestampDelta);
    this._drawOnWindParticFats(timestampDelta);
    
    this._liveParticHeroes(timestampDelta);
    this._drawOnWindParticHeroes(timestampDelta);

    this._liveExplodeToParticDynas(timestampDelta);
    this._liveParticDynas(timestampDelta);
    
    this._fillComposeBlack();
    this._drawOnComposeParticDynas();
    this._drawOnComposeParticFats();
    this._drawOnComposeParticHeroes();
    this._composeToMaster();
    this._emitPixels();
  }

  _fillComposeRandom() {
    for (let i = 0; i < this._options.composePixelCount; i++) {
      this._composeRing[i * 3 + 0] = Math.random();
      this._composeRing[i * 3 + 1] = Math.random();
      this._composeRing[i * 3 + 2] = Math.random();
    }
  }
  _fillComposeBlack() {
    for (let i = 0; i < this._options.composePixelCount * 3; i++) {
      this._composeRing[i] = 0;
    }
  }
  _dimWind(timestampDelta) {
    let dimRatio = Math.pow(0.5, timestampDelta / 1000);
    for (let i = 0; i < this._options.composePixelCount; i++) {
      this._windRing[i] *= dimRatio;
    }
  }
  _fillWindRandom() {
    for (let i = 0; i < this._options.composePixelCount; i++) {
      this._windRing[i] = (Math.random() - 0.5) * 5000;
    }
  }

  _fillParticDynasRandom() {
    for (let i = 0; i < this._options.particDynasMaxCount; i++) {
      this._particDynas[i * 6 + 0] = Math.floor(Math.random() * 5000);
      this._particDynas[i * 6 + 1] = Math.random() * this._options.composePixelCount;
      this._particDynas[i * 6 + 2] = Math.random() - 0.5;
      this._particDynas[i * 6 + 3] = Math.random();
      this._particDynas[i * 6 + 4] = Math.random();
      this._particDynas[i * 6 + 5] = Math.random();
    }
  }
  _fillParticFatsRandom() {
    for (let i = 0; i < this._options.particFatsMaxCount; i++) {
      this._particFats[i * 6 + 0] = 0; //TODO drop
      this._particFats[i * 6 + 1] = Math.random() * this._options.composePixelCount;
      this._particFats[i * 6 + 2] = (Math.random() - 0.5) * 500;
      this._particFats[i * 6 + 3] = Math.random();
      this._particFats[i * 6 + 4] = Math.random();
      this._particFats[i * 6 + 5] = Math.random();
    }
  }
  _fillParticHeroesRandom() {
    for (let i = 0; i < this._options.particHeroesMaxCount; i++) {
      this._particHeroes[i * 6 + 0] = 0; //TODO drop
      this._particHeroes[i * 6 + 1] = Math.random() * this._options.composePixelCount;
      this._particHeroes[i * 6 + 2] = (Math.random() - 0.5) * 500;
      this._particHeroes[i * 6 + 3] = Math.random();
      this._particHeroes[i * 6 + 4] = Math.random();
      this._particHeroes[i * 6 + 5] = Math.random();
    }
  }

  _liveParticFats(timestampDelta) {
    for (let i = 0; i < this._options.particFatsMaxCount; i++) {
      let vel = 0 * this._options.composePixelCount / this._options.beatPerRing * this._options.bpm / 60;      
      let pos = ( 0 * this._beatstamp + i / this._options.particFatsMaxCount ) * this._options.composePixelCount;
      
      vel += 1 * this._options.composePixelCount / 300; // TODO
      pos += ( 1 * this._turnstamp ) * this._options.composePixelCount;      
      
      pos %= this._options.composePixelCount;
      pos += this._options.composePixelCount;
      pos %= this._options.composePixelCount;
      
      this._particFats[i * 6 + 1] = pos;
      this._particFats[i * 6 + 2] = vel;
    }
  }
  _liveParticHeroes(timestampDelta) {
    for (let i = 0; i < this._options.particHeroesMaxCount; i++) {
      let vel = 1 * this._options.composePixelCount / this._options.beatPerRing * this._options.bpm / 60;      
      let pos = ( 1 * this._beatstamp + i / this._options.particHeroesMaxCount ) * this._options.composePixelCount;

      vel += 1 * this._options.composePixelCount / 300; // TODO
      pos += ( 1 * this._turnstamp ) * this._options.composePixelCount;      
      
      pos %= this._options.composePixelCount;
      pos += this._options.composePixelCount;
      pos %= this._options.composePixelCount;
      
      this._particHeroes[i * 6 + 1] = pos;
      this._particHeroes[i * 6 + 2] = vel;
    }
  }
  _liveExplodeToParticDynas(timestampDelta) {
    let nowFatInt = Math.floor(this._beatstamp * this._options.particFatsMaxCount);
    let prevFatInt = Math.floor(this._previousExplodeToParticDynasBeatstamp * this._options.particFatsMaxCount);
    if (nowFatInt != prevFatInt) {
      this._explodeParticFat(nowFatInt);    
    }
    this._previousExplodeToParticDynasBeatstamp = this._beatstamp; 
  }
  
  _explodeParticFat(fatIndex) {
    let pos = this._particFats[fatIndex * 6 + 1];
    let vel = this._particFats[fatIndex * 6 + 2];
    let r = this._particFats[fatIndex * 6 + 3];
    let g = this._particFats[fatIndex * 6 + 4];
    let b = this._particFats[fatIndex * 6 + 5];
    console.log('boom fatIndex', fatIndex, r,g,b);
    for (let i = 0; i < this._options.particDynasBoomCount; i++) {
      let spawnedParticDynasIndex = Math.floor(Math.random() * this._options.particDynasMaxCount)
      // TODO: smart grave
      let dynaPos = pos;
      let dynaVel = vel + (Math.random() - 0.5) * 10000;
      let dynaR = r + (Math.random() - 0.5) * 0.2;
      let dynaG = g + (Math.random() - 0.5) * 0.2;
      let dynaB = b + (Math.random() - 0.5) * 0.2;
      
      this._particDynas[spawnedParticDynasIndex * 6 + 0] = Math.floor(Math.random() * 2000);
      this._particDynas[spawnedParticDynasIndex * 6 + 1] = dynaPos;
      this._particDynas[spawnedParticDynasIndex * 6 + 2] = dynaVel;
      this._particDynas[spawnedParticDynasIndex * 6 + 3] = dynaR;
      this._particDynas[spawnedParticDynasIndex * 6 + 4] = dynaG;
      this._particDynas[spawnedParticDynasIndex * 6 + 5] = dynaB;
    }
  }  

  _liveParticDynas(timestampDelta) {
    let chillDimRatio = Math.pow(0.5, timestampDelta / 1000);        
    let windAffectRatio = 1 - Math.pow(0.1, timestampDelta / 1000);        

    for (let i = 0; i < this._options.particDynasMaxCount; i++) {
      let ttl = this._particDynas[i * 6 + 0];
      if (ttl > 0) {
        ttl--;
        let pos = this._particDynas[i * 6 + 1];
        let vel = this._particDynas[i * 6 + 2];
        
        vel *= chillDimRatio;
        //vel += (Math.random() - 0.5) * 0.001;
        
        let intPos = Math.floor(pos);
        let windVel = this._windRing[intPos];
        vel = vel - (vel - windVel) * windAffectRatio;
        
        pos += (vel * timestampDelta / 1000);
        pos %= this._options.composePixelCount;
        
        this._particDynas[i * 6 + 0] = ttl;
        this._particDynas[i * 6 + 1] = pos;
        this._particDynas[i * 6 + 2] = vel;
      } else {
        this._buryParcticDyna(i);
      }
    }
  }
  _buryParcticDyna(i) {
    //TODO
    // respawn as dirty solution
    this._particDynas[i * 6 + 0] = 1000; // ttl

  } 
  _drawOnComposeParticDynas() {
    for (let i = 0; i < this._options.particDynasMaxCount; i++) {
      //let ttl = this._particDynas[i * 6 + 0];
      let pos = this._particDynas[i * 6 + 1];
      let vel = this._particDynas[i * 6 + 2];
      let rgbVelMultitlier = 1 + vel / 100;
      let r = this._particDynas[i * 6 + 3] * rgbVelMultitlier;
      let g = this._particDynas[i * 6 + 4] * rgbVelMultitlier;
      let b = this._particDynas[i * 6 + 5] * rgbVelMultitlier;

      let intPos = Math.floor(pos);
      this._composeRing[intPos * 3 + 0] += r * 0.5;
      this._composeRing[intPos * 3 + 1] += g * 0.5;
      this._composeRing[intPos * 3 + 2] += b * 0.5;
    }
  }
  
  _drawOnComposeParticFats() {
    for (let i = 0; i < this._options.particFatsMaxCount; i++) {
      let pos = this._particFats[i * 6 + 1];
      let r = this._particFats[i * 6 + 3];
      let g = this._particFats[i * 6 + 4];
      let b = this._particFats[i * 6 + 5];

      let halfSize = 32; // TODO: composePixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        this._composeRing[ii * 3 + 0] += r * 2.0;
        this._composeRing[ii * 3 + 1] += g * 2.0;
        this._composeRing[ii * 3 + 2] += b * 2.0;  
      }
    }
  }  

  _drawOnWindParticFats(timestampDelta) {
    for (let i = 0; i < this._options.particFatsMaxCount; i++) {
      let pos = this._particFats[i * 6 + 1];
      let vel = this._particFats[i * 6 + 2];

   
      let halfSize = 32; // TODO: composePixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        this._windRing[ii] = vel;
      }
    }
  }  

  _drawOnComposeParticHeroes() {
    for (let i = 0; i < this._options.particHeroesMaxCount; i++) {
      let pos = this._particHeroes[i * 6 + 1];
      let r = this._particHeroes[i * 6 + 3];
      let g = this._particHeroes[i * 6 + 4];
      let b = this._particHeroes[i * 6 + 5];

      let halfSize = 64; // TODO: composePixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        this._composeRing[ii * 3 + 0] += r * 3.0;
        this._composeRing[ii * 3 + 1] += g * 3.0;
        this._composeRing[ii * 3 + 2] += b * 3.0;  
      }
    }
  }  

  _drawOnWindParticHeroes(timestampDelta) {
    for (let i = 0; i < this._options.particHeroesMaxCount; i++) {
      let pos = this._particHeroes[i * 6 + 1];
      let vel = this._particHeroes[i * 6 + 2];
      let halfSize = 64; // TODO: composePixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        this._windRing[ii] = vel;
      }
    }
  }  

  _composeToMaster(timestampDelta) {
    for (let i = 0; i < this._options.masterPixelCount; i++) {
      let rescaleRate = this._options.composePixelCount / this._options.masterPixelCount;

      let composePos = i * rescaleRate;
      let composeHalfSize = rescaleRate / 2; // dat BLURRNESS
      let intComposePosFrom = Math.floor(composePos - composeHalfSize);
      let intComposePosTo = Math.floor(composePos + composeHalfSize);
      this._masterRing[i * 3 + 0] = 0;
      this._masterRing[i * 3 + 1] = 0;
      this._masterRing[i * 3 + 2] = 0;
      for (let ii = intComposePosFrom; ii <= intComposePosTo; ii++) {
        this._masterRing[i * 3 + 0] += this._composeRing[ii * 3 + 0];
        this._masterRing[i * 3 + 1] += this._composeRing[ii * 3 + 1];
        this._masterRing[i * 3 + 2] += this._composeRing[ii * 3 + 2];
      }
      this._masterRing[i * 3 + 0] /= composeHalfSize * 2;
      this._masterRing[i * 3 + 1] /= composeHalfSize * 2;
      this._masterRing[i * 3 + 2] /= composeHalfSize * 2;
      
 
    }
  }  

  _emitPixels() {
    let composePixels = new Array(this._options.composePixelCount);
    for (let i = 0; i < this._options.composePixelCount; i++) {
      let rgb = {
        r: Math.min(255, Math.max(0, Math.floor(this._composeRing[i * 3 + 0] * 256))),
        g: Math.min(255, Math.max(0, Math.floor(this._composeRing[i * 3 + 1] * 256))),
        b: Math.min(255, Math.max(0, Math.floor(this._composeRing[i * 3 + 2] * 256))),
      }
      composePixels[i] = rgb;
    }

    let masterPixels = new Array(this._options.masterPixelCount);
    for (let i = 0; i < this._options.masterPixelCount; i++) {
      let rgb = {
        r: Math.min(255, Math.max(0, Math.floor(this._masterRing[i * 3 + 0] * 256))),
        g: Math.min(255, Math.max(0, Math.floor(this._masterRing[i * 3 + 1] * 256))),
        b: Math.min(255, Math.max(0, Math.floor(this._masterRing[i * 3 + 2] * 256))),
      }
      masterPixels[i] = rgb;
    }
    this.emit('ledline', composePixels, masterPixels);
  }
  ////////
  //////// RREMULATOR END
  ////////
}
//util.inherits(Premulator, EventEmitter);

function premulatorFactory(...args) {
  return new Premulator(...args);
}
module.exports = premulatorFactory;