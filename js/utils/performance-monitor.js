class PerformanceMonitor {
  constructor() {
    this.metrics = {
      semanticGraphBuild: [],
      fsrsTraining: [],
      indexedDBOperations: [],
      renderOperations: [],
      syncOperations: []
    };
    
    this.startTime = performance.now();
    this.enabled = true;
    
    if (typeof window !== 'undefined') {
      window.performanceMonitor = this;
    }
  }

  startTimer(name) {
    if (!this.enabled) return null;
    
    const id = `${name}_${Date.now()}_${Math.random()}`;
    this.timers = this.timers || {};
    this.timers[id] = {
      name,
      startTime: performance.now()
    };
    
    return id;
  }

  endTimer(id) {
    if (!this.enabled || !id || !this.timers || !this.timers[id]) return null;
    
    const timer = this.timers[id];
    const duration = performance.now() - timer.startTime;
    delete this.timers[id];
    
    const metric = {
      name: timer.name,
      duration,
      timestamp: Date.now()
    };
    
    if (this.metrics[timer.name]) {
      this.metrics[timer.name].push(metric);
      
      if (this.metrics[timer.name].length > 100) {
        this.metrics[timer.name].shift();
      }
    }
    
    console.log(`⏱️ ${timer.name}: ${duration.toFixed(2)}ms`);
    
    return metric;
  }

  record(name, duration, metadata = {}) {
    if (!this.enabled) return;
    
    const metric = {
      name,
      duration,
      timestamp: Date.now(),
      ...metadata
    };
    
    if (this.metrics[name]) {
      this.metrics[name].push(metric);
      
      if (this.metrics[name].length > 100) {
        this.metrics[name].shift();
      }
    }
    
    if (duration > 100) {
      console.warn(`⚠️ 慢操作警告：${name} 耗时 ${duration.toFixed(2)}ms`);
    }
  }

  getStats(name) {
    const metrics = this.metrics[name] || [];
    if (metrics.length === 0) return null;
    
    const durations = metrics.map(m => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    const sorted = [...durations].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index] || sorted[sorted.length - 1];
    
    return {
      count: metrics.length,
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      p95: p95.toFixed(2),
      total: sum.toFixed(2)
    };
  }

  getAllStats() {
    const stats = {};
    
    for (const name of Object.keys(this.metrics)) {
      const metricStats = this.getStats(name);
      if (metricStats) {
        stats[name] = metricStats;
      }
    }
    
    return stats;
  }

  showPerformancePanel() {
    if (!this.enabled) return;
    
    const panel = document.createElement('div');
    panel.id = 'performance-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 15px;
      border-radius: 12px;
      font-size: 12px;
      z-index: 9999;
      max-width: 350px;
      max-height: 400px;
      overflow-y: auto;
      font-family: 'Monaco', 'Menlo', monospace;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      backdrop-filter: blur(8px);
    `;
    
    const stats = this.getAllStats();
    
    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; font-size: 14px; color: #4CAF50;">⚡ 性能监控</h3>
        <button id="close-performance-panel" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 18px; padding: 0 5px;">×</button>
      </div>
      <div style="font-size: 11px; color: #888; margin-bottom: 10px;">
        运行时长：${((performance.now() - this.startTime) / 1000).toFixed(1)}s
      </div>
    `;
    
    if (Object.keys(stats).length === 0) {
      html += '<div style="color: #888; text-align: center; padding: 20px;">暂无性能数据</div>';
    } else {
      for (const [name, data] of Object.entries(stats)) {
        const color = parseFloat(data.p95) > 100 ? '#f44336' : (parseFloat(data.p95) > 50 ? '#ff9800' : '#4CAF50');
        
        html += `
          <div style="margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px;">
            <div style="font-weight: bold; margin-bottom: 5px; color: ${color};">${name}</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; font-size: 11px;">
              <div>调用：<strong>${data.count}</strong> 次</div>
              <div>平均：<strong style="color: ${color};">${data.avg}ms</strong></div>
              <div>P95: <strong style="color: ${color};">${data.p95}ms</strong></div>
              <div>最小：<strong>${data.min}ms</strong></div>
              <div>最大：<strong style="color: ${color};">${data.max}ms</strong></div>
              <div>总计：<strong>${data.total}ms</strong></div>
            </div>
          </div>
        `;
      }
    }
    
    html += `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
        <button id="export-performance" style="width: 100%; padding: 8px; background: #2196F3; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
          📊 导出性能报告
        </button>
      </div>
    `;
    
    panel.innerHTML = html;
    document.body.appendChild(panel);
    
    document.getElementById('close-performance-panel').onclick = () => {
      panel.remove();
    };
    
    document.getElementById('export-performance').onclick = () => {
      this.exportReport();
    };
  }

  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      sessionDuration: performance.now() - this.startTime,
      metrics: this.getAllStats(),
      rawMetrics: this.metrics
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📊 性能报告已导出');
  }

  clearMetrics() {
    for (const key of Object.keys(this.metrics)) {
      this.metrics[key] = [];
    }
    console.log('🗑️ 性能数据已清空');
  }
}

const performanceMonitor = new PerformanceMonitor();

if (typeof window !== 'undefined') {
  window.showPerformancePanel = () => performanceMonitor.showPerformancePanel();
  window.exportPerformanceReport = () => performanceMonitor.exportReport();
}

export { PerformanceMonitor, performanceMonitor };
