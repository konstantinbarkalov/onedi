'use strict';
const util = require('util');
function Premulator(composePixelCount, masterPixelCount) {
  const that = this;
  function init() {
    that._setup();
    setInterval(that._iteration, 20);
  }
  
  ////////
  //////// RREMULATOR
  //////// to be ported into low-level lib (c or c++)
  ////////
  
  that._setup = () => {
    that._options = {
      composePixelCount: composePixelCount,
      masterPixelCount: masterPixelCount,
      particDynasMaxCount: 1024,
      particFatsMaxCount: 8,
      particHeroesMaxCount: 1,
      beatPerRing: 8,
      bpm: 120,
      particDynasBoomCount: 128,
    }
    that._composeRing = new Float32Array(that._options.composePixelCount * 3);
    that._masterRing = new Float32Array(that._options.masterPixelCount * 3);
    
    that._windRing = new Float32Array(that._options.composePixelCount);
    that._particDynas = new Float32Array(that._options.particDynasMaxCount * 6);
    that._particFats = new Float32Array(that._options.particFatsMaxCount * 6);
    that._particHeroes = new Float32Array(that._options.particHeroesMaxCount * 6);
    
    that._beatstamp = 0;
    that._turnstamp = 0;
    that._previousExplodeToParticDynasBeatstamp = 0;
    
    that._fillWindRandom();
    that._fillComposeRandom();
    that._fillParticDynasRandom();
    that._fillParticFatsRandom();
    that._fillParticHeroesRandom();

    //setInterval(()=>{
    //  that._fillWindRandom();
    //}, 3000);
  }
  that._beatstamp = 0;
  that._turnstamp = 0;
  that._iteration = () => {
    let timestampDelta = 20;
    that._beatstamp += timestampDelta / 1000 / 60 * that._options.bpm / that._options.beatPerRing;
    that._beatstamp %= 1;
    that._beatstamp += 1;
    that._beatstamp %= 1;
    that._turnstamp += timestampDelta / 1000 / 3 + Math.sin((that._beatstamp) * 8 / 4 * Math.PI * 2) * 0.001 ;
    that._turnstamp %= 1;
    that._turnstamp += 1;
    that._turnstamp %= 1;

    that._dimWind(timestampDelta);
    that._liveParticFats(timestampDelta);
    that._drawOnWindParticFats(timestampDelta);
    
    that._liveParticHeroes(timestampDelta);
    that._drawOnWindParticHeroes(timestampDelta);

    that._liveExplodeToParticDynas(timestampDelta);
    that._liveParticDynas(timestampDelta);
    
    that._fillComposeBlack();
    that._drawOnComposeParticDynas();
    that._drawOnComposeParticFats();
    that._drawOnComposeParticHeroes();
    that._composeToMaster();
    that._emitPixels();
  }

  that._fillComposeRandom = () => {
    for (let i = 0; i < that._options.composePixelCount; i++) {
      that._composeRing[i * 3 + 0] = Math.random();
      that._composeRing[i * 3 + 1] = Math.random();
      that._composeRing[i * 3 + 2] = Math.random();
    }
  }
  that._fillComposeBlack = () => {
    for (let i = 0; i < that._options.composePixelCount * 3; i++) {
      that._composeRing[i] = 0;
    }
  }
  that._dimWind = (timestampDelta) => {
    let dimRatio = Math.pow(0.5, timestampDelta / 1000);
    for (let i = 0; i < that._options.composePixelCount; i++) {
      that._windRing[i] *= dimRatio;
    }
  }
  that._fillWindRandom = () => {
    for (let i = 0; i < that._options.composePixelCount; i++) {
      that._windRing[i] = (Math.random() - 0.5) * 5000;
    }
  }

  that._fillParticDynasRandom = () => {
    for (let i = 0; i < that._options.particDynasMaxCount; i++) {
      that._particDynas[i * 6 + 0] = Math.floor(Math.random() * 5000);
      that._particDynas[i * 6 + 1] = Math.random() * that._options.composePixelCount;
      that._particDynas[i * 6 + 2] = Math.random() - 0.5;
      that._particDynas[i * 6 + 3] = Math.random();
      that._particDynas[i * 6 + 4] = Math.random();
      that._particDynas[i * 6 + 5] = Math.random();
    }
  }
  that._fillParticFatsRandom = () => {
    for (let i = 0; i < that._options.particFatsMaxCount; i++) {
      that._particFats[i * 6 + 0] = 0; //TODO drop
      that._particFats[i * 6 + 1] = Math.random() * that._options.composePixelCount;
      that._particFats[i * 6 + 2] = (Math.random() - 0.5) * 500;
      that._particFats[i * 6 + 3] = Math.random();
      that._particFats[i * 6 + 4] = Math.random();
      that._particFats[i * 6 + 5] = Math.random();
    }
  }
  that._fillParticHeroesRandom = () => {
    for (let i = 0; i < that._options.particHeroesMaxCount; i++) {
      that._particHeroes[i * 6 + 0] = 0; //TODO drop
      that._particHeroes[i * 6 + 1] = Math.random() * that._options.composePixelCount;
      that._particHeroes[i * 6 + 2] = (Math.random() - 0.5) * 500;
      that._particHeroes[i * 6 + 3] = Math.random();
      that._particHeroes[i * 6 + 4] = Math.random();
      that._particHeroes[i * 6 + 5] = Math.random();
    }
  }

  that._liveParticFats = (timestampDelta) => {
    for (let i = 0; i < that._options.particFatsMaxCount; i++) {
      let vel = 0 * that._options.composePixelCount / that._options.beatPerRing * that._options.bpm / 60;      
      let pos = ( 0 * that._beatstamp + i / that._options.particFatsMaxCount ) * that._options.composePixelCount;
      
      vel += 1 * that._options.composePixelCount / 300; // TODO
      pos += ( 1 * that._turnstamp ) * that._options.composePixelCount;      
      
      pos %= that._options.composePixelCount;
      pos += that._options.composePixelCount;
      pos %= that._options.composePixelCount;
      
      that._particFats[i * 6 + 1] = pos;
      that._particFats[i * 6 + 2] = vel;
    }
  }
  that._liveParticHeroes = (timestampDelta) => {
    for (let i = 0; i < that._options.particHeroesMaxCount; i++) {
      let vel = 1 * that._options.composePixelCount / that._options.beatPerRing * that._options.bpm / 60;      
      let pos = ( 1 * that._beatstamp + i / that._options.particHeroesMaxCount ) * that._options.composePixelCount;

      vel += 1 * that._options.composePixelCount / 300; // TODO
      pos += ( 1 * that._turnstamp ) * that._options.composePixelCount;      
      
      pos %= that._options.composePixelCount;
      pos += that._options.composePixelCount;
      pos %= that._options.composePixelCount;
      
      that._particHeroes[i * 6 + 1] = pos;
      that._particHeroes[i * 6 + 2] = vel;
    }
  }
  that._liveExplodeToParticDynas = (timestampDelta) => {
    let nowFatInt = Math.floor(that._beatstamp * that._options.particFatsMaxCount);
    let prevFatInt = Math.floor(that._previousExplodeToParticDynasBeatstamp * that._options.particFatsMaxCount);
    if (nowFatInt != prevFatInt) {
      that._explodeParticFat(nowFatInt);    
    }
    that._previousExplodeToParticDynasBeatstamp = that._beatstamp; 
  }
  
  that._explodeParticFat = (fatIndex) => {
    let pos = that._particFats[fatIndex * 6 + 1];
    let vel = that._particFats[fatIndex * 6 + 2];
    let r = that._particFats[fatIndex * 6 + 3];
    let g = that._particFats[fatIndex * 6 + 4];
    let b = that._particFats[fatIndex * 6 + 5];
    console.log('boom fatIndex', fatIndex, r,g,b);
    for (let i = 0; i < that._options.particDynasBoomCount; i++) {
      let spawnedParticDynasIndex = Math.floor(Math.random() * that._options.particDynasMaxCount)
      // TODO: smart grave
      let dynaPos = pos;
      let dynaVel = vel + (Math.random() - 0.5) * 10000;
      let dynaR = r + (Math.random() - 0.5) * 0.2;
      let dynaG = g + (Math.random() - 0.5) * 0.2;
      let dynaB = b + (Math.random() - 0.5) * 0.2;
      
      that._particDynas[spawnedParticDynasIndex * 6 + 0] = Math.floor(Math.random() * 2000);
      that._particDynas[spawnedParticDynasIndex * 6 + 1] = dynaPos;
      that._particDynas[spawnedParticDynasIndex * 6 + 2] = dynaVel;
      that._particDynas[spawnedParticDynasIndex * 6 + 3] = dynaR;
      that._particDynas[spawnedParticDynasIndex * 6 + 4] = dynaG;
      that._particDynas[spawnedParticDynasIndex * 6 + 5] = dynaB;
    }
  }  

  that._liveParticDynas = (timestampDelta) => {
    let chillDimRatio = Math.pow(0.5, timestampDelta / 1000);        
    let windAffectRatio = 1 - Math.pow(0.1, timestampDelta / 1000);        

    for (let i = 0; i < that._options.particDynasMaxCount; i++) {
      let ttl = that._particDynas[i * 6 + 0];
      if (ttl > 0) {
        ttl--;
        let pos = that._particDynas[i * 6 + 1];
        let vel = that._particDynas[i * 6 + 2];
        
        vel *= chillDimRatio;
        //vel += (Math.random() - 0.5) * 0.001;
        
        let intPos = Math.floor(pos);
        let windVel = that._windRing[intPos];
        vel = vel - (vel - windVel) * windAffectRatio;
        
        pos += (vel * timestampDelta / 1000);
        pos %= that._options.composePixelCount;
        
        that._particDynas[i * 6 + 0] = ttl;
        that._particDynas[i * 6 + 1] = pos;
        that._particDynas[i * 6 + 2] = vel;
      } else {
        that._buryParcticDyna(i);
      }
    }
  }
  that._buryParcticDyna = (i) => {
    //TODO
    // respawn as dirty solution
    that._particDynas[i * 6 + 0] = 1000; // ttl

  } 
  that._drawOnComposeParticDynas = () => {
    for (let i = 0; i < that._options.particDynasMaxCount; i++) {
      //let ttl = that._particDynas[i * 6 + 0];
      let pos = that._particDynas[i * 6 + 1];
      let vel = that._particDynas[i * 6 + 2];
      let rgbVelMultitlier = 1 + vel / 100;
      let r = that._particDynas[i * 6 + 3] * rgbVelMultitlier;
      let g = that._particDynas[i * 6 + 4] * rgbVelMultitlier;
      let b = that._particDynas[i * 6 + 5] * rgbVelMultitlier;

      let intPos = Math.floor(pos);
      that._composeRing[intPos * 3 + 0] += r * 0.5;
      that._composeRing[intPos * 3 + 1] += g * 0.5;
      that._composeRing[intPos * 3 + 2] += b * 0.5;
    }
  }
  
  that._drawOnComposeParticFats = () => {
    for (let i = 0; i < that._options.particFatsMaxCount; i++) {
      let pos = that._particFats[i * 6 + 1];
      let r = that._particFats[i * 6 + 3];
      let g = that._particFats[i * 6 + 4];
      let b = that._particFats[i * 6 + 5];

      let halfSize = 32; // TODO: composePixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        that._composeRing[ii * 3 + 0] += r * 2.0;
        that._composeRing[ii * 3 + 1] += g * 2.0;
        that._composeRing[ii * 3 + 2] += b * 2.0;  
      }
    }
  }  

  that._drawOnWindParticFats = (timestampDelta) => {
    for (let i = 0; i < that._options.particFatsMaxCount; i++) {
      let pos = that._particFats[i * 6 + 1];
      let vel = that._particFats[i * 6 + 2];

   
      let halfSize = 32; // TODO: composePixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        that._windRing[ii] = vel;
      }
    }
  }  

  that._drawOnComposeParticHeroes = () => {
    for (let i = 0; i < that._options.particHeroesMaxCount; i++) {
      let pos = that._particHeroes[i * 6 + 1];
      let r = that._particHeroes[i * 6 + 3];
      let g = that._particHeroes[i * 6 + 4];
      let b = that._particHeroes[i * 6 + 5];

      let halfSize = 64; // TODO: composePixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        that._composeRing[ii * 3 + 0] += r * 3.0;
        that._composeRing[ii * 3 + 1] += g * 3.0;
        that._composeRing[ii * 3 + 2] += b * 3.0;  
      }
    }
  }  

  that._drawOnWindParticHeroes = (timestampDelta) => {
    for (let i = 0; i < that._options.particHeroesMaxCount; i++) {
      let pos = that._particHeroes[i * 6 + 1];
      let vel = that._particHeroes[i * 6 + 2];
      let halfSize = 64; // TODO: composePixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        that._windRing[ii] = vel;
      }
    }
  }  

  that._composeToMaster = (timestampDelta) => {
    for (let i = 0; i < that._options.masterPixelCount; i++) {
      let rescaleRate = that._options.composePixelCount / that._options.masterPixelCount;

      let composePos = i * rescaleRate;
      let composeHalfSize = rescaleRate / 2; // dat BLURRNESS
      let intComposePosFrom = Math.floor(composePos - composeHalfSize);
      let intComposePosTo = Math.floor(composePos + composeHalfSize);
      that._masterRing[i * 3 + 0] = 0;
      that._masterRing[i * 3 + 1] = 0;
      that._masterRing[i * 3 + 2] = 0;
      for (let ii = intComposePosFrom; ii <= intComposePosTo; ii++) {
        that._masterRing[i * 3 + 0] += that._composeRing[ii * 3 + 0];
        that._masterRing[i * 3 + 1] += that._composeRing[ii * 3 + 1];
        that._masterRing[i * 3 + 2] += that._composeRing[ii * 3 + 2];
      }
      that._masterRing[i * 3 + 0] /= composeHalfSize * 2;
      that._masterRing[i * 3 + 1] /= composeHalfSize * 2;
      that._masterRing[i * 3 + 2] /= composeHalfSize * 2;
      
 
    }
  }  

  that._emitPixels = () => {
    let composePixels = new Array(that._options.composePixelCount);
    for (let i = 0; i < that._options.composePixelCount; i++) {
      let rgb = {
        r: Math.min(255, Math.max(0, Math.floor(that._composeRing[i * 3 + 0] * 256))),
        g: Math.min(255, Math.max(0, Math.floor(that._composeRing[i * 3 + 1] * 256))),
        b: Math.min(255, Math.max(0, Math.floor(that._composeRing[i * 3 + 2] * 256))),
      }
      composePixels[i] = rgb;
    }

    let masterPixels = new Array(that._options.masterPixelCount);
    for (let i = 0; i < that._options.masterPixelCount; i++) {
      let rgb = {
        r: Math.min(255, Math.max(0, Math.floor(that._masterRing[i * 3 + 0] * 256))),
        g: Math.min(255, Math.max(0, Math.floor(that._masterRing[i * 3 + 1] * 256))),
        b: Math.min(255, Math.max(0, Math.floor(that._masterRing[i * 3 + 2] * 256))),
      }
      masterPixels[i] = rgb;
    }
    that.emit('ledline', composePixels, masterPixels);
  }
  
  ////////
  //////// RREMULATOR END
  ////////

  init();
}
const EventEmitter = require('events').EventEmitter;
util.inherits(Premulator, EventEmitter);

function premulatorFactory(...args) {
  return new Premulator(...args);
}
module.exports = premulatorFactory;