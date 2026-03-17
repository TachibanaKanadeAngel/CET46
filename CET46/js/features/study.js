import { AppState } from '../state.js';
import { shuffle, getWordData, setWordData as coreSetWordData, pushAction, updateFSRS, calculateFSRSInterval, applyFuzz, getPersonalizedCircadianFactor } from '../core.js';
import { UI, playTone, speak, setSafeWordHeader, generateCloze, announceForAccessibility } from '../ui.js';

let studyQueue = [];
let studyIndex = 0;
let studyFlipped = false;
let studyCycle = 1;
let studyTotal = 0;
let clozeModeEnabled = false;
let WORDS = [];

function setWords(words) {
  WORDS = words;
}

function getWords() {
  return WORDS;
}

function getStudyState() {
  return { queue: studyQueue, index: studyIndex, flipped: studyFlipped, cycle: studyCycle, total: studyTotal, clozeMode: clozeModeEnabled };
}

function saveStudySession(memoryCache, db) {
  if (studyQueue.length === 0) {
    memoryCache.session = null;
    if (db.instance) db.delete('session', 'current');
  } else {
    const sessionData = {
      queue: studyQueue.map(w => w.id),
      index: studyIndex,
      cycle: studyCycle,
      total: studyTotal
    };
    memoryCache.session = sessionData;
    if (db.instance) db.save('session', { key: 'current', data: sessionData });
  }
}

async function checkStudySession(memoryCache, db) {
  let session = memoryCache.session;
  if (!session && db.instance) {
    const result = await db.get('session', 'current');
    if (result) session = result.data;
  }
  
  const startBtn = document.getElementById('start-btn');

  if (session && session.queue && session.queue.length > 0) {
    startBtn.innerHTML = `🚀 继续上次学习 (剩余 ${session.queue.length} 词)`;
    return { hasSession: true, session };
  } else {
    startBtn.innerHTML = `🚀 开始新一轮学习`;
    return { hasSession: false, session: null };
  }
}

function resumeStudy(session) {
  studyQueue = session.queue.map(id => WORDS.find(w => w.id === id)).filter(Boolean);
  studyIndex = session.index;
  studyCycle = session.cycle;
  studyTotal = session.total;

  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('study-buttons').style.display = 'flex';
  document.getElementById('cloze-toggle').style.display = 'flex';
  document.getElementById('study-progress').style.display = 'block';
  document.getElementById('cycle-banner').style.display = 'flex';

  showStudyWord();
}

function toggleClozeMode() {
  clozeModeEnabled = !clozeModeEnabled;
  const btn = document.getElementById('btn-cloze');
  btn.textContent = `📝 完形填空: ${clozeModeEnabled ? '开启' : '关闭'}`;
  showStudyWord();
}

function startStudy(level, getData, memoryCache, db, options = {}) {
  if (options.overrideQueue) {
    studyQueue = [...options.overrideQueue];
  } else {
    studyQueue = WORDS.filter(w => {
      const matchLevel = level === 'all' || w.level === level;
      const wd = getWordData(w.id);
      return matchLevel && wd.status !== 'mastered';
    });
  }

  if (studyQueue.length === 0) {
    UI.toast('恭喜！你已经掌握了该级别的所有单词！', 'success');
    return false;
  }

  shuffle(studyQueue);
  studyIndex = 0;
  studyFlipped = false;
  studyCycle = 1;
  studyTotal = studyQueue.length;
  saveStudySession(memoryCache, db);

  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('study-buttons').style.display = 'flex';
  document.getElementById('cloze-toggle').style.display = 'flex';
  document.getElementById('study-progress').style.display = 'block';
  document.getElementById('cycle-banner').style.display = 'flex';

  showStudyWord();
  return true;
}

