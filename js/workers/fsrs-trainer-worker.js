function evaluateLogLoss(logs, weights) {
  if (logs.length === 0) return 0;
  let totalLoss = 0;
  let validCount = 0;
  
  for (const log of logs) {
    if (!log.elapsedDays || log.elapsedDays <= 0) {
      continue;
    }
    const t = log.elapsedDays;
    const s = weights[0] * Math.pow(Math.max(0.1, log.difficulty || 5), -weights[1]) * Math.pow(Math.max(1, log.reviewCount), weights[2] || 0);
    const r = Math.pow(0.9, t / Math.max(0.1, s));
    const y = log.lastResult || (log.quality >= 3 ? 1 : 0);
    const clippedR = Math.max(1e-10, Math.min(1 - 1e-10, r));
    totalLoss += -(y * Math.log(clippedR) + (1 - y) * Math.log(1 - clippedR));
    validCount++;
  }
  
  return validCount > 0 ? totalLoss / validCount : 0;
}

function calculateGradientsForLogLoss(logs, weights) {
  const gradients = new Array(weights.length).fill(0);
  const delta = 0.001;
  
  for (let i = 0; i < weights.length; i++) {
    const wPlus = [...weights];
    const wMinus = [...weights];
    wPlus[i] += delta;
    wMinus[i] -= delta;
    
    const lossPlus = evaluateLogLoss(logs, wPlus);
    const lossMinus = evaluateLogLoss(logs, wMinus);
    
    gradients[i] = (lossPlus - lossMinus) / (2 * delta);
  }
  
  return gradients;
}

class AdamOptimizer {
  constructor(weights, learningRate = 0.01, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8) {
    this.weights = weights;
    this.learningRate = learningRate;
    this.baseLearningRate = learningRate;
    this.beta1 = beta1;
    this.beta2 = beta2;
    this.epsilon = epsilon;
    this.m = new Array(weights.length).fill(0);
    this.v = new Array(weights.length).fill(0);
  }

  update(gradients, epoch) {
    const currentLR = this.learningRate / (1 + 0.01 * epoch);
    
    for (let i = 0; i < this.weights.length; i++) {
      this.m[i] = this.beta1 * this.m[i] + (1 - this.beta1) * gradients[i];
      this.v[i] = this.beta2 * this.v[i] + (1 - this.beta2) * Math.pow(gradients[i], 2);
      
      const mHat = this.m[i] / (1 - Math.pow(this.beta1, epoch + 1));
      const vHat = this.v[i] / (1 - Math.pow(this.beta2, epoch + 1));
      
      const update = currentLR * mHat / (Math.sqrt(vHat) + this.epsilon);
      
      if (!isFinite(update)) {
        console.warn(`⚠️ 梯度爆炸警告：第 ${i} 维权重更新量异常`);
        continue;
      }
      
      this.weights[i] = Math.max(0.01, this.weights[i] - update);
    }
    
    return this.weights;
  }

  reset() {
    this.m.fill(0);
    this.v.fill(0);
  }
}

function gradientDescentOptimization(logs, initialWeights) {
  const optimizer = new AdamOptimizer([...initialWeights]);
  
  const maxIterations = 300;
  const earlyStopThreshold = 1e-7;
  const minSamplesForTraining = 50;
  const minSamplesForFullTraining = 500;
  
  if (logs.length < minSamplesForTraining) {
    self.postMessage({
      type: 'warning',
      message: `⚠️ 样本量不足（${logs.length}/${minSamplesForTraining}），训练结果可能不可靠`
    });
  }
  
  let adaptiveMaxIterations = maxIterations;
  if (logs.length < minSamplesForFullTraining) {
    adaptiveMaxIterations = Math.floor(maxIterations * (logs.length / minSamplesForFullTraining));
    adaptiveMaxIterations = Math.max(50, Math.min(adaptiveMaxIterations, 150));
  }
  
  let prevLoss = evaluateLogLoss(logs, optimizer.weights);
  let bestWeights = [...optimizer.weights];
  let bestLoss = prevLoss;
  let noImprovementCount = 0;
  const maxNoImprovement = 50;
  
  const gradientNorms = [];
  const maxGradientNorm = 5.0;
  
  for (let t = 1; t <= adaptiveMaxIterations; t++) {
    const grads = calculateGradientsForLogLoss(logs, optimizer.weights);
    
    const gradientNorm = Math.sqrt(grads.reduce((sum, g) => sum + g * g, 0));
    gradientNorms.push(gradientNorm);
    
    if (gradientNorm > maxGradientNorm) {
      const scale = maxGradientNorm / gradientNorm;
      for (let i = 0; i < grads.length; i++) {
        grads[i] *= scale;
      }
      self.postMessage({
        type: 'info',
        message: `🔧 第 ${t} 次迭代：梯度裁剪 (norm: ${gradientNorm.toFixed(2)})`
      });
    }
    
    optimizer.update(grads, t - 1);
    
    const currentLoss = evaluateLogLoss(logs, optimizer.weights);
    
    if (!isFinite(currentLoss)) {
      self.postMessage({
        type: 'error',
        message: '❌ 训练失败：损失函数发散，已回退至最优权重'
      });
      return {
        weights: bestWeights,
        logLoss: bestLoss,
        originalLoss: prevLoss,
        iterations: t,
        reason: 'divergence'
      };
    }
    
    if (currentLoss < bestLoss - 1e-6) {
      bestLoss = currentLoss;
      bestWeights = [...optimizer.weights];
      noImprovementCount = 0;
    } else {
      noImprovementCount++;
    }
    
    if (noImprovementCount >= maxNoImprovement) {
      self.postMessage({
        type: 'info',
        message: `🎯 早停于第 ${t} 次迭代（连续 ${maxNoImprovement} 次无改善）`
      });
      break;
    }
    
    if (Math.abs(prevLoss - currentLoss) < earlyStopThreshold) {
      self.postMessage({
        type: 'info',
        message: `🎯 早停于第 ${t} 次迭代，Log-Loss: ${currentLoss.toFixed(6)}`
      });
      break;
    }
    
    prevLoss = currentLoss;
    
    if (t % 50 === 0) {
      self.postMessage({
        type: 'progress',
        iteration: t,
        maxIterations: adaptiveMaxIterations,
        loss: currentLoss,
        bestLoss,
        learningRate: optimizer.learningRate / (1 + 0.01 * t)
      });
    }
  }
  
  const finalLoss = evaluateLogLoss(logs, bestWeights);
  const improvement = ((prevLoss - finalLoss) / prevLoss * 100).toFixed(2);
  
  self.postMessage({
    type: 'complete',
    message: `✅ Adam 优化完成，Loss 改善：${improvement}%`,
    result: {
      weights: bestWeights,
      logLoss: finalLoss,
      originalLoss: prevLoss,
      iterations: adaptiveMaxIterations,
      reason: 'converged'
    }
  });
  
  return {
    weights: bestWeights,
    logLoss: finalLoss,
    originalLoss: prevLoss,
    iterations: adaptiveMaxIterations,
    reason: 'converged'
  };
}

self.onmessage = function(e) {
  const { logs, initialWeights } = e.data;
  
  try {
    if (!logs || logs.length === 0) {
      throw new Error('复习日志为空');
    }
    
    if (!initialWeights || initialWeights.length !== 17) {
      throw new Error('初始权重格式错误');
    }
    
    self.postMessage({
      type: 'info',
      message: `🚀 开始训练，样本量：${logs.length}`
    });
    
    const result = gradientDescentOptimization(logs, initialWeights);
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
      stack: error.stack
    });
  }
};
