'use strict';
// ES6
import AbstractIterativeRenderer from './abstractIterativeRenderer.js';
import Helper from './helper.js';
import { EventEmitter } from 'events';

let safemod = Helper.safemod;
class MomentoRenderer extends AbstractIterativeRenderer {
  
  /* extend */ static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
      iterationSteps: [
        ...super._defaultInitialOptions.iterationSteps,
        'momento',
      ],
    });
  }

  static get _defaultRuntimeOptions() {
    return {
      beatPerLoop: 8,
      bpm: 120,
    }
  }

  _construct() {
    super._construct();
    this._momento = {
      // keys and zero values will be filled in _resetMomento() via _reset()
    }
  }

  _resetMomento(){
    this._momento.loopstampPos = 0;
    this._momento.loopstampVel = 0;
 
    this._momento.beatstampPos = 0;
    this._momento.beatstampVel = 0;
    this._momento.fatHitstampPos = 0;
    this._momento.fatHitstampVel = 0;
    this._momento.squeazeBeatstampPos = 0;
    this._momento.squeazeBeatstampVel = 0;
    

    this._momento.turnstampPos = 0;
    this._momento.turnstampVel = 0;
    this._momento.previousExplodeToParticHeroesloopstamp = 0;
    this._momento.previousExplodeToParticFatsloopstamp = 0;
  }
  _updateMomentoTime() {
    let t = Date.now() / 1000;
    let dt = t - this._momento.t;
    this._momento.t = t;
    this._momento.dt = dt || 50;
  }
  _liveMomento() {
    this._momento.loopstampVel = this._runtimeOptions.bpm / 60 / this._runtimeOptions.beatPerLoop;   
    this._momento.loopstampPos += this._momento.dt * this._momento.loopstampVel;
    this._momento.loopstampPos = safemod(this._momento.loopstampPos, 1);
    
    this._momento.beatstampPos = this._momento.loopstampPos * this._runtimeOptions.beatPerLoop % 1;
    this._momento.beatstampVel = this._momento.loopstampVel * this._runtimeOptions.beatPerLoop;
    
    // map linear beatstamp to squeaze ease
    let x = this._momento.beatstampPos;
    let bratio = 1 - this._input.analogE.value * 2;
    let a = Math.pow(2, bratio);
    this._momento.squeazeBeatstampPos = Math.pow(x, a);
    this._momento.squeazeBeatstampVel = a * Math.pow(x, a - 1);
    this._momento.squeazeBeatstampPos = safemod(this._momento.squeazeBeatstampPos, 1);
 
    this._momento.fatHitstampPos = this._momento.loopstampPos * this._initialOptions.particFatsMaxCount % 1;
    this._momento.fatHitstampVel = this._momento.loopstampVel * this._initialOptions.particFatsMaxCount;


    let turnstampConstantVel = (this._input.analogA.value - 0.5) * 2;
    let turnstampConstantSineVel = Math.sin(Date.now()/3000) * 0.1 * 0;
    let turnstampSqueazeBeatSineVel = - (this._momento.squeazeBeatstampVel - this._momento.beatstampVel) * (this._input.analogC.value - 0.5);
  
    
    this._momento.turnstampVel = turnstampConstantVel + turnstampConstantSineVel + turnstampSqueazeBeatSineVel;
   
    //this._momento.turnstampVel += (this._momento.squeazeBeatstampVel - this._momento.beatstampVel) / 12;      
    
    this._momento.turnstampPos += this._momento.dt * this._momento.turnstampVel;
    this._momento.turnstampPos = safemod(this._momento.turnstampPos, 1);
  }

  /* declare */ _onKernelReset() {
    //super._onKernelReset();
    this._resetMomento();
  }
  /* declare */ _onKernelMomento() {
    //super._onKernelMomento();
    this._updateMomentoTime();
    this._liveMomento();
  }
}

export default MomentoRenderer;AbstractIterativeRenderer