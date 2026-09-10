/**
 * CET46 小程序模块测试统一入口
 */

const tests = [
  './fsrs.test.cjs',
  './storage.test.cjs',
  './vocab.test.cjs',
  './stats.test.cjs',
  './study-common.test.cjs',
  './study-session.test.cjs',
  './all-pages-smoke.test.cjs',
];

console.log('====================================');
console.log('CET46 小程序模块测试聚合运行');
console.log('====================================\n');

for (const test of tests) {
  console.log(`\n>>> 运行 ${test}\n`);
  require(test);
}

console.log('\n====================================');
console.log('全部小程序模块测试通过 ✓');
console.log('====================================');
