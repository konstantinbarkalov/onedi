'use strict';
// ES6
import IonizedRenderer from './ionizedRenderer';
import Helper from './../helper.js';
import { EventEmitter } from 'events';

let safemod = Helper.safemod;
class MomentoRenderer extends IonizedRenderer {

  /* extend */ static get _defaultInitialOptions() {
    return Object.assign({}, super._defaultInitialOptions, {
      iterationSteps: [
        ...super._defaultInitialOptions.iterationSteps,
        'momento',
      ],
      beatsPerSquare: 16,
    });
  }

  /* extend */ static get _defaultRuntimeOptions() {
    return Object.assign({}, super._defaultRuntimeOptions, {
      beatsPerLoop: 8,
      beatsPerJump: 2,
      beatsPerHit: 4,
      bpm: 175,
    });
  }

  _construct() {
    super._construct();
    this._momento = {
      // keys and zero values will be filled in _resetMomento() via _reset()
    }
  }

  _resetMomento(){
    this._momento.squareStampPos = 0;
    this._momento.squareStampVel = 0;

    this._momento.loopStampPos = 0;
    this._momento.loopStampVel = 0;

    this._momento.beatStampPos = 0;
    this._momento.beatStampVel = 0;

    this._momento.hitStampPos = 0;
    this._momento.hitStampVel = 0;
    this._momento.squeazeHitStampPos = 0;
    this._momento.squeazeHitStampVel = 0;

    this._momento.jumpStampPos = 0;
    this._momento.jumpStampVel = 0;
    this._momento.squeazeJumpStampPos = 0;
    this._momento.squeazeJumpStampVel = 0;

    this._momento.turnStampPos = 0;
    this._momento.turnStampVel = 0;

  }

  _updateMomentoStamps() {
    // square is master
    this._momento.squareStampVel = this._runtimeOptions.bpm / 60 / this._initialOptions.beatsPerSquare;
    this._momento.squareStampPos += this._time.dt * this._momento.squareStampVel;
    this._momento.squareStampPos = safemod(this._momento.squareStampPos, 1);

    // slave stamps
    this._momento.loopStampPos = this._momento.squareStampPos * this._initialOptions.beatsPerSquare / this._runtimeOptions.beatsPerLoop;
    this._momento.loopStampVel = this._momento.squareStampVel * this._initialOptions.beatsPerSquare / this._runtimeOptions.beatsPerLoop;
    this._momento.loopStampPos = safemod(this._momento.loopStampPos, 1);

    this._momento.beatStampPos = this._momento.squareStampPos * this._initialOptions.beatsPerSquare;
    this._momento.beatStampVel = this._momento.squareStampVel * this._initialOptions.beatsPerSquare;
    this._momento.beatStampPos = safemod(this._momento.beatStampPos, 1);

    this._momento.jumpStampPos = this._momento.squareStampPos * this._initialOptions.beatsPerSquare / this._runtimeOptions.beatsPerJump;
    this._momento.jumpStampVel = this._momento.squareStampVel * this._initialOptions.beatsPerSquare / this._runtimeOptions.beatsPerJump;
    this._momento.jumpStampPos = safemod(this._momento.jumpStampPos, 1);

    this._momento.hitStampPos = this._momento.squareStampPos * this._initialOptions.beatsPerSquare / this._runtimeOptions.beatsPerHit;
    this._momento.hitStampVel = this._momento.squareStampVel * this._initialOptions.beatsPerSquare / this._runtimeOptions.beatsPerHit;
    this._momento.hitStampPos = safemod(this._momento.hitStampPos, 1);

    // map linear beatStamp to squeaze ease
    let x = this._momento.jumpStampPos;
    let bratio = 1 - this._input.analogE.value * 2;
    let a = Math.pow(2, bratio);
    this._momento.squeazeJumpStampPos = Math.pow(x, a);
    this._momento.squeazeJumpStampVel = a * Math.pow(x, a - 1) * this._momento.jumpStampVel;
    this._momento.squeazeJumpStampPos = safemod(this._momento.squeazeJumpStampPos, 1);
    this._momento.squeazeDiffJumpStampPos = this._momento.squeazeJumpStampPos - this._momento.jumpStampPos;
    this._momento.squeazeDiffJumpStampVel = this._momento.squeazeJumpStampVel - this._momento.jumpStampVel;
    let skipTime = skipTime;
    if (!skipTime) {
      console.log('----');
      console.log('jumpStampVel', this._momento.jumpStampVel);
      console.log('squeazeJumpStampVel', this._momento.squeazeJumpStampVel);
      console.log('squeazeDiffJumpStampVel', this._momento.squeazeDiffJumpStampVel);
      console.log('jumpStampPos', this._momento.jumpStampPos);
      skipTime = 1;
    } else {
      skipTime++;
      skipTime %= 6;
    }

    let turnStampConstantVel = (this._input.analogA.value - 0.5) * 2;
    let turnStampConstantSineVel = Math.sin(Date.now()/3000) * 0.1 * 0;
    let turnStampSqueazeJumpSineVel = - this._momento.squeazeDiffJumpStampVel * (this._input.analogC.value - 0.5);


    this._momento.turnStampVel = turnStampConstantVel + turnStampConstantSineVel + turnStampSqueazeJumpSineVel;

    this._momento.turnStampPos += this._time.dt * this._momento.turnStampVel;
    this._momento.turnStampPos = safemod(this._momento.turnStampPos, 1);
  }

  /* extend */ _onKernelReset() {
    super._onKernelReset();
    this._resetMomento();
  }
  /* declare */ _onKernelMomento() {
    //super._onKernelMomento();
    this._updateMomentoStamps();
  }
}

export default MomentoRenderer;