function showStudyWord(findConfusingWords, adjustForSemanticInterference, MIN_EF, MAX_EF, FSRS_W, getWordDataFn, renderAlgorithmTransparency) {
  if (studyIndex >= studyQueue.length) {
    if (studyQueue.length === 0) {
      finishStudy();
      return;
    }
    studyCycle++;
    studyIndex = 0;
    shuffle(studyQueue);
  }

  const w = studyQueue[studyIndex];
  setSafeWordHeader('study-word', w.word, w.level);
  document.getElementById('study-pron').textContent = w.phonetic;
  document.getElementById('study-meaning').textContent = w.meaning;
  
  const exampleEl = document.getElementById('study-example');
  if (clozeModeEnabled && w.example) {
    exampleEl.innerHTML = generateCloze(w.word, w.example);
  } else {
    exampleEl.textContent = w.example;
  }

  updateProgress();
  updateCycleInfo();
  
  if (findConfusingWords && MIN_EF && MAX_EF && FSRS_W && getWordDataFn && renderAlgorithmTransparency) {
    updateRelatedWords(w.word, findConfusingWords);
    updateEFDisplay(w.id, MIN_EF, MAX_EF, FSRS_W, getWordDataFn, renderAlgorithmTransparency);
  }
  
  studyFlipped = false;
  document.getElementById('study-card').classList.remove('flipped');

  document.getElementById('btn-unknown').disabled = true;
  document.getElementById('btn-known').disabled = true;
}

function updateRelatedWords(word, findConfusingWords) {
  const relatedWords = findConfusingWords(word);
  const relatedContainer = document.getElementById('related-words');
  const relatedList = document.getElementById('related-words-list');
  
  if (relatedWords.length > 0) {
    relatedList.innerHTML = '';
    relatedWords.slice(0, 4).forEach(rw => {
      const wordEntry = WORDS.find(w => w.word === rw);
      const span = document.createElement('span');
      span.style.margin = '0 4px';
      
      if (wordEntry) {
        const link = document.createElement('a');
        link.href = 'javascript:void(0)';
        link.style.color = '#a8d8ff';
        link.style.textDecoration = 'underline';
        link.textContent = rw;
        link.onclick = (e) => {
          e.stopPropagation();
          jumpToWord(wordEntry.id);
        };
        span.appendChild(link);
      } else {
        span.style.color = 'rgba(255,255,255,0.6)';
        span.textContent = rw;
      }
      relatedList.appendChild(span);
    });
    relatedContainer.style.display = 'block';
  } else {
    relatedContainer.style.display = 'none';
  }
}

function jumpToWord(wordId) {
  const word = WORDS.find(w => w.id === wordId);
  if (word) {
    studyQueue = [word];
    studyIndex = 0;
    studyTotal = 1;
    showStudyWord();
    document.getElementById('study-card').classList.add('flipped');
    studyFlipped = true;
    document.getElementById('btn-unknown').disabled = false;
    document.getElementById('btn-known').disabled = false;
  }
}

