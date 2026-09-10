// 46英语 - 磨耳朵连续自动听词引擎 (Earworm Audio Stream Engine)
// 支持按组自动连续播报：英文单词 -> 间隔停顿 -> 英文/例句，自动切换下一词，解放双手

const { playWordAudio, addAudioListener, stopWordAudio } = require('./audio');

class EarwormPlayer {
  public words: any[];
  public currentIndex: number;
  public isPlaying: boolean;
  public loopCount: number;
  public currentLoop: number;
  public intervalMs: number;
  public _timer: any;
  public _unsub: any;
  public onWordChange: ((word: any, index: number) => void) | null;
  public onStateChange: ((playing: boolean) => void) | null;
  public onFinish: (() => void) | null;

  constructor() {
    this.words = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.loopCount = 1; // 每个词播放次数
    this.currentLoop = 0;
    this.intervalMs = 1800; // 词与词之间的停顿时间
    this._timer = null;
    this._unsub = null;
    this.onWordChange = null;
    this.onStateChange = null;
    this.onFinish = null;
  }

  setPlaylist(words, startIndex = 0) {
    this.words = Array.isArray(words) ? words : [];
    this.currentIndex = Math.max(0, Math.min(startIndex, this.words.length - 1));
    this.currentLoop = 0;
  }

  start() {
    if (!this.words.length) return;
    this.isPlaying = true;
    this.currentLoop = 0;
    this._bindAudioEvents();
    this._notifyState(true);
    this._playCurrent();
  }

  pause() {
    this.isPlaying = false;
    this._clearTimer();
    stopWordAudio();
    this._notifyState(false);
  }

  stop() {
    this.pause();
    this.currentIndex = 0;
    this.currentLoop = 0;
    this._unbindAudioEvents();
  }

  next() {
    this._clearTimer();
    stopWordAudio();
    if (this.currentIndex < this.words.length - 1) {
      this.currentIndex++;
      this.currentLoop = 0;
      if (this.isPlaying) {
        this._playCurrent();
      } else {
        this._notifyWord();
      }
    } else {
      this.stop();
      if (typeof this.onFinish === 'function') {
        this.onFinish();
      }
    }
  }

  prev() {
    this._clearTimer();
    stopWordAudio();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentLoop = 0;
      if (this.isPlaying) {
        this._playCurrent();
      } else {
        this._notifyWord();
      }
    }
  }

  _playCurrent() {
    if (!this.isPlaying || this.currentIndex >= this.words.length) return;
    const word = this.words[this.currentIndex];
    if (!word || !word.word) return;

    this._notifyWord();
    playWordAudio(word.word);
  }

  _bindAudioEvents() {
    if (this._unsub) return;
    this._unsub = addAudioListener((event) => {
      if (!this.isPlaying) return;
      if (event === 'ended' || event === 'error') {
        this._handleAudioEnded();
      }
    });
  }

  _unbindAudioEvents() {
    if (typeof this._unsub === 'function') {
      this._unsub();
      this._unsub = null;
    }
  }

  _handleAudioEnded() {
    this.currentLoop++;
    if (this.currentLoop < this.loopCount) {
      this._timer = setTimeout(() => {
        if (this.isPlaying) this._playCurrent();
      }, 800);
    } else {
      this.currentLoop = 0;
      this._timer = setTimeout(() => {
        if (this.isPlaying) this.next();
      }, this.intervalMs);
    }
  }

  _clearTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _notifyWord() {
    if (typeof this.onWordChange === 'function' && this.words[this.currentIndex]) {
      this.onWordChange(this.words[this.currentIndex], this.currentIndex);
    }
  }

  _notifyState(playing) {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(playing);
    }
  }
}

module.exports = {
  EarwormPlayer,
};
