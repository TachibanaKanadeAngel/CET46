import {
  updateFSRS,
  calculateFSRSInterval,
  calculateForgettingDecay,
  calculateShortTermMemory,
  calculateOptimalInterval,
  calculateLevenshtein,
  updateEF,
  evaluateLogLoss,
  DEFAULT_FSRS_W
} from '../fsrs.js';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`❌ 测试失败：${message}`);
  }
};

const assertEquals = (actual, expected, message, tolerance = 0.01) => {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`❌ ${message}\n   期望：${expected}\n   实际：${actual}`);
  }
};

describe('FSRS 核心算法测试', () => {
  test('updateFSRS - 成功回忆时增加稳定性', () => {
    const wd = {
      stability: 5.0,
      difficulty: 5.0
    };
    
    const result = updateFSRS(wd, 4);
    
    assert(result.stability > 5.0, '成功回忆后稳定性应该增加');
    assert(result.difficulty <= 5.0, '成功回忆后难度应该降低或持平');
    console.log('✅ updateFSRS - 成功回忆测试通过');
  });

  test('updateFSRS - 失败回忆时降低稳定性', () => {
    const wd = {
      stability: 5.0,
      difficulty: 5.0
    };
    
    const result = updateFSRS(wd, 1);
    
    assert(result.stability < 5.0, '失败回忆后稳定性应该降低');
    console.log('✅ updateFSRS - 失败回忆测试通过');
  });

  test('updateFSRS - 难度边界值', () => {
    const wd1 = { stability: 5.0, difficulty: 1.0 };
    const wd2 = { stability: 5.0, difficulty: 10.0 };
    
    const result1 = updateFSRS(wd1, 4);
    const result2 = updateFSRS(wd2, 1);
    
    assert(result1.difficulty >= 1, '难度不应低于最小值 1');
    assert(result2.difficulty <= 10, '难度不应高于最大值 10');
    console.log('✅ updateFSRS - 难度边界测试通过');
  });

  test('calculateFSRSInterval - 稳定性越高间隔越长', () => {
    const interval1 = calculateFSRSInterval(1.0);
    const interval2 = calculateFSRSInterval(10.0);
    
    assert(interval2 > interval1, '稳定性 10 的间隔应该大于稳定性 1');
    console.log('✅ calculateFSRSInterval - 稳定性与间隔关系测试通过');
  });

  test('calculateForgettingDecay - 时间越久遗忘越多', () => {
    const wd = {
      stability: 5.0,
      lastStudy: Date.now()
    };
    
    const decay1 = calculateForgettingDecay(wd, 1);
    const decay5 = calculateForgettingDecay(wd, 5);
    const decay10 = calculateForgettingDecay(wd, 10);
    
    assert(decay1 > decay5, '1 天的遗忘率应该高于 5 天');
    assert(decay5 > decay10, '5 天的遗忘率应该高于 10 天');
    assert(decay1 <= 1.0, '遗忘率不应超过 1.0');
    assert(decay10 >= 0.1, '遗忘率不应低于 0.1');
    console.log('✅ calculateForgettingDecay - 时间与遗忘关系测试通过');
  });

  test('calculateShortTermMemory - 短期记忆累积', () => {
    const wd = {
      shortTermReps: 0,
      lastShortTermReview: 0
    };
    
    const result1 = calculateShortTermMemory(wd, 4);
    assertEquals(result1.reps, 1, '第一次成功回忆后 reps 应为 1');
    assertEquals(result1.bonus, 1.1, '第一次成功回忆后 bonus 应为 1.1');
    
    const result2 = calculateShortTermMemory(wd, 4);
    assertEquals(result2.reps, 2, '第二次成功回忆后 reps 应为 2');
    assertEquals(result2.bonus, 1.2, '第二次成功回忆后 bonus 应为 1.2');
    
    console.log('✅ calculateShortTermMemory - 短期记忆累积测试通过');
  });

  test('calculateShortTermMemory - 短期记忆上限', () => {
    const wd = {
      shortTermReps: 4,
      lastShortTermReview: Date.now()
    };
    
    const result = calculateShortTermMemory(wd, 4);
    assertEquals(result.reps, 5, '短期记忆上限为 5');
    console.log('✅ calculateShortTermMemory - 短期记忆上限测试通过');
  });

  test('calculateOptimalInterval - 质量 4 奖励更长间隔', () => {
    const wd = {
      stability: 5.0,
      difficulty: 5.0,
      lastStudy: Date.now()
    };
    
    const interval3 = calculateOptimalInterval(wd, 3);
    const interval4 = calculateOptimalInterval(wd, 4);
    
    assert(interval4 > interval3, '质量 4 的间隔应该大于质量 3');
    console.log('✅ calculateOptimalInterval - 质量奖励测试通过');
  });

  test('calculateOptimalInterval - 失败惩罚更短间隔', () => {
    const wd = {
      stability: 5.0,
      difficulty: 5.0,
      lastStudy: Date.now()
    };
    
    const interval3 = calculateOptimalInterval(wd, 3);
    const interval1 = calculateOptimalInterval(wd, 1);
    
    assert(interval1 < interval3, '质量 1 的间隔应该小于质量 3');
    console.log('✅ calculateOptimalInterval - 失败惩罚测试通过');
  });

  test('calculateLevenshtein - 相同字符串', () => {
    assertEquals(calculateLevenshtein('hello', 'hello'), 0, '相同字符串编辑距离为 0');
    console.log('✅ calculateLevenshtein - 相同字符串测试通过');
  });

  test('calculateLevenshtein - 完全不同字符串', () => {
    const dist = calculateLevenshtein('abc', 'xyz');
    assertEquals(dist, 3, '完全不同的字符串编辑距离为长度');
    console.log('✅ calculateLevenshtein - 完全不同字符串测试通过');
  });

  test('calculateLevenshtein - 单字符差异', () => {
    assertEquals(calculateLevenshtein('hello', 'helo'), 1, '删除一个字符距离为 1');
    assertEquals(calculateLevenshtein('hello', 'hellp'), 1, '替换一个字符距离为 1');
    assertEquals(calculateLevenshtein('hello', 'ahello'), 1, '插入一个字符距离为 1');
    console.log('✅ calculateLevenshtein - 单字符差异测试通过');
  });

  test('calculateLevenshtein - 大小写不敏感', () => {
    assertEquals(calculateLevenshtein('Hello', 'hello'), 0, '大小写应该不敏感');
    console.log('✅ calculateLevenshtein - 大小写不敏感测试通过');
  });

  test('updateEF - 高质量增加 EF', () => {
    const newEF = updateEF(2.5, 4);
    assertEquals(newEF, 2.6, '质量 4 应该增加 0.1 EF');
    console.log('✅ updateEF - 高质量增加 EF 测试通过');
  });

  test('updateEF - 低质量降低 EF', () => {
    const newEF = updateEF(2.5, 0);
    assertEquals(newEF, 2.35, '质量 0 应该降低 0.15 EF');
    console.log('✅ updateEF - 低质量降低 EF 测试通过');
  });

  test('updateEF - EF 边界值', () => {
    const maxEF = updateEF(2.6, 4);
    const minEF = updateEF(1.0, 0);
    
    assert(maxEF <= 3.0, 'EF 不应超过最大值 3.0');
    assert(minEF >= 1.0, 'EF 不应低于最小值 1.0');
    console.log('✅ updateEF - EF 边界值测试通过');
  });

  test('evaluateLogLoss - 完美预测损失为 0', () => {
    const logs = [
      { elapsedDays: 1, difficulty: 5, reviewCount: 1, quality: 4, lastResult: 1 }
    ];
    
    const loss = evaluateLogLoss(logs, DEFAULT_FSRS_W);
    assert(loss < 0.1, '完美预测的对数损失应接近 0');
    console.log('✅ evaluateLogLoss - 完美预测测试通过');
  });

  test('evaluateLogLoss - 错误预测损失较高', () => {
    const logs = [
      { elapsedDays: 10, difficulty: 5, reviewCount: 1, quality: 1, lastResult: 0 }
    ];
    
    const loss = evaluateLogLoss(logs, DEFAULT_FSRS_W);
    assert(loss > 0.5, '错误预测的对数损失应较高');
    console.log('✅ evaluateLogLoss - 错误预测测试通过');
  });

  test('evaluateLogLoss - 空日志返回 0', () => {
    const loss = evaluateLogLoss([], DEFAULT_FSRS_W);
    assertEquals(loss, 0, '空日志应返回 0 损失');
    console.log('✅ evaluateLogLoss - 空日志测试通过');
  });
});