function updateEFDisplay(id, MIN_EF, MAX_EF, FSRS_W, getWordData, renderAlgorithmTransparency) {
  const wd = getWordData(id);
  const efDisplay = document.getElementById('ef-display');
  const efValue = document.getElementById('ef-value');
  const efFill = document.getElementById('ef-fill');

  efDisplay.style.display = 'block';
  efValue.textContent = wd.ef.toFixed(2);
  const efPercent = ((wd.ef - MIN_EF) / (MAX_EF - MIN_EF)) * 100;
  efFill.style.width = `${efPercent}%`;

  const stability = wd.stability || FSRS_W[0];
  const difficulty = wd.difficulty || FSRS_W[1];
  
  document.getElementById('stability-value').textContent = stability.toFixed(1);
  document.getElementById('difficulty-value').textContent = difficulty.toFixed(1);

  if (wd.lastStudy && wd.status === 'review') {
    const daysSinceReview = (Date.now() - wd.lastStudy) / (24 * 60 * 60 * 1000);
    const retention = Math.pow(0.9, daysSinceReview / stability) * 100;
    const retentionValue = document.getElementById('retention-value');
    const retentionDisplay = document.getElementById('retention-display');
    
    retentionValue.textContent = retention.toFixed(0) + '%';
    retentionDisplay.style.display = 'inline';
    
    if (retention < 50) {
      retentionValue.style.color = 'var(--danger)';
      retentionValue.style.fontWeight = 'bold';
      retentionValue.style.animation = 'pulse 1s infinite';
    } else if (retention < 80) {
      retentionValue.style.color = 'var(--warning)';
      retentionValue.style.fontWeight = 'normal';
      retentionValue.style.animation = 'none';
    } else {
      retentionValue.style.color = 'var(--success)';
      retentionValue.style.fontWeight = 'normal';
      retentionValue.style.animation = 'none';
    }
  } else {
    document.getElementById('retention-value').textContent = '新词';
    document.getElementById('retention-value').style.color = 'rgba(255,255,255,0.7)';
  }
  
  if (renderAlgorithmTransparency) {
    const algoInfo = renderAlgorithmTransparency(id, getWordData, FSRS_W);
    if (algoInfo) {
      const efDisplayEl = document.getElementById('ef-display');
      if (efDisplayEl && !efDisplayEl.querySelector('.algo-info')) {
        const algoDiv = document.createElement('div');
        algoDiv.className = 'algo-info';
        algoDiv.style.cssText = 'font-size: 0.7rem; color: var(--gray); margin-top: 4px;';
        algoDiv.textContent = algoInfo.explanation;
        efDisplayEl.appendChild(algoDiv);
      }
    }
  }
}

function flipStudyCard(getMnemonic) {
  studyFlipped = !studyFlipped;
  document.getElementById('study-card').classList.toggle('flipped', studyFlipped);

  const mnemonicContainer = document.getElementById('mnemonic-container');
  const mnemonicInput = document.getElementById('mnemonic-input');
  const semanticWarning = document.getElementById('semantic-warning');

  const meaningEl = document.getElementById('study-meaning');
  const exampleEl = document.getElementById('study-example');

  if (studyFlipped) {
    document.getElementById('btn-unknown').disabled = false;
    document.getElementById('btn-known').disabled = false;
    speak(studyQueue[studyIndex].word);

    if (studyQueue[studyIndex]) {
      mnemonicInput.value = getMnemonic(studyQueue[studyIndex].id);
      mnemonicContainer.style.display = 'block';
    }
    
    semanticWarning.style.display = AppState.get('semanticInterfered') ? 'block' : 'none';

    if (meaningEl) meaningEl.setAttribute('aria-live', 'polite');
    if (exampleEl) exampleEl.setAttribute('aria-live', 'polite');
    
    const w = studyQueue[studyIndex];
    if (w && announceForAccessibility) {
      announceForAccessibility(`单词 ${w.word}，释义：${w.meaning}`);
    }
  } else {
    mnemonicContainer.style.display = 'none';
    semanticWarning.style.display = 'none';

    if (meaningEl) meaningEl.removeAttribute('aria-live');
    if (exampleEl) exampleEl.removeAttribute('aria-live');
  }
}

function handleSaveMnemonic(saveMnemonic) {
  if (!studyQueue[studyIndex]) return;
  const wordId = studyQueue[studyIndex].id;
  const val = document.getElementById('mnemonic-input').value.trim();
  saveMnemonic(wordId, val);

  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = '✅ 已保存';
  setTimeout(() => {
    btn.textContent = originalText;
  }, 1500);
}

function updateProgress() {
  const done = studyTotal - studyQueue.length;
  const pct = (done / studyTotal) * 100;
  document.getElementById('progress-text').textContent = `有效掌握: ${done} / ${studyTotal} (${Math.round(pct)}%)`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  
  const estimateEl = document.getElementById('study-estimate');
  const studyEstDateEl = document.getElementById('study-est-date');
  const statsEstDateEl = document.getElementById('stats-est-date');
  
  if (statsEstDateEl && studyEstDateEl) {
    const statsText = statsEstDateEl.textContent || statsEstDateEl.innerText;
    if (statsText && !statsText.includes('需要') && !statsText.includes('加油')) {
      studyEstDateEl.textContent = statsText;
      estimateEl.style.display = 'block';
    }
  }
}

