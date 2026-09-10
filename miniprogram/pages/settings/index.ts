// 设置页
const { storage, STORAGE_KEYS } = require('../../utils/storage');
const {
  setTargetRetention,
  getFSRSWeights,
  setFSRSWeights,
  DEFAULT_FSRS_W,
} = require('../../utils/fsrs');
const { CONFIG } = require('../../utils/config');
const { createBackup, parseBackup, MAX_BACKUP_BYTES } = require('../../utils/backup');
const {
  MAX_CUSTOM_WORDS,
  normalizeCustomWords,
  mergeCustomStores,
} = require('../../utils/custom-vocab');
const {
  getAudioAccent,
  setAudioAccent,
  getAutoPlay,
  setAutoPlay,
} = require('../../utils/audio');
const { syncNativeTheme } = require('../../utils/theme');

function getAppInstance() {
  return typeof getApp === 'function' ? getApp() : null;
}

Page({
  data: {
    targetRetention: 0.9,
    retentionIndex: 1,
    retentionLabel: '90%（平衡）',
    retentionOptions: [
      { value: 0.85, label: '85%（较少复习）' },
      { value: 0.9, label: '90%（平衡）' },
      { value: 0.95, label: '95%（更少遗忘）' },
    ],
    storageInfo: '',
    studyLimitIndex: 1,
    studyLimitLabel: '20 个/组',
    spellingLimitIndex: 1,
    spellingLimitLabel: '20 个/组',
    limitOptions: [
      { value: 10, label: '10 个/组' },
      { value: 20, label: '20 个/组' },
      { value: 25, label: '25 个/组' },
      { value: 30, label: '30 个/组' },
      { value: 50, label: '50 个/组' },
      { value: 100, label: '100 个/组' },
      { value: -1, label: '✏️ 自定义题量...' },
    ],
    dailyGoalIndex: 1,
    dailyGoalLabel: '20 词/天',
    goalOptions: [
      { value: 10, label: '10 词/天' },
      { value: 20, label: '20 词/天' },
      { value: 25, label: '25 词/天' },
      { value: 30, label: '30 词/天' },
      { value: 50, label: '50 词/天' },
      { value: 100, label: '100 词/天' },
      { value: -1, label: '✏️ 自定义目标...' },
    ],
    autoShowMeaning: true,
    accentIndex: 0,
    accentLabel: '美式发音 (US)',
    accentOptions: [
      { value: '2', label: '美式发音 (US)' },
      { value: '1', label: '英式发音 (UK)' },
    ],
    autoPlay: false,
    backupBusy: false,
    customWordCount: 0,
    exportModalVisible: false,
    exportJsonText: '',
    exportSummary: '',
    importModalVisible: false,
    importModalType: 'backup',
    importModalTitle: '',
    importModalTip: '',
    importModalPlaceholder: '',
    importJsonInput: '',
  },

  onShow() {
    const app = getAppInstance();
    const targetRetention = (app && app.globalData && app.globalData.targetRetention) || 0.9;
    const options = this.data.retentionOptions;
    const retentionIndex = options.findIndex(o => o.value === targetRetention);

    const studyLimit = (app && app.globalData && app.globalData.settings && app.globalData.settings.studyLimit) || 20;
    const spellingLimit = (app && app.globalData && app.globalData.settings && app.globalData.settings.spellingLimit) || 20;
    const customLimitIdx = this.data.limitOptions.findIndex(o => o.value === -1);

    const sLimitIdx = this.data.limitOptions.findIndex(o => o.value === studyLimit);
    const studyLimitIndex = sLimitIdx >= 0 ? sLimitIdx : (customLimitIdx >= 0 ? customLimitIdx : 1);
    const studyLimitLabel = sLimitIdx >= 0 ? this.data.limitOptions[sLimitIdx].label : `${studyLimit} 个/组 (自定义)`;

    const spLimitIdx = this.data.limitOptions.findIndex(o => o.value === spellingLimit);
    const spellingLimitIndex = spLimitIdx >= 0 ? spLimitIdx : (customLimitIdx >= 0 ? customLimitIdx : 1);
    const spellingLimitLabel = spLimitIdx >= 0 ? this.data.limitOptions[spLimitIdx].label : `${spellingLimit} 个/组 (自定义)`;

    const dailyGoal = (app && app.globalData && app.globalData.settings && app.globalData.settings.dailyGoal) || 20;
    const customGoalIdx = this.data.goalOptions.findIndex(o => o.value === -1);
    const dGoalIdx = this.data.goalOptions.findIndex(o => o.value === dailyGoal);
    const dailyGoalIndex = dGoalIdx >= 0 ? dGoalIdx : (customGoalIdx >= 0 ? customGoalIdx : 1);
    const dailyGoalLabel = dGoalIdx >= 0 ? this.data.goalOptions[dGoalIdx].label : `${dailyGoal} 词/天 (自定义)`;

    const autoShowMeaning = (app && app.globalData && app.globalData.settings && app.globalData.settings.autoShowMeaning !== undefined)
      ? Boolean(app.globalData.settings.autoShowMeaning)
      : true;

    const currentAccent = getAudioAccent();
    const accentIndex = this.data.accentOptions.findIndex(o => o.value === currentAccent);
    const autoPlay = getAutoPlay();

    const customWords = (app && app.globalData && app.globalData.customWords) || {};
    const customWordCount = ((customWords.CET4 || []).length) + ((customWords.CET6 || []).length);

    this.setData({
      targetRetention,
      retentionIndex: retentionIndex >= 0 ? retentionIndex : 1,
      retentionLabel: options[retentionIndex >= 0 ? retentionIndex : 1].label,
      studyLimitIndex,
      studyLimitLabel,
      spellingLimitIndex,
      spellingLimitLabel,
      dailyGoalIndex,
      dailyGoalLabel,
      autoShowMeaning,
      accentIndex: accentIndex >= 0 ? accentIndex : 0,
      accentLabel: this.data.accentOptions[accentIndex >= 0 ? accentIndex : 0].label,
      autoPlay,
      customWordCount,
    });
    this.getStorageInfo();
  },

  getStorageInfo() {
    try {
      const info = wx.getStorageInfoSync();
      this.setData({
        storageInfo: `已用 ${info.currentSize}KB / ${info.limitSize}KB`,
      });
    } catch (e) {
      this.setData({ storageInfo: '无法获取' });
    }
  },

  onAutoShowMeaningChange(e: any) {
    const autoShowMeaning = Boolean(e.detail.value);
    this.setData({ autoShowMeaning });
    const app = getAppInstance();
    if (app && app.globalData) {
      if (!app.globalData.settings) app.globalData.settings = {};
      app.globalData.settings.autoShowMeaning = autoShowMeaning;
      if (typeof app.saveProgress === 'function') app.saveProgress();
    }
    wx.showToast({
      title: autoShowMeaning ? '已开启直接显示释义' : '已开启自测难度模式',
      icon: 'none',
    });
  },

  onAccentChange(e) {
    const index = Number(e.detail.value);
    const option = this.data.accentOptions[index];
    if (!option) return;
    setAudioAccent(option.value);
    this.setData({ accentIndex: index, accentLabel: option.label });
    wx.showToast({ title: '发音已更新', icon: 'success' });
  },

  onAutoPlayChange(e) {
    const value = Boolean(e.detail.value);
    setAutoPlay(value);
    this.setData({ autoPlay: value });
    wx.showToast({ title: value ? '已开启自动发音' : '已关闭自动发音', icon: 'success' });
  },

  onRetentionChange(e) {
    const index = Number(e.detail.value);
    const option = this.data.retentionOptions[index];
    const value = option.value;
    const app = getAppInstance();
    if (app && app.globalData) {
      app.globalData.targetRetention = value;
      if (!app.globalData.settings) app.globalData.settings = {};
      app.globalData.settings.targetRetention = value;
      app.saveProgress();
    }
    setTargetRetention(value);
    this.setData({ targetRetention: value, retentionIndex: index, retentionLabel: option.label });
    wx.showToast({ title: '已更新', icon: 'success' });
  },

  onStudyLimitChange(e) {
    this.updateLimitSetting('studyLimit', 'studyLimitIndex', 'studyLimitLabel', e);
  },

  onSpellingLimitChange(e) {
    this.updateLimitSetting('spellingLimit', 'spellingLimitIndex', 'spellingLimitLabel', e);
  },

  onDailyGoalChange(e) {
    const index = Number(e.detail.value);
    const option = this.data.goalOptions[index];
    if (!option) return;
    if (option.value === -1) {
      this.promptCustomNumber({
        title: '自定义每日目标',
        unit: '词/天',
        settingKey: 'dailyGoal',
        indexKey: 'dailyGoalIndex',
        labelKey: 'dailyGoalLabel',
        options: this.data.goalOptions,
        min: 5,
        max: 500,
      });
      return;
    }
    const app = getAppInstance();
    if (app && app.globalData) {
      if (!app.globalData.settings) app.globalData.settings = {};
      app.globalData.settings.dailyGoal = option.value;
      app.saveProgress();
    }
    this.setData({ dailyGoalIndex: index, dailyGoalLabel: option.label });
    wx.showToast({ title: `每日目标设为 ${option.value} 词`, icon: 'success' });
  },

  updateLimitSetting(settingKey, indexKey, labelKey, e) {
    const index = Number(e.detail.value);
    const option = this.data.limitOptions[index];
    if (!option) return;
    if (option.value === -1) {
      this.promptCustomNumber({
        title: settingKey === 'studyLimit' ? '自定义新词学习量' : '自定义拼写训练量',
        unit: '个/组',
        settingKey,
        indexKey,
        labelKey,
        options: this.data.limitOptions,
        min: 5,
        max: 300,
      });
      return;
    }
    const app = getAppInstance();
    if (app && app.globalData) {
      if (!app.globalData.settings) app.globalData.settings = {};
      app.globalData.settings[settingKey] = option.value;
      app.saveProgress();
    }
    this.setData({ [indexKey]: index, [labelKey]: option.label });
    wx.showToast({ title: '已更新', icon: 'success' });
  },

  promptCustomNumber({ title, unit, settingKey, indexKey, labelKey, options, min, max }: any) {
    const app = getAppInstance();
    const currentVal = (app && app.globalData && app.globalData.settings && app.globalData.settings[settingKey]) || 20;
    wx.showModal({
      title,
      editable: true,
      placeholderText: `请输入 ${min}-${max} 之间的数字`,
      content: String(currentVal),
      confirmText: '确定',
      cancelText: '取消',
      success: (res: any) => {
        if (res.confirm) {
          const val = parseInt((res.content || '').trim(), 10);
          if (isNaN(val) || val < min || val > max) {
            wx.showToast({
              title: `请输入 ${min}-${max} 的有效数字`,
              icon: 'none',
            });
            return;
          }
          if (app && app.globalData) {
            if (!app.globalData.settings) app.globalData.settings = {};
            app.globalData.settings[settingKey] = val;
            app.saveProgress();
          }
          const customIdx = options.findIndex((o: any) => o.value === -1);
          const matchedIdx = options.findIndex((o: any) => o.value === val);
          const finalIndex = matchedIdx >= 0 ? matchedIdx : (customIdx >= 0 ? customIdx : 0);
          const finalLabel = matchedIdx >= 0 ? options[matchedIdx].label : `${val} ${unit} (自定义)`;
          this.setData({
            [indexKey]: finalIndex,
            [labelKey]: finalLabel,
          });
          wx.showToast({ title: `已设为 ${val} ${unit}`, icon: 'success' });
        }
      },
    });
  },

  exportData() {
    const app = getAppInstance();
    if (!app) return;
    this.setData({ backupBusy: true });
    let jsonStr = '';
    try {
      app.flushProgress();
      const backupObj = createBackup(app.globalData, getFSRSWeights());
      jsonStr = JSON.stringify(backupObj, null, 2);
    } catch (e: any) {
      this.setData({ backupBusy: false });
      wx.showModal({ title: '导出失败', content: e.message || '生成备份失败', showCancel: false });
      return;
    }
    this.setData({ backupBusy: false });

    const progressCount = Object.keys(app.globalData.progress || {}).length;
    const wrongCount = (app.globalData.wrongWords || []).length;
    const customCount = this.data.customWordCount || 0;

    this.setData({
      exportModalVisible: true,
      exportJsonText: jsonStr,
      exportSummary: `已学词汇: ${progressCount} 词 · 待巩固错词: ${wrongCount} 词 · 个人词库: ${customCount} 词`,
    });
  },

  closeExportModal() {
    this.setData({
      exportModalVisible: false,
      exportJsonText: '',
      exportSummary: '',
    });
  },

  importData() {
    this.setData({
      importModalVisible: true,
      importModalType: 'backup',
      importModalTitle: '📥 恢复进度备份',
      importModalTip: '请在下方粘贴备份 JSON 文本（恢复后将覆盖当前设备上的学习记录）：',
      importModalPlaceholder: '在此粘贴备份 JSON 文本...',
      importJsonInput: '',
    });
  },

  applyImportedData(data) {
    const app = getAppInstance();
    if (!app) return;
    const snapshot = {
      progress: app.globalData.progress,
      wrongWords: app.globalData.wrongWords,
      heatmap: app.globalData.heatmap,
      settings: app.globalData.settings,
      customWords: app.globalData.customWords,
      currentLevel: app.globalData.currentLevel,
      targetRetention: app.globalData.targetRetention,
      weights: getFSRSWeights(),
    };
    if (typeof app.cancelPendingSave === 'function') app.cancelPendingSave();
    app.globalData.progress = data.progress;
    app.globalData.wrongWords = data.wrongWords;
    app.globalData.heatmap = data.heatmap;
    app.globalData.settings = data.settings;
    app.globalData.currentLevel = data.currentLevel;
    app.globalData.targetRetention = data.settings.targetRetention;
    const customWordsSaved = app.setCustomWords(data.customWords);
    setTargetRetention(data.settings.targetRetention);
    if (data.fsrsWeights) setFSRSWeights(data.fsrsWeights);

    if (!customWordsSaved || !app.flushProgress()) {
      app.globalData.progress = snapshot.progress;
      app.globalData.wrongWords = snapshot.wrongWords;
      app.globalData.heatmap = snapshot.heatmap;
      app.globalData.settings = snapshot.settings;
      app.globalData.currentLevel = snapshot.currentLevel;
      app.globalData.targetRetention = snapshot.targetRetention;
      app.setCustomWords(snapshot.customWords);
      setTargetRetention(snapshot.targetRetention);
      setFSRSWeights(snapshot.weights);
      app.flushProgress();
      wx.showModal({ title: '恢复失败', content: '存储空间不足，原有数据已恢复。', showCancel: false });
      return;
    }
    this.onShow();
    const note = data.ignoredCustomWords ? '；自定义词库未导入，已继续使用小程序内置词库' : '';
    wx.showModal({ title: '恢复完成', content: `学习进度已恢复${note}`, showCancel: false });
  },

  resetFSRSWeights() {
    if (setFSRSWeights(DEFAULT_FSRS_W)) {
      wx.showToast({ title: '已恢复默认权重', icon: 'success' });
    }
  },

  importCustomVocab() {
    this.setData({
      importModalVisible: true,
      importModalType: 'custom',
      importModalTitle: '📚 导入个人自定义词库',
      importModalTip: '请在下方粘贴包含 word 与 meaning 字段的 JSON 文本：',
      importModalPlaceholder: '[{"word": "example", "meaning": "例子"}, ...]',
      importJsonInput: '',
    });
  },

  closeImportModal() {
    this.setData({
      importModalVisible: false,
      importJsonInput: '',
    });
  },

  onImportJsonInput(e: any) {
    this.setData({
      importJsonInput: e.detail.value || '',
    });
  },

  preventTouchMove() {
    // 阻止弹窗蒙层穿透滑动
  },

  confirmImportModal() {
    const text = (this.data.importJsonInput || '').trim();
    if (!text) {
      wx.showToast({ title: '内容为空', icon: 'none' });
      return;
    }

    if (this.data.importModalType === 'backup') {
      try {
        const data = parseBackup(text);
        this.closeImportModal();
        this.applyImportedData(data);
      } catch (error: any) {
        wx.showModal({ title: '解析失败', content: error.message || '备份数据格式无效', showCancel: false });
      }
    } else if (this.data.importModalType === 'custom') {
      const app = getAppInstance();
      if (!app) return;
      try {
        const raw = JSON.parse(text);
        const source = Array.isArray(raw) ? raw : raw.words;
        const incoming = normalizeCustomWords(source, app.globalData.currentLevel);
        const count = incoming.CET4.length + incoming.CET6.length;
        if (!count) throw new Error('没有找到有效单词，需要 word 和 meaning 字段');
        const merged = mergeCustomStores(app.globalData.customWords, incoming);
        if (!app.setCustomWords(merged)) {
          wx.showToast({ title: '个人词库保存失败', icon: 'none' });
          return;
        }
        app.flushProgress();
        this.closeImportModal();
        this.onShow();
        wx.showToast({ title: `成功导入 ${count} 词`, icon: 'success' });
      } catch (error: any) {
        wx.showModal({ title: '词库导入失败', content: error.message || 'JSON 格式错误', showCancel: false });
      }
    }
  },

  clearCustomVocab() {
    if (!this.data.customWordCount) return;
    wx.showModal({
      title: '清空个人词库',
      content: '只删除导入的个人单词，不影响内置词库和已有学习记录。',
      confirmColor: '#c41e3a',
      success: result => {
        if (!result.confirm) return;
        const app = getAppInstance();
        if (app) {
          app.setCustomWords({ CET4: [], CET6: [] });
          app.flushProgress();
        }
        this.onShow();
        wx.showToast({ title: '个人词库已清空', icon: 'success' });
      },
    });
  },

  clearData() {
    wx.showModal({
      title: '清除数据',
      content: '确定要清除所有学习记录吗？此操作不可恢复。',
      confirmColor: '#f56565',
      success: (res) => {
        if (res.confirm) {
          const app = getAppInstance();
          if (app && typeof app.cancelPendingSave === 'function') app.cancelPendingSave();
          if (!storage.clear()) {
            wx.showToast({ title: '清除失败，请稍后重试', icon: 'none' });
            return;
          }
          if (app) {
            app.globalData.progress = {};
            app.globalData.wrongWords = [];
            app.globalData.heatmap = {};
            app.globalData.words = [];
            app.globalData.baseWords = [];
            app.globalData.customWords = { CET4: [], CET6: [] };
            app.globalData.settings = {};
            app.globalData.currentLevel = 'CET4';
            app.globalData.vocabLoaded = false;
            app.globalData.loadedLevel = null;
            app.globalData.targetRetention = 0.9;
          }
          setTargetRetention(0.9);
          setFSRSWeights(DEFAULT_FSRS_W);
          const defaultIndex = 1;
          this.setData({
            targetRetention: 0.9,
            retentionIndex: defaultIndex,
            retentionLabel: this.data.retentionOptions[defaultIndex].label,
            studyLimitIndex: defaultIndex,
            studyLimitLabel: this.data.limitOptions[defaultIndex].label,
            spellingLimitIndex: defaultIndex,
            spellingLimitLabel: this.data.limitOptions[defaultIndex].label,
            dailyGoalIndex: defaultIndex,
            dailyGoalLabel: this.data.goalOptions[defaultIndex].label,
            accentIndex: 0,
            accentLabel: this.data.accentOptions[0].label,
            autoPlay: false,
            customWordCount: 0,
          });
          wx.showToast({ title: '已清除', icon: 'success' });
          this.getStorageInfo();
        }
      },
    });
  },

  showPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  },

  showAbout() {
    wx.showModal({
      title: '关于 46英语',
      content: `46英语 v${CONFIG.VERSION}\n基于 FSRS 的科学调度\n本地存储，离线可用`,
      showCancel: false,
    });
  },
});
