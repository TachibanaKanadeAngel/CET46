/**
 * CET46 Web 核心业务纯原生单元回归测试套件
 * 无需外部构建工具或原生 C++ 依赖，在任意 Node 20+ 环境下一键直跑
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error('  ❌ 失败: ' + message);
    throw new Error(message);
  }
  passedTests++;
  console.log('  ✓ ' + message);
}

function resolveModulePath(baseDir, relativePath) {
  const clean = relativePath.split('?')[0];
  const normalized = clean.endsWith('.js') || clean.endsWith('.ts')
    ? clean.slice(0, -3)
    : clean;
  const candidates = [
    clean,
    normalized + '.ts',
    normalized + '.js',
    path.join(normalized, 'index.ts'),
    path.join(normalized, 'index.js'),
  ];
  for (const cand of candidates) {
    const full = path.resolve(baseDir, cand);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      return full;
    }
  }
  return path.resolve(baseDir, clean);
}

function loadModule(filePath) {
  if (filePath.includes('?worker') || filePath.endsWith('.worker.js') || filePath.endsWith('.worker.ts')) {
    return class DummyWorker { postMessage() {} terminate() {} addEventListener() {} };
  }

  const fullPath = resolveModulePath(__dirname, filePath);
  const rawCode = fs.readFileSync(fullPath, 'utf8');
  const fileUrlStr = JSON.stringify('file://' + fullPath.replace(/\\/g, '/'));
  const preprocessed = rawCode.replace(/import\.meta\.url/g, fileUrlStr);
  const code = ts.transpileModule(preprocessed, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const module = { exports: {} };
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: (id) => {
      if (id.includes('?worker')) {
        return class DummyWorker { postMessage() {} terminate() {} addEventListener() {} };
      }
      if (id.startsWith('.')) {
        return loadModule(path.resolve(path.dirname(fullPath), id));
      }
      return require(id);
    },
    console,
    Math,
    Date,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Int32Array,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      createElement: () => ({ appendChild: () => {}, style: {}, replaceChildren: () => {} }),
    },
    window: {
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    setTimeout,
    clearTimeout,
  });

  vm.runInContext(code, context);
  return module.exports;
}

console.log('============================================================');
console.log('🚀 开始 CET46 Web 核心业务纯原生单元回归测试');
console.log('============================================================\n');

// 1. 测试 FSRS 算法
console.log('>>> [Suite 1] FSRS 算法与编辑距离测试');
const fsrs = loadModule('../js/fsrs.ts');

assert(Array.isArray(fsrs.DEFAULT_FSRS_W) && fsrs.DEFAULT_FSRS_W.length === 17, 'FSRS 包含 17 维默认权重数组');
assert(fsrs.FSRSGrade.Again === 1 && fsrs.FSRSGrade.Easy === 4, 'FSRSGrade 评分等级定义正确 (1-4)');

// 边界与距离计算
assert(fsrs.calculateLevenshtein('', '') === 0, '空字符串编辑距离为 0');
assert(fsrs.calculateLevenshtein('test', 'test') === 0, '相同单词编辑距离为 0');
assert(fsrs.calculateLevenshtein('apple', 'apply') === 1, '单字符替换编辑距离为 1');
assert(fsrs.calculateLevenshtein('cat', 'cats') === 1, '尾部单字符插入编辑距离为 1');
assert(fsrs.calculateLevenshtein('abandon', 'abandonment') === 4, '多字符插入编辑距离计算准确 (4)');

// 状态转移
// 首次学习新词状态转移
const newCard = { status: 'new' };
const newAgain = fsrs.updateFSRS(newCard, fsrs.FSRSGrade.Again);
const newEasy = fsrs.updateFSRS(newCard, fsrs.FSRSGrade.Easy);
assert(newAgain.stability === fsrs.DEFAULT_FSRS_W[0], '新词 Again 初始稳定性匹配 W[0]');
assert(newEasy.stability === fsrs.DEFAULT_FSRS_W[3], '新词 Easy 初始稳定性匹配 W[3]');
assert(newEasy.stability > newAgain.stability, '新词 Easy 稳定性显著高于 Again');
assert(newAgain.difficulty > newEasy.difficulty, '新词 Again 难度显著高于 Easy');

// 已学卡片经过 3 天复习状态转移
const reviewCard = {
  stability: 3.0,
  difficulty: 5.0,
  lastStudy: Date.now() - 3 * 86400000,
};
const revAgain = fsrs.updateFSRS(reviewCard, fsrs.FSRSGrade.Again);
const revEasy = fsrs.updateFSRS(reviewCard, fsrs.FSRSGrade.Easy);
assert(revEasy.stability > revAgain.stability, '复习词 Easy 稳定性显著高于 Again');
assert(revAgain.difficulty > revEasy.difficulty, '复习词 Again 难度显著高于 Easy');

// 2. 测试拼写判定算法与会话管理
console.log('\n>>> [Suite 2] 拼写判卷纯函数与会话重置测试');
const spelling = loadModule('../js/features/spelling.ts');

const exactEval = spelling.evaluateSpellingAttempt('apple', 'apple', 4);
assert(exactEval.isExact === true && exactEval.distance === 0 && exactEval.quality === 4, '拼写完全一致判定通过 (isExact=true)');

const closeEval = spelling.evaluateSpellingAttempt('applx', 'apply', 4);
assert(closeEval.isClose === true && closeEval.distance === 1 && closeEval.quality === 2, '拼写 1 字符轻微误差容错通过 (isClose=true)');

const wrongEval = spelling.evaluateSpellingAttempt('banana', 'apple', 4);
assert(wrongEval.isExact === false && wrongEval.isClose === false && wrongEval.quality === 1, '拼写大差距判错通过 (quality=1)');

// 短词严格校验（长度 < 4 时 1 字符误差不容错）
const shortClose = spelling.evaluateSpellingAttempt('cat', 'car', 4);
assert(shortClose.isClose === false && shortClose.quality === 1, '小于 4 字母短词不开启容错机制');

// 会话状态重置
spelling.SpellingSession.checked = true;
spelling.SpellingSession.hintLevel = 3;
spelling.SpellingSession.lastQuality = 2;
spelling.resetSpellingSession();
assert(
  spelling.SpellingSession.checked === false &&
  spelling.SpellingSession.hintLevel === 0 &&
  spelling.SpellingSession.lastQuality === 4,
  'resetSpellingSession() 彻底复位会话所有状态'
);

// 3. 测试备份清洗与安全反原型污染
console.log('\n>>> [Suite 3] 备份数据安全校验与数据清洗测试');
const settings = loadModule('../js/features/settings.ts');

const maliciousBackup = {
  __proto__: { admin: true },
  constructor: { hack: true },
  progress: { '1': { status: 'review', level: 2 } },
  wrongWords: { '1': { count: 3 } },
  studyPlan: { dailyLimit: 20 },
};

const cleanData = settings.sanitizeImportObject(maliciousBackup);
assert(cleanData.admin === undefined && Object.getPrototypeOf(cleanData) === null, '成功过滤 __proto__ 原型注入且阻断原型链污染');
assert(cleanData.constructor === undefined, '成功过滤 constructor 属性注入');
assert(cleanData.progress && cleanData.progress['1'].status === 'review', '正确保留有效学习进度数据');
assert(cleanData.studyPlan && cleanData.studyPlan.dailyLimit === 20, '正确保留学习计划数据');

// 4. 测试复习会话状态机
console.log('\n>>> [Suite 4] 复习会话生命周期隔离测试');
const review = loadModule('../js/features/review.ts');

review.reviewSession.queue = [{ id: 101, word: 'abandon' }];
review.reviewSession.index = 5;
review.reviewSession.flipped = true;
review.reviewSession.submitting = true;
review.resetReviewSession();

assert(
  review.reviewSession.queue.length === 0 &&
  review.reviewSession.index === 0 &&
  review.reviewSession.flipped === false &&
  review.reviewSession.submitting === false,
  'resetReviewSession() 彻底清空复习队列与提交锁'
);

console.log('\n============================================================');
console.log(`🎉 全部 Web 核心测试通过: ${passedTests}/${totalTests} 项校验 100% 成功！`);
console.log('============================================================');