function describe(name, fn) {
  console.log(`\n📋 测试套件：${name}`);
  fn();
}

function test(name, fn) {
  try {
    fn();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

console.log('\n🚀 开始运行 FSRS 核心算法测试...\n');

try {
  describe('FSRS 核心算法测试', () => {
    test('updateFSRS - 成功回忆时增加稳定性', () => {
      const wd = { stability: 5.0, difficulty: 5.0 };
      const result = updateFSRS(wd, 4);
      assert(result.stability > 5.0, '成功回忆后稳定性应该增加');
      assert(result.difficulty <= 5.0, '成功回忆后难度应该降低或持平');
      console.log('✅ updateFSRS - 成功回忆测试通过');
    });

    test('updateFSRS - 失败回忆时降低稳定性', () => {
      const wd = { stability: 5.0, difficulty: 5.0 };
      const result = updateFSRS(wd, 1);
      assert(result.stability < 5.0, '失败回忆后稳定性应该降低');
      console.log('✅ updateFSRS - 失败回忆测试通过');
    });

    test('updateFSRS - 难度边界值', () => {
      const wd1 = { stability: 5.0, difficulty: 1.0 };
      const wd2 = { stability: 5.0, difficulty: 10.0 };
      const result1 = updateFSRS(wd1, 4);
      const result2 = updateFSRS(wd2, 1);
      assert(result1.difficulty >= 1, '难度不应低于最小值 1');
      assert(result2.difficulty <= 10, '难度不应高于最大值 10');
      console.log('✅ updateFSRS - 难度边界测试通过');
    });

    test('calculateFSRSInterval - 稳定性越高间隔越长', () => {
      const interval1 = calculateFSRSInterval(1.0);
      const interval2 = calculateFSRSInterval(10.0);
      assert(interval2 > interval1, '稳定性 10 的间隔应该大于稳定性 1');
      console.log('✅ calculateFSRSInterval - 稳定性与间隔关系测试通过');
    });

    test('calculateForgettingDecay - 时间越久遗忘越多', () => {
      const wd = { stability: 5.0, lastStudy: Date.now() };
      const decay1 = calculateForgettingDecay(wd, 1);
      const decay5 = calculateForgettingDecay(wd, 5);
      const decay10 = calculateForgettingDecay(wd, 10);
      assert(decay1 > decay5, '1 天的遗忘率应该高于 5 天');
      assert(decay5 > decay10, '5 天的遗忘率应该高于 10 天');
      assert(decay1 <= 1.0, '遗忘率不应超过 1.0');
      assert(decay10 >= 0.1, '遗忘率不应低于 0.1');
      console.log('✅ calculateForgettingDecay - 时间与遗忘关系测试通过');
    });

    test('calculateShortTermMemory - 短期记忆累积', () => {
      const wd = { shortTermReps: 0, lastShortTermReview: 0 };
      const result1 = calculateShortTermMemory(wd, 4);
      assertEquals(result1.reps, 1, '第一次成功回忆后 reps 应为 1');
      assertEquals(result1.bonus, 1.1, '第一次成功回忆后 bonus 应为 1.1');
      const result2 = calculateShortTermMemory(wd, 4);
      assertEquals(result2.reps, 2, '第二次成功回忆后 reps 应为 2');
      assertEquals(result2.bonus, 1.2, '第二次成功回忆后 bonus 应为 1.2');
      console.log('✅ calculateShortTermMemory - 短期记忆累积测试通过');
    });

    test('calculateShortTermMemory - 短期记忆上限', () => {
      const wd = { shortTermReps: 4, lastShortTermReview: Date.now() };
      const result = calculateShortTermMemory(wd, 4);
      assertEquals(result.reps, 5, '短期记忆上限为 5');
      console.log('✅ calculateShortTermMemory - 短期记忆上限测试通过');
    });

    test('calculateOptimalInterval - 质量 4 奖励更长间隔', () => {
      const wd = { stability: 5.0, difficulty: 5.0, lastStudy: Date.now() };
      const interval3 = calculateOptimalInterval(wd, 3);
      const interval4 = calculateOptimalInterval(wd, 4);
      assert(interval4 > interval3, '质量 4 的间隔应该大于质量 3');
      console.log('✅ calculateOptimalInterval - 质量奖励测试通过');
    });

    test('calculateOptimalInterval - 失败惩罚更短间隔', () => {
      const wd = { stability: 5.0, difficulty: 5.0, lastStudy: Date.now() };
      const interval3 = calculateOptimalInterval(wd, 3);
      const interval1 = calculateOptimalInterval(wd, 1);
      assert(interval1 < interval3, '质量 1 的间隔应该小于质量 3');
      console.log('✅ calculateOptimalInterval - 失败惩罚测试通过');
    });

    test('calculateLevenshtein - 相同字符串', () => {
      assertEquals(calculateLevenshtein('hello', 'hello'), 0, '相同字符串编辑距离为 0');
      console.log('✅ calculateLevenshtein - 相同字符串测试通过');
    });

    test('calculateLevenshtein - 完全不同字符串', () => {
      const dist = calculateLevenshtein('abc', 'xyz');
      assertEquals(dist, 3, '完全不同的字符串编辑距离为长度');
      console.log('✅ calculateLevenshtein - 完全不同字符串测试通过');
    });

    test('calculateLevenshtein - 单字符差异', () => {
      assertEquals(calculateLevenshtein('hello', 'helo'), 1, '删除一个字符距离为 1');
      assertEquals(calculateLevenshtein('hello', 'hellp'), 1, '替换一个字符距离为 1');
      assertEquals(calculateLevenshtein('hello', 'ahello'), 1, '插入一个字符距离为 1');
      console.log('✅ calculateLevenshtein - 单字符差异测试通过');
    });

    test('calculateLevenshtein - 大小写不敏感', () => {
      assertEquals(calculateLevenshtein('Hello', 'hello'), 0, '大小写应该不敏感');
      console.log('✅ calculateLevenshtein - 大小写不敏感测试通过');
    });

    test('updateEF - 高质量增加 EF', () => {
      const newEF = updateEF(2.5, 4);
      assertEquals(newEF, 2.6, '质量 4 应该增加 0.1 EF');
      console.log('✅ updateEF - 高质量增加 EF 测试通过');
    });

    test('updateEF - 低质量降低 EF', () => {
      const newEF = updateEF(2.5, 0);
      assertEquals(newEF, 2.35, '质量 0 应该降低 0.15 EF');
      console.log('✅ updateEF - 低质量降低 EF 测试通过');
    });

    test('updateEF - EF 边界值', () => {
      const maxEF = updateEF(2.6, 4);
      const minEF = updateEF(1.0, 0);
      assert(maxEF <= 3.0, 'EF 不应超过最大值 3.0');
      assert(minEF >= 1.0, 'EF 不应低于最小值 1.0');
      console.log('✅ updateEF - EF 边界值测试通过');
    });

    test('evaluateLogLoss - 完美预测损失为 0', () => {
      const logs = [{ elapsedDays: 1, difficulty: 5, reviewCount: 1, quality: 4, lastResult: 1 }];
      const loss = evaluateLogLoss(logs, DEFAULT_FSRS_W);
      assert(loss < 0.1, '完美预测的对数损失应接近 0');
      console.log('✅ evaluateLogLoss - 完美预测测试通过');
    });

    test('evaluateLogLoss - 错误预测损失较高', () => {
      const logs = [{ elapsedDays: 10, difficulty: 5, reviewCount: 1, quality: 1, lastResult: 0 }];
      const loss = evaluateLogLoss(logs, DEFAULT_FSRS_W);
      assert(loss > 0.5, '错误预测的对数损失应较高');
      console.log('✅ evaluateLogLoss - 错误预测测试通过');
    });

    test('evaluateLogLoss - 空日志返回 0', () => {
      const loss = evaluateLogLoss([], DEFAULT_FSRS_W);
      assertEquals(loss, 0, '空日志应返回 0 损失');
      console.log('✅ evaluateLogLoss - 空日志测试通过');
    });
  });
  
  console.log('\n✅ 所有测试通过！\n');
} catch (e) {
  console.error('\n❌ 测试失败:', e.message);
  console.error(e.stack);
}

export { describe, test, assert, assertEquals };