function updateCycleInfo() {
  document.getElementById('cycle-num').textContent = studyCycle;
  document.getElementById('cycle-remain').textContent = studyQueue.length;
  document.getElementById('cycle-done').textContent = studyTotal - studyQueue.length;
}

function finishStudy(db, memoryCache) {
  if (db && db.instance) db.delete('session', 'current');
  if (memoryCache) memoryCache.session = null;
  document.getElementById('study-word').textContent = '🎉 学习完成！';
  document.getElementById('study-pron').textContent = '';
  document.getElementById('study-meaning').textContent = '继续加油！';
  document.getElementById('study-example').textContent = '';
  document.getElementById('study-card').classList.remove('flipped');
  document.getElementById('ef-display').style.display = 'none';

  document.getElementById('start-btn').style.display = 'block';
  document.getElementById('start-btn').textContent = '🔄 再学一轮';
  document.getElementById('study-buttons').style.display = 'none';
  document.getElementById('cycle-banner').style.display = 'none';
}

function speakCurrentWord() {
  if (studyQueue[studyIndex]) speak(studyQueue[studyIndex].word);
}

function speakExample() {
  if (studyQueue[studyIndex] && studyFlipped) {
    speak(studyQueue[studyIndex].example);
  }
}

async function markStudyWord(known, deps) {
  const { getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval, getPersonalizedCircadianFactor, adjustForSemanticInterference, addWrongWord, recordHeatmap, saveDailyProgressSnapshot, saveStudySession, updateStats, showStudyWord, playTone } = deps;
  
  const w = studyQueue[studyIndex];
  let wd = getWordData(w.id);
  
  await pushAction(w.id, { ...wd });

  const quality = known ? 4 : 1;
  const fsrs = updateFSRS(wd, quality);
  wd.stability = fsrs.stability;
  wd.difficulty = fsrs.difficulty;

  if (known) {
    wd.status = 'review';
    wd.level = Math.min(wd.level + 1, 12);
    const circadian = getPersonalizedCircadianFactor();
    const baseInterval = calculateFSRSInterval(wd.stability);
    const fuzzedInterval = applyFuzz(baseInterval);
    const semanticAdjusted = adjustForSemanticInterference(w.id, fuzzedInterval);
    wd.nextReview = Date.now() + semanticAdjusted * circadian;
    wd.lastStudy = Date.now();
    wd.reviewCount++;
    wd.nextReviewDate = new Date(wd.nextReview).toISOString().split('T')[0];

    studyQueue.splice(studyIndex, 1);
    playTone('success');
  } else {
    wd.status = 'review';
    wd.level = 0;
    wd.lastStudy = Date.now();

    const tailWords = studyQueue.splice(studyIndex + 1);
    const minDelay = Math.min(3, tailWords.length);
    const insertPos = minDelay + Math.floor(Math.random() * Math.max(1, tailWords.length - minDelay));
    tailWords.splice(insertPos, 0, w);
    studyQueue = studyQueue.concat(tailWords);
    playTone('fail');
    addWrongWord(w.id);
  }

  await setWordData(w.id, wd);
  recordHeatmap();
  saveDailyProgressSnapshot();
  saveStudySession();
  updateStats();
  showStudyWord();
}

export const StudyFeature = {
  setWords,
  getWords,
  getStudyState,
  saveStudySession,
  checkStudySession,
  resumeStudy,
  toggleClozeMode,
  startStudy,
  showStudyWord,
  updateRelatedWords,
  jumpToWord,
  updateEFDisplay,
  flipStudyCard,
  handleSaveMnemonic,
  updateProgress,
  updateCycleInfo,
  finishStudy,
  speakCurrentWord,
  speakExample,
  markStudyWord,
  get studyQueue() { return studyQueue; },
  get studyIndex() { return studyIndex; },
  get studyFlipped() { return studyFlipped; },
  get studyTotal() { return studyTotal; },
  get clozeModeEnabled() { return clozeModeEnabled; }
};
