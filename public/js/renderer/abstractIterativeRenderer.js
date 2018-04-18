'use strict';
// ES6
import OptionizedCorecofigured from './../optionizedCorecofigured.js';
import Helper from './helper.js';

let safemod = Helper.safemod;
class AbstractiveIterativeRenderer extends OptionizedCorecofigured {
  static get _defaultInitialOptions() {
    return {
      fps: 60,
    }
  }
  static get _defaultRuntimeOptions() {
    return {
      beatPerLoop: 8,
      bpm: 120,
    }
  }

  static _getCoreconfigInitialOptions(coreconfig, coreconfigKey) {
    return {
    }
  }
  
  constructor (initialOptions, runtimeOptions) {
    super(initialOptions, runtimeOptions);
    this._construct();
    this._reset();
    setInterval(() => { this._iteration(); }, 1000 / this._initialOptions.fps);    
  }
  
  _construct() {
    this._iter = {
      // keys and zero values will be filled in _resetIter() via _reset()
    }
  }
  _reset() {
    this._resetIter();
    // this._limiter.reset(); // uncomment if need
  }
  _resetIter(){
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
  }
  _updateIterTime() {
    let t = Date.now() / 1000;
    let dt = t - this._iter.t;
    this._iter.t = t;
    this._iter.dt = dt || 50;
  }
  _liveIterStamp() {
    this._iter.loopstampVel = this._runtimeOptions.bpm / 60 / this._runtimeOptions.beatPerLoop;   
    this._iter.loopstampPos += this._iter.dt * this._iter.loopstampVel;
    this._iter.loopstampPos = safemod(this._iter.loopstampPos, 1);
    
    this._iter.beatstampPos = this._iter.loopstampPos * this._runtimeOptions.beatPerLoop % 1;
    this._iter.beatstampVel = this._iter.loopstampVel * this._runtimeOptions.beatPerLoop;
    
    // map linear beatstamp to squeaze ease
    let x = this._iter.beatstampPos;
    let bratio = 1 - this._input.analogE.value * 2;
    let a = Math.pow(2, bratio);
    this._iter.squeazeBeatstampPos = Math.pow(x, a);
    this._iter.squeazeBeatstampVel = a * Math.pow(x, a - 1);
    this._iter.squeazeBeatstampPos = safemod(this._iter.squeazeBeatstampPos, 1);
 
    this._iter.fatHitstampPos = this._iter.loopstampPos * this._initialOptions.particFatsMaxCount % 1;
    this._iter.fatHitstampVel = this._iter.loopstampVel * this._initialOptions.particFatsMaxCount;


    let turnstampConstantVel = (this._input.analogA.value - 0.5) * 2;
    let turnstampConstantSineVel = Math.sin(Date.now()/3000) * 0.1 * 0;
    let turnstampSqueazeBeatSineVel = - (this._iter.squeazeBeatstampVel - this._iter.beatstampVel) * (this._input.analogC.value - 0.5);
  
    
    this._iter.turnstampVel = turnstampConstantVel + turnstampConstantSineVel + turnstampSqueazeBeatSineVel;
   
    //this._iter.turnstampVel += (this._iter.squeazeBeatstampVel - this._iter.beatstampVel) / 12;      
    
    this._iter.turnstampPos += this._iter.dt * this._iter.turnstampVel;
    this._iter.turnstampPos = safemod(this._iter.turnstampPos, 1);
  }
  _iteration() {
    this._updateIterTime();
    this._liveIterStamp();
  }
}

export default AbstractiveIterativeRenderer;