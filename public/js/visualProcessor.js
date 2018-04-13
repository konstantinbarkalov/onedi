'use strict';
// ES6
import Limiter from './limiter.js';
// ES6
import Optionized from './optionized.js';
class VisualProcessor extends Optionized {
  static get _defaultOptions() {
    return {
      masterPixelCount: 150,
      composePixelCount: 960,
      particDynasMaxCount: 1024,
      particFatsMaxCount: 2,
      particHeroesMaxCount: 1,
      beatPerLoop: 8,
      bpm: 120,
      particDynasBoomCount: 512,
      particDynasBoomVel: 1000,
    }
  }


  constructor (databus, iobus, options) {
    super(options);
    this._iobus = iobus;
    this._databus = databus;
    this._setup();
    setInterval(() => { this._iteration(); }, 50);    
  }

  _setup() {
    this.input = {
      analogARatio: 0.5,
      switchAState: false,
    };
    this._ring = {
      g: {
        master: new Float32Array(this._options.masterPixelCount * 3),
        compose: new Float32Array(this._options.composePixelCount * 3),
      },
      ph: {
        wind: new Float32Array(this._options.masterPixelCount),
      },
      stat: {
        ingear: new Float32Array(this._options.composePixelCount * 3),
      },
    }

    this._partic = {
      dynas: new Float32Array(this._options.particDynasMaxCount * 6),
      fats: new Float32Array(this._options.particFatsMaxCount * 6),
      heroes: new Float32Array(this._options.particHeroesMaxCount * 6),
    }
    this._iter = {
    }
    
    this._iter.loopstampPos = 0;
    this._iter.loopstampVel = 0;
 
    this._iter.beatstampPos = 0;
    this._iter.beatstampVel = 0;
    this._iter.fatHitstampPos = 0;
    this._iter.fatHitstampVel = 0;
    this._iter.squeazeBeatstampPos = 0;
    this._iter.squeazeBeatstampVel = 0;
    

    this._iter.turnstampPos = 0;
    this._iter.turnstampVel = 0;
    this._iter.previousExplodeToParticDynasloopstamp = 0;
    
    this._limiter = new Limiter({pixelCount: this._options.composePixelCount});

    this._iobus.on('analogA', (analogARatio)=>{
      console.log('analogA!', analogARatio);
      this.input.analogARatio = analogARatio;
    });
    
    this._iobus.on('switchA', (switchAState)=>{
      console.log('switchA!', switchAState);
      this.input.switchAState = switchAState;
      //  TEMP TWEAK
      this._limiter.bypass = !this.input.switchAState;
      // /TEMP TWEAK
    });  

    this._fillWindBlack();
    this._fillMasterBlack();
    this._fillParticDynasRandom();
    this._fillParticFatsRandom();
    this._fillParticHeroesRandom();

    //setInterval(()=>{
    //  this._fillWindRandom();
    //}, 3000);
  }
  _iteration() {
    this._iter.dt = 50 / 1000;
    this._iter.loopstampVel = this._options.bpm / 60 / this._options.beatPerLoop;   
    this._iter.loopstampPos += this._iter.dt * this._iter.loopstampVel;
    this._iter.loopstampPos %= 1;
    this._iter.loopstampPos += 1;
    this._iter.loopstampPos %= 1;
    
    this._iter.beatstampPos = this._iter.loopstampPos * this._options.beatPerLoop % 1;
    this._iter.beatstampVel = this._iter.loopstampVel * this._options.beatPerLoop;
    
    // map linear beatstamp to squeaze ease
    let x = this._iter.beatstampPos;
    let a = 2.38;
    this._iter.squeazeBeatstampPos = Math.pow(x, a);
    this._iter.squeazeBeatstampVel = a * Math.pow(x, a - 1);
    this._iter.squeazeBeatstampPos %= 1;
    this._iter.squeazeBeatstampPos += 1;
    this._iter.squeazeBeatstampPos %= 1;
  
    this._iter.fatHitstampPos = this._iter.loopstampPos * this._options.particFatsMaxCount % 1;
    this._iter.fatHitstampVel = this._iter.loopstampVel * this._options.particFatsMaxCount;


    let turnstampConstantVel = (this.input.analogARatio - 0.5) * 2;
    //let turnstampConstantVel = -0.15 + Math.sin(Date.now()/3000) * 0.5;
    let turnstampBeatSineVel = Math.sin((this._iter.loopstampPos) * 4 * Math.PI * 2) * 0.0;
  
    
    this._iter.turnstampVel = turnstampConstantVel + turnstampBeatSineVel;
   
    //this._iter.turnstampVel += (this._iter.squeazeBeatstampVel - this._iter.beatstampVel) / 12;      
    
    this._iter.turnstampPos += this._iter.dt * this._iter.turnstampVel;
    this._iter.turnstampPos %= 1;
    this._iter.turnstampPos += 1;
    this._iter.turnstampPos %= 1;

    this._dimWind();
    this._liveParticFats();
    this._drawOnWindParticFats();
    
    this._liveParticHeroes();
    this._drawOnWindParticHeroes();

    this._liveExplodeToParticDynas();
    this._liveParticDynas();
    
    this._fillMasterBlack();
    this._drawOnMasterParticDynas();
    this._drawOnMasterParticFats();
    this._drawOnMasterParticHeroes();
    this._masterToCompose();
    //this._fillComposeDebug();
    
      
    this._composeToIngear();
    this._emitPixels();
  }
  _fillComposeDebug() {
    for (let i = 0; i < this._options.composePixelCount * 3; i++) {
      this._ring.g.compose[i] = 2;
    }
  }
  _fillMasterRandom() {
    for (let i = 0; i < this._options.masterPixelCount; i++) {
      this._ring.g.master[i * 3 + 0] = Math.random();
      this._ring.g.master[i * 3 + 1] = Math.random();
      this._ring.g.master[i * 3 + 2] = Math.random();
    }
  }
  _fillMasterBlack() {
    for (let i = 0; i < this._options.masterPixelCount * 3; i++) {
      this._ring.g.master[i] = 0;
    }
  }
  _fillIngearBlack() {
    for (let i = 0; i < this._options.ingearPixelCount * 3; i++) {
      this._ring.stat.ingear[i] = 0;
    }
  }
  _dimWind() {
    let dimRatio = Math.pow(0.5, this._iter.dt);
    for (let i = 0; i < this._options.masterPixelCount; i++) {
      this._ring.ph.wind[i] *= dimRatio;
    }
  }
  _fillWindBlack() {
    for (let i = 0; i < this._options.masterPixelCount; i++) {
      this._ring.g.master[i] = 0;
    }
  }
  _fillWindRandom() {
    for (let i = 0; i < this._options.masterPixelCount; i++) {
      this._ring.ph.wind[i] = (Math.random() - 0.5) * 5000;
    }
  }

