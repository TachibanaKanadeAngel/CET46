// fsrs-trainer-worker.ts - FSRS 权重训练 Web Worker
// 基于梯度下降优化 FSRS 权重参数

self.onmessage = function (e: MessageEvent) {
  const { logs, initialWeights, maxIterations = 500, learningRate = 0.01 } = e.data || {};

  if (!logs || logs.length === 0) {
    self.postMessage({ type: 'error', error: '训练数据为空' });
    return;
  }

  const weights: number[] =
    initialWeights && initialWeights.length === 17
      ? [...initialWeights]
      : new Array(17).fill(0).map((_, i) => {
          const defaults = [
            0.4025, 1.4612, 3.3458, 15.6941, 5.3611, 0.9971, 0.8807, 0.0424, 1.4946, 0.144, 0.9995,
            2.2107, 0.0578, 0.3267, 1.2691, 0.2314, 2.0583,
          ];
          return defaults[i] || 0.5;
        });

  const delta = 0.001;
  const clipMin = 0.01;
  const clipMax = 10.0;

  function evaluateLogLoss(dataset: any[], w: number[]): number {
    if (dataset.length === 0) return 0;
    let totalLoss = 0;
    let validCount = 0;

    for (const log of dataset) {
      if (!log.elapsedDays || log.elapsedDays <= 0) continue;

      const t = log.elapsedDays;
      const s =
        w[0] *
        Math.pow(Math.max(0.1, log.difficulty ?? 5), -w[1]) *
        Math.pow(Math.max(1, log.reviewCount), w[2] ?? 0);
      const r = Math.pow(1 + t / (9 * Math.max(0.1, s)), -1);
      const y = log.lastResult ?? (log.quality >= 3 ? 1 : 0);
      const clippedR = Math.max(1e-10, Math.min(1 - 1e-10, r));
      totalLoss += -(y * Math.log(clippedR) + (1 - y) * Math.log(1 - clippedR));
      validCount++;
    }

    return validCount > 0 ? totalLoss / validCount : 0;
  }

  function calculateGradients(dataset: any[], w: number[]): number[] {
    const gradients = new Array(w.length).fill(0);

    for (let i = 0; i < w.length; i++) {
      const wPlus = [...w];
      const wMinus = [...w];
      wPlus[i] += delta;
      wMinus[i] -= delta;

      const lossPlus = evaluateLogLoss(dataset, wPlus);
      const lossMinus = evaluateLogLoss(dataset, wMinus);

      gradients[i] = (lossPlus - lossMinus) / (2 * delta);
    }

    return gradients;
  }

  let bestLoss = evaluateLogLoss(logs, weights);
  let bestWeights = [...weights];
  let noImproveCount = 0;
  let earlyStopped = false;
  let iter = 0;

  self.postMessage({
    type: 'info',
    message: `开始训练，初始 Loss: ${bestLoss.toFixed(4)}，样本数: ${logs.length}`,
  });

  for (iter = 1; iter <= maxIterations; iter++) {
    if (iter % 10 === 0 || iter === 1) {
      const currentLoss = evaluateLogLoss(logs, weights);
      self.postMessage({
        type: 'progress',
        iteration: iter,
        maxIterations,
        loss: currentLoss,
        bestLoss,
      });
    }

    const grads = calculateGradients(logs, weights);

    for (let i = 0; i < weights.length; i++) {
      weights[i] -= learningRate * grads[i];
      weights[i] = Math.max(clipMin, Math.min(clipMax, weights[i]));
    }

    const currentLoss = evaluateLogLoss(logs, weights);

    if (currentLoss < bestLoss - 1e-5) {
      bestLoss = currentLoss;
      bestWeights = [...weights];
      noImproveCount = 0;
    } else {
      noImproveCount++;
    }

    if (noImproveCount >= 30) {
      earlyStopped = true;
      break;
    }
  }

  const initialLoss = evaluateLogLoss(logs, initialWeights || weights);

  self.postMessage({
    type: 'complete',
    weights: bestWeights,
    loss: bestLoss,
    initialLoss,
    improved: bestLoss < initialLoss,
    improvementPercent:
      initialLoss > 0 ? (((initialLoss - bestLoss) / initialLoss) * 100).toFixed(2) : 0,
    iterations: Math.min(iter, maxIterations),
    earlyStopped,
  });
};
