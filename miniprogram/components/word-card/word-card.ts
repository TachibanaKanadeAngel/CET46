const { playWordAudio, playSentenceAudio, getAutoPlay, addAudioListener } = require('../../utils/audio');
const { generateCloze } = require('../../utils/learning-aids');
const { analyzeMorphology, extractCollocations } = require('../../utils/multi-modal');

Component({
  options: {
    styleIsolation: 'shared',
  },
  properties: {
    word: {
      type: Object,
      value: {},
    },
    flipped: {
      type: Boolean,
      value: false,
    },
    cloze: {
      type: Boolean,
      value: false,
    },
    listenMode: {
      type: Boolean,
      value: false,
    },
    wordFamily: {
      type: Array,
      value: [],
    },
    mnemonicHints: {
      type: Array,
      value: [],
    },
  },
  data: {
    displayExample: '',
    isPlaying: false,
    morphology: null,
    collocations: [],
  },
  lifetimes: {
    attached() {
      this._unsubAudio = addAudioListener((event, word) => {
        if (!this.data.word || !this.data.word.word) return;
        const currentWord = (this.data.word.word || '').trim().toLowerCase();
        const targetWord = (word || '').trim().toLowerCase();

        if (currentWord === targetWord) {
          if (event === 'play') {
            this.setData({ isPlaying: true });
          } else if (event === 'ended' || event === 'stop' || event === 'error') {
            this.setData({ isPlaying: false });
          }
        } else {
          if (this.data.isPlaying) {
            this.setData({ isPlaying: false });
          }
        }
      });
    },
    detached() {
      if (typeof this._unsubAudio === 'function') {
        this._unsubAudio();
      }
    },
  },
  observers: {
    'word, cloze': function onWordOrClozeChange(word, cloze) {
      const displayExample = cloze ? generateCloze(word && word.word, word && word.example) : (word && word.example) || '';
      const morphology = word && word.word ? analyzeMorphology(word.word) : null;
      const collocations = word && word.word && word.example ? extractCollocations(word.word, word.example) : [];
      this.setData({
        displayExample,
        morphology,
        collocations,
      });
    },
    'flipped': function onFlippedChange(flipped) {
      if (flipped && getAutoPlay() && this.data.word && this.data.word.word) {
        playWordAudio(this.data.word.word);
      }
    },
    'word, listenMode': function onListenModeTrigger(word, listenMode) {
      if (listenMode && word && word.word && !this.data.flipped) {
        playWordAudio(word.word);
      }
    },
  },
  methods: {
    onFlip() {
      if (this.data.flipped) return;
      this.triggerEvent('flip');
    },
    onRevealCloze() {
      if (!this.data.cloze) return;
      this.triggerEvent('revealexample');
    },
    onPlayAudio(e) {
      if (!this.data.word || !this.data.word.word) return;
      playWordAudio(this.data.word.word);
    },
    onPlayExampleAudio() {
      const example = this.data.word && this.data.word.example;
      if (!example) return;
      playSentenceAudio(example);
    },
    onFollowRead() {
      const example = this.data.word && this.data.word.example;
      if (!example) return;
      playSentenceAudio(example);
      wx.showModal({
        title: '📣 跟读提示',
        content: '请模仿原声朗读一遍，再对照文字检查发音。发音需自行听辨（轻量版不评分）。',
        showCancel: true,
        cancelText: '关闭',
        confirmText: '重听原声',
        success: res => {
          if (res.confirm) playSentenceAudio(example);
        },
      });
    },
    onPreviewFamily(e) {
      const word = e.currentTarget.dataset.word;
      if (!word) return;
      wx.showModal({
        title: word.word,
        content: [word.phonetic, word.meaning, word.example].filter(Boolean).join('\n'),
        showCancel: false,
      });
    },
  },
});