  _fillParticDynasRandom() {
    for (let i = 0; i < this._options.particDynasMaxCount; i++) {
      this._partic.dynas[i * 6 + 0] = Math.floor(Math.random() * 5000);
      this._partic.dynas[i * 6 + 1] = Math.random() * this._options.masterPixelCount;
      this._partic.dynas[i * 6 + 2] = Math.random() - 0.5;
      this._partic.dynas[i * 6 + 3] = Math.random();
      this._partic.dynas[i * 6 + 4] = Math.random();
      this._partic.dynas[i * 6 + 5] = Math.random();
    }
  }
  _fillParticFatsRandom() {
    for (let i = 0; i < this._options.particFatsMaxCount; i++) {
      this._partic.fats[i * 6 + 0] = 0; //TODO drop
      this._partic.fats[i * 6 + 1] = Math.random() * this._options.masterPixelCount;
      this._partic.fats[i * 6 + 2] = (Math.random() - 0.5) * 500;
      this._partic.fats[i * 6 + 3] = Math.random();
      this._partic.fats[i * 6 + 4] = Math.random();
      this._partic.fats[i * 6 + 5] = Math.random();
    }
  }
  _fillParticHeroesRandom() {
    for (let i = 0; i < this._options.particHeroesMaxCount; i++) {
      this._partic.heroes[i * 6 + 0] = 0; //TODO drop
      this._partic.heroes[i * 6 + 1] = Math.random() * this._options.masterPixelCount;
      this._partic.heroes[i * 6 + 2] = (Math.random() - 0.5) * 500;
      this._partic.heroes[i * 6 + 3] = Math.random();
      this._partic.heroes[i * 6 + 4] = Math.random();
      this._partic.heroes[i * 6 + 5] = Math.random();
    }
  }

