const path = require('path');
const { spawnSync } = require('child_process');

const tests = [
  'storage.test.cjs',
  'app-state.test.cjs',
  'scheduler.test.cjs',
  'vocab-loader.test.cjs',
  'page-flow.test.cjs',
  'vocab-data.test.cjs',
  'training.test.cjs',
  'backup.test.cjs',
  'stats-advanced.test.cjs',
  'feature-pages.test.cjs',
  'learning-aids.test.cjs',
  'custom-vocab.test.cjs',
  'audio.test.cjs',
  'theme.test.cjs',
  'multi-modal-study.test.cjs',
  'battle.test.cjs',
];

let failed = 0;
for (const test of tests) {
  const result = spawnSync(process.execPath, [path.join(__dirname, test)], { stdio: 'inherit' });
  if (result.status !== 0) failed++;
}

if (failed > 0) {
  console.error(`${failed} test file(s) failed`);
  process.exit(1);
}

console.log(`All ${tests.length} miniprogram test files passed`);
