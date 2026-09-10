const { loadCommonJS, assert } = require('./load-module.cjs');

function createWx() {
  const values = {};
  const toasts = [];
  let networkHandler = null;
  let mockAudioInstance = {
    src: '',
    obeyMuteSwitch: true,
    play: function() {
      if (this._onPlay) this._onPlay();
    },
    stop: function() {
      if (this._onStop) this._onStop();
    },
    onPlay: function(fn) { this._onPlay = fn; },
    onEnded: function(fn) { this._onEnded = fn; },
    onStop: function(fn) { this._onStop = fn; },
    onError: function(fn) { this._onError = fn; },
  };

  return {
    values,
    mockAudioInstance,
    toasts,
    getStorageSync(key) { return values[key] === undefined ? '' : values[key]; },
    setStorageSync(key, value) { values[key] = value; },
    removeStorageSync(key) { delete values[key]; },
    clearStorageSync() { Object.keys(values).forEach(key => delete values[key]); },
    createInnerAudioContext() { return mockAudioInstance; },
    getNetworkType(opts) { if (opts && opts.success) opts.success({ networkType: 'wifi' }); },
    onNetworkStatusChange(fn) { networkHandler = fn; },
    __simulateOffline(offline) { if (networkHandler) networkHandler({ isConnected: !offline }); },
    showToast(opts) { toasts.push(opts); },
  };
}

function run() {
  const wx = createWx();
  const audio = loadCommonJS('utils/audio.js', { wx });

  // 1. 测试 URL 生成
  const usUrl = audio.getWordAudioUrl('abandon', '2');
  assert(usUrl === 'https://dict.youdao.com/dictvoice?audio=abandon&type=2', '应生成有道美音 URL');

  const ukUrl = audio.getWordAudioUrl('abandon', '1');
  assert(ukUrl === 'https://dict.youdao.com/dictvoice?audio=abandon&type=1', '应生成有道英音 URL');

  // 1b. 例句原声 URL：自动剥离中文括号部分与句末标点
  const sentUrl = audio.getSentenceAudioUrl('He abandon the plan. (他放弃了计划。)', '2');
  assert(sentUrl === 'https://dict.youdao.com/dictvoice?audio=He%20abandon%20the%20plan&type=2', '应生成例句原声 URL（取英文部分）');
  assert(audio.getSentenceAudioUrl('', '2') === '', '空例句应返回空 URL');

  // 2. 测试口音偏好设置
  audio.setAudioAccent('1');
  assert(audio.getAudioAccent() === '1', '设置英音偏好成功');
  assert(wx.values[audio.STORAGE_KEY_ACCENT] === '1', '口音偏好应持久化');

  audio.setAudioAccent('2');
  assert(audio.getAudioAccent() === '2', '设置美音偏好成功');

  // 3. 测试音频播放与事件监听
  let playEventReceived = false;
  const unsub = audio.addAudioListener((event, word) => {
    if (event === 'play' && word === 'test') {
      playEventReceived = true;
    }
  });

  const playRes = audio.playWordAudio('test');
  assert(playRes === true, '触发音频播放应返回 true');
  assert(wx.mockAudioInstance.src === 'https://dict.youdao.com/dictvoice?audio=test&type=2', '音频 src 应为对应单词');
  assert(playEventReceived === true, '应收到 play 广播事件');
  unsub();

  // 4. 测试自动播放开关
  audio.setAutoPlay(true);
  assert(audio.getAutoPlay() === true, '开启自动播放');
  assert(wx.values[audio.STORAGE_KEY_AUTOPLAY] === '1', '自动播放偏好应持久化');

  audio.setAutoPlay(false);
  assert(audio.getAutoPlay() === false, '关闭自动播放');

  // 5. 离线降级：模拟断网后播放应被拦截并广播 degraded 事件
  const degradedEvents = [];
  const unsubDegraded = audio.addAudioListener(event => {
    if (event === 'degraded') degradedEvents.push(event);
  });
  wx.__simulateOffline(true);
  const srcBeforeOffline = wx.mockAudioInstance.src;
  const offlineRes = audio.playWordAudio('test');
  assert(offlineRes === false, '离线时应拦截播放并返回 false');
  assert(degradedEvents.length === 1, '离线播放应广播 degraded 事件');
  assert(wx.toasts.length === 1 && wx.toasts[0].title.includes('离线'), '离线应触发可见 toast 提示');
  assert(wx.mockAudioInstance.src === srcBeforeOffline, '离线时不应更新音频 src');

  // 恢复联网后应可正常播放
  wx.__simulateOffline(false);
  const onlineRes = audio.playWordAudio('test');
  assert(onlineRes === true, '恢复联网后应正常触发播放');
  unsubDegraded();

  console.log('audio.test.cjs passed');
}

run();