  _liveParticFats() {
    for (let i = 0; i < this._options.particFatsMaxCount; i++) {
      let ttl = (this._iter.loopstampPos) - i / this._options.particFatsMaxCount; // shift per beat
      ttl %= 1;
      ttl += 1;
      ttl %= 1;      
      let vel = this._iter.turnstampVel * this._options.masterPixelCount;      
      let pos = this._iter.turnstampPos * this._options.masterPixelCount;
       
      pos += i / this._options.particFatsMaxCount * this._options.masterPixelCount; // shift per beat
      pos %= this._options.masterPixelCount;
      pos += this._options.masterPixelCount;
      pos %= this._options.masterPixelCount;
      
      this._partic.fats[i * 6 + 0] = ttl;
      this._partic.fats[i * 6 + 1] = pos;
      this._partic.fats[i * 6 + 2] = vel;
    }
  }
  _liveParticHeroes() {
    for (let i = 0; i < this._options.particHeroesMaxCount; i++) {
      let vel = this._iter.loopstampVel * this._options.masterPixelCount;      
      let pos = this._iter.loopstampPos * this._options.masterPixelCount;
      
      vel += (this._iter.squeazeBeatstampVel - this._iter.beatstampVel) * this._options.masterPixelCount / 2;      
      pos += (this._iter.squeazeBeatstampPos - this._iter.beatstampPos) * this._options.masterPixelCount / 2;
     
      vel += this._iter.turnstampVel * this._options.masterPixelCount;      
      pos += this._iter.turnstampPos * this._options.masterPixelCount;


      
      pos %= this._options.masterPixelCount;
      pos += this._options.masterPixelCount;
      pos %= this._options.masterPixelCount;
      
      this._partic.heroes[i * 6 + 1] = pos;
      this._partic.heroes[i * 6 + 2] = vel;
    }
  }
  _liveExplodeToParticDynas() {
    let nowFatInt = Math.floor(this._iter.loopstampPos * this._options.particFatsMaxCount);
    let prevFatInt = Math.floor(this._iter.previousExplodeToParticDynasloopstamp * this._options.particFatsMaxCount);
    if (nowFatInt != prevFatInt) {
      this._explodeParticFat(nowFatInt);    
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
    for (let i = 0; i < this._options.particDynasBoomCount; i++) {
      let spawnedparticdynasindex = Math.floor(Math.random() * this._options.particDynasMaxCount)
      // todo: smart grave
      let dynapos = pos;
      let dynavel = vel + (Math.random() - 0.5) * this._options.particDynasBoomVel;
      let dynar = r + (Math.random() - 0.5) * 0.2;
      let dynag = g + (Math.random() - 0.5) * 0.2;
      let dynab = b + (Math.random() - 0.5) * 0.2;
      
      this._partic.dynas[spawnedparticdynasindex * 6 + 0] = Math.floor(Math.random() * 2000);
      this._partic.dynas[spawnedparticdynasindex * 6 + 1] = dynapos;
      this._partic.dynas[spawnedparticdynasindex * 6 + 2] = dynavel;
      this._partic.dynas[spawnedparticdynasindex * 6 + 3] = dynar;
      this._partic.dynas[spawnedparticdynasindex * 6 + 4] = dynag;
      this._partic.dynas[spawnedparticdynasindex * 6 + 5] = dynab;
    }
  }  

  _liveParticDynas() {
    let chillDimRatio = Math.pow(0.5, this._iter.dt);        
    chillDimRatio = 1;
    let windAffectRatio = 1 - Math.pow(0.25, this._iter.dt);        
    for (let i = 0; i < this._options.particDynasMaxCount; i++) {
      let ttl = this._partic.dynas[i * 6 + 0];
      if (ttl > 0) {
        ttl--;
        let pos = this._partic.dynas[i * 6 + 1];
        let vel = this._partic.dynas[i * 6 + 2];
        
        vel *= chillDimRatio;
        //vel += (Math.random() - 0.5) * 0.001;
        
        let intPos = Math.floor(pos);
        let windVel = this._ring.ph.wind[intPos];
        vel = vel - (vel - windVel) * windAffectRatio;
        
        pos += (vel * this._iter.dt);
        pos %= this._options.masterPixelCount;
        
        this._partic.dynas[i * 6 + 0] = ttl;
        this._partic.dynas[i * 6 + 1] = pos;
        this._partic.dynas[i * 6 + 2] = vel;
      } else {
        this._buryParcticDyna(i);
      }
    }
  }
  _buryParcticDyna(i) {
    //TODO
    // respawn as dirty solution
    this._partic.dynas[i * 6 + 0] = 1000; // ttl

  } 
  _drawOnMasterParticDynas() {
    for (let i = 0; i < this._options.particDynasMaxCount; i++) {
      //let ttl = this._partic.dynas[i * 6 + 0];
      let pos = this._partic.dynas[i * 6 + 1];
      let vel = this._partic.dynas[i * 6 + 2];
      let rgbVelMultitlier = 1;// + Math.abs(vel) / 100;
      let r = this._partic.dynas[i * 6 + 3] * rgbVelMultitlier;
      let g = this._partic.dynas[i * 6 + 4] * rgbVelMultitlier;
      let b = this._partic.dynas[i * 6 + 5] * rgbVelMultitlier;

      let intPos = Math.floor(pos);
      this._ring.g.master[intPos * 3 + 0] += r * 0.5;
      this._ring.g.master[intPos * 3 + 1] += g * 0.5;
      this._ring.g.master[intPos * 3 + 2] += b * 0.5;
    }
  }
  
  _drawOnMasterParticFats() {
    for (let i = 0; i < this._options.particFatsMaxCount; i++) {
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

  _drawOnWindParticFats() {
    for (let i = 0; i < this._options.particFatsMaxCount; i++) {
      let pos = this._partic.fats[i * 6 + 1];
      let vel = this._partic.fats[i * 6 + 2];

   
      let halfSize = 6; // TODO: masterPixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        this._ring.ph.wind[ii] = vel;
      }
    }
  }  

  _drawOnMasterParticHeroes() {
    for (let i = 0; i < this._options.particHeroesMaxCount; i++) {
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

  _drawOnWindParticHeroes() {
    for (let i = 0; i < this._options.particHeroesMaxCount; i++) {
      let pos = this._partic.heroes[i * 6 + 1];
      let vel = this._partic.heroes[i * 6 + 2];
      let halfSize = 12; // TODO: masterPixelCount changes agnostic
      let intPosFrom = Math.floor(pos - halfSize);
      let intPosTo = Math.floor(pos + halfSize);
      for (let ii = intPosFrom; ii <= intPosTo; ii++) {
        this._ring.ph.wind[ii] = vel;
      }
    }
  }  

  _masterToCompose() {
    for (let i = 0; i < this._options.composePixelCount; i++) {
      let rescaleRate = this._options.masterPixelCount / this._options.composePixelCount;

      let masterPos = i * rescaleRate;
      let masterHalfSize = rescaleRate; // dat BLURRNESS
      let intMasterPosFrom = Math.floor(masterPos - masterHalfSize);
      let intMasterPosTo = Math.floor(masterPos + masterHalfSize);
      this._ring.g.compose[i * 3 + 0] = 0;
      this._ring.g.compose[i * 3 + 1] = 0;
      this._ring.g.compose[i * 3 + 2] = 0;
      for (let ii = intMasterPosFrom; ii <= intMasterPosTo; ii++) {
        this._ring.g.compose[i * 3 + 0] += this._ring.g.master[ii * 3 + 0];
        this._ring.g.compose[i * 3 + 1] += this._ring.g.master[ii * 3 + 1];
        this._ring.g.compose[i * 3 + 2] += this._ring.g.master[ii * 3 + 2];
      }
      this._ring.g.compose[i * 3 + 0] /= masterHalfSize * 2;
      this._ring.g.compose[i * 3 + 1] /= masterHalfSize * 2;
      this._ring.g.compose[i * 3 + 2] /= masterHalfSize * 2;
      
      this._ring.g.compose[i * 3 + 0] = Math.pow(3 * this._ring.g.compose[i * 3 + 0], 3);
      this._ring.g.compose[i * 3 + 1] = Math.pow(3 * this._ring.g.compose[i * 3 + 1], 3);
      this._ring.g.compose[i * 3 + 2] = Math.pow(3 * this._ring.g.compose[i * 3 + 2], 3); 
    }
  }
  _composeToIngear() {
    
    let chillingRatio = Math.pow(0.5, this._iter.dt / 10);
    let gainingRatio = 1 - chillingRatio;

    for (let i = 0; i < this._options.composePixelCount; i++) {
      this._ring.stat.ingear[i * 3 + 0] *= chillingRatio;
      this._ring.stat.ingear[i * 3 + 1] *= chillingRatio;
      this._ring.stat.ingear[i * 3 + 2] *= chillingRatio;
    
      let rgb8BitCapped = {
        r: Math.min(255, Math.max(0, this._ring.g.compose[i * 3 + 0])),
        g: Math.min(255, Math.max(0, this._ring.g.compose[i * 3 + 1])),
        b: Math.min(255, Math.max(0, this._ring.g.compose[i * 3 + 2])),
      }

      this._ring.stat.ingear[i * 3 + 0] += gainingRatio * rgb8BitCapped.r;
      this._ring.stat.ingear[i * 3 + 1] += gainingRatio * rgb8BitCapped.g;
      this._ring.stat.ingear[i * 3 + 2] += gainingRatio * rgb8BitCapped.b;
    }
  }  

  _emitPixels() {
    let masterPixels = new Array(this._options.masterPixelCount * 3);
    for (let i = 0; i < this._options.masterPixelCount; i++) {
      masterPixels[i * 3 + 0] = Math.min(255, Math.max(0, Math.floor(this._ring.g.master[i * 3 + 0] * 256)));
      masterPixels[i * 3 + 1] = Math.min(255, Math.max(0, Math.floor(this._ring.g.master[i * 3 + 1] * 256)));
      masterPixels[i * 3 + 2] = Math.min(255, Math.max(0, Math.floor(this._ring.g.master[i * 3 + 2] * 256)));
    }

    let composePixels = new Array(this._options.composePixelCount * 3);
    for (let i = 0; i < this._options.composePixelCount; i++) {
      composePixels[i * 3 + 0] = Math.min(255, Math.max(0, Math.floor(this._ring.g.compose[i * 3 + 0] * 256)));
      composePixels[i * 3 + 1] = Math.min(255, Math.max(0, Math.floor(this._ring.g.compose[i * 3 + 1] * 256)));
      composePixels[i * 3 + 2] = Math.min(255, Math.max(0, Math.floor(this._ring.g.compose[i * 3 + 2] * 256)));
    }
    
    let windPixels = new Array(this._options.masterPixelCount * 3);
    for (let i = 0; i < this._options.masterPixelCount; i++) {
      windPixels[i * 3 + 0] = Math.min(255, Math.max(0, Math.floor(         this._ring.ph.wind[i] / 1000 * 256)));
      windPixels[i * 3 + 1] = Math.min(255, Math.max(0, Math.floor(     1 - this._ring.ph.wind[i] / 1000  * 256)));
      windPixels[i * 3 + 2] = Math.min(255, Math.max(0, Math.floor(Math.abs(this._ring.ph.wind[i]) / 1000  * 256)));
    }

    let ingearPixels = new Array(this._options.composePixelCount * 3);
    for (let i = 0; i < this._options.composePixelCount; i++) { 
      ingearPixels[i * 3 + 0] = Math.min(255, Math.max(0, Math.floor(this._ring.stat.ingear[i * 3 + 0] * 256)));
      ingearPixels[i * 3 + 1] = Math.min(255, Math.max(0, Math.floor(this._ring.stat.ingear[i * 3 + 1] * 256)));
      ingearPixels[i * 3 + 2] = Math.min(255, Math.max(0, Math.floor(this._ring.stat.ingear[i * 3 + 2] * 256)));
    }
    
    let heatPixels = new Array(this._options.composePixelCount * 3);
    for (let i = 0; i < this._options.composePixelCount; i++) { 
      heatPixels[i * 3 + 0] = Math.min(255, Math.max(0, Math.floor(this._limiter._heatRing[i * 3 + 0] * 256)));
      heatPixels[i * 3 + 1] = Math.min(255, Math.max(0, Math.floor(this._limiter._heatRing[i * 3 + 1] * 256)));
      heatPixels[i * 3 + 2] = Math.min(255, Math.max(0, Math.floor(this._limiter._heatRing[i * 3 + 2] * 256)));
    }
    
    //  TEMP TWEAK  
    this._limiter.process(composePixels, this._iter.dt, composePixels, {from: 0, to: 255});
    //  TEMP TWEAK

    this._databus.emit('rendered', {master: masterPixels, compose: composePixels, wind: windPixels, ingear: ingearPixels, heat: heatPixels});
  }
}

module.exports = VisualProcessor;