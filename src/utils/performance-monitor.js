/**
 * Performance Monitoring and Debugging Utility
 * 
 * Provides comprehensive performance tracking, memory monitoring,
 * and debugging capabilities for the PQShield API platform.
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV !== 'production';
    this.memoryThreshold = 100 * 1024 * 1024; // 100MB
    this.performanceThreshold = 1000; // 1 second
    
    this.initializeMonitoring();
  }
  
  /**
   * Initialize performance monitoring
   */
  initializeMonitoring() {
    if (!this.isEnabled) return;
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Monitor long tasks
    this.startLongTaskMonitoring();
    
    // Monitor resource loading
    this.startResourceMonitoring();
    
    // Monitor neural network performance
    this.startNeuralNetworkMonitoring();
  }
  
  /**
   * Start memory usage monitoring
   */
  startMemoryMonitoring() {
    if (!('memory' in performance)) return;
    
    setInterval(() => {
      const memory = performance.memory;
      const memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
      
      this.recordMetric('memory', memoryUsage);
      
      // Alert if memory usage is high
      if (memoryUsage.used > this.memoryThreshold) {
        this.alertHighMemoryUsage(memoryUsage);
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Monitor long-running tasks
   */
  startLongTaskMonitoring() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.recordMetric('longTask', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              timestamp: Date.now(),
            });
            
            console.warn(`Long task detected: ${entry.name} (${entry.duration}ms)`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longTask', observer);
    } catch (error) {
      console.warn('Long task monitoring not supported:', error);
    }
  }
  
  /**
   * Monitor resource loading performance
   */
  startResourceMonitoring() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceMetric = {
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize || 0,
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now(),
          };
          
          this.recordMetric('resource', resourceMetric);
          
          // Alert for slow resources
          if (entry.duration > this.performanceThreshold) {
            console.warn(`Slow resource: ${entry.name} (${entry.duration}ms)`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (error) {
      console.warn('Resource monitoring not supported:', error);
    }
  }
  
  /**
   * Monitor neural network performance
   */
  startNeuralNetworkMonitoring() {
    // Custom monitoring for SNN/ANN performance
    this.neuralMetrics = {
      snnInferenceTime: [],
      annInferenceTime: [],
      qnnInferenceTime: [],
      threatDetectionAccuracy: [],
      falsePositiveRate: [],
    };
  }
  
  /**
   * Record a performance metric
   */
  recordMetric(type, data) {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    const metrics = this.metrics.get(type);
    metrics.push(data);
    
    // Keep only last 100 entries to prevent memory leaks
    if (metrics.length > 100) {
      metrics.shift();
    }
  }
  
  /**
   * Record neural network inference time
   */
  recordNeuralInference(networkType, inferenceTime, accuracy = null) {
    const metric = {
      networkType,
      inferenceTime,
      accuracy,
      timestamp: Date.now(),
    };
    
    this.recordMetric('neuralInference', metric);
    
    // Update specific neural network metrics
    if (this.neuralMetrics[`${networkType}InferenceTime`]) {
      this.neuralMetrics[`${networkType}InferenceTime`].push(inferenceTime);
      
      // Keep only last 50 measurements
      if (this.neuralMetrics[`${networkType}InferenceTime`].length > 50) {
        this.neuralMetrics[`${networkType}InferenceTime`].shift();
      }
    }
    
    // Alert if inference time is too high
    if (inferenceTime > 100) { // 100ms threshold
      console.warn(`Slow ${networkType} inference: ${inferenceTime}ms`);
    }
  }
  
  /**
   * Record threat detection metrics
   */
  recordThreatDetection(detected, actual, confidence) {
    const isCorrect = detected === actual;
    const isFalsePositive = detected && !actual;
    
    this.recordMetric('threatDetection', {
      detected,
      actual,
      confidence,
      isCorrect,
      isFalsePositive,
      timestamp: Date.now(),
    });
    
    // Update accuracy metrics
    this.neuralMetrics.threatDetectionAccuracy.push(isCorrect ? 1 : 0);
    if (isFalsePositive) {
      this.neuralMetrics.falsePositiveRate.push(1);
    } else {
      this.neuralMetrics.falsePositiveRate.push(0);
    }
    
    // Keep only last 100 measurements
    ['threatDetectionAccuracy', 'falsePositiveRate'].forEach(metric => {
      if (this.neuralMetrics[metric].length > 100) {
        this.neuralMetrics[metric].shift();
      }
    });
  }
  
  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      timestamp: Date.now(),
      memory: this.getMemorySummary(),
      neural: this.getNeuralSummary(),
      resources: this.getResourceSummary(),
      longTasks: this.getLongTaskSummary(),
    };
    
    return summary;
  }
  
  /**
   * Get memory usage summary
   */
  getMemorySummary() {
    const memoryMetrics = this.metrics.get('memory') || [];
    if (memoryMetrics.length === 0) return null;
    
    const latest = memoryMetrics[memoryMetrics.length - 1];
    const usedMB = Math.round(latest.used / 1024 / 1024);
    const totalMB = Math.round(latest.total / 1024 / 1024);
    const limitMB = Math.round(latest.limit / 1024 / 1024);
    
    return {
      used: usedMB,
      total: totalMB,
      limit: limitMB,
      percentage: Math.round((latest.used / latest.limit) * 100),
    };
  }
  
  /**
   * Get neural network performance summary
   */
  getNeuralSummary() {
    const calculateAverage = (arr) => {
      if (arr.length === 0) return 0;
      return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    };
    
    return {
      snnAvgInference: Math.round(calculateAverage(this.neuralMetrics.snnInferenceTime)),
      annAvgInference: Math.round(calculateAverage(this.neuralMetrics.annInferenceTime)),
      qnnAvgInference: Math.round(calculateAverage(this.neuralMetrics.qnnInferenceTime)),
      accuracy: Math.round(calculateAverage(this.neuralMetrics.threatDetectionAccuracy) * 100),
      falsePositiveRate: Math.round(calculateAverage(this.neuralMetrics.falsePositiveRate) * 100),
    };
  }
  
  /**
   * Get resource loading summary
   */
  getResourceSummary() {
    const resourceMetrics = this.metrics.get('resource') || [];
    if (resourceMetrics.length === 0) return null;
    
    const totalSize = resourceMetrics.reduce((sum, resource) => sum + resource.size, 0);
    const avgDuration = resourceMetrics.reduce((sum, resource) => sum + resource.duration, 0) / resourceMetrics.length;
    
    return {
      totalResources: resourceMetrics.length,
      totalSize: Math.round(totalSize / 1024), // KB
      avgLoadTime: Math.round(avgDuration),
    };
  }
  
  /**
   * Get long task summary
   */
  getLongTaskSummary() {
    const longTaskMetrics = this.metrics.get('longTask') || [];
    if (longTaskMetrics.length === 0) return null;
    
    const totalDuration = longTaskMetrics.reduce((sum, task) => sum + task.duration, 0);
    const avgDuration = totalDuration / longTaskMetrics.length;
    
    return {
      count: longTaskMetrics.length,
      totalDuration: Math.round(totalDuration),
      avgDuration: Math.round(avgDuration),
    };
  }
  
  /**
   * Alert for high memory usage
   */
  alertHighMemoryUsage(memoryUsage) {
    const usedMB = Math.round(memoryUsage.used / 1024 / 1024);
    const percentage = Math.round((memoryUsage.used / memoryUsage.limit) * 100);
    
    console.warn(`High memory usage detected: ${usedMB}MB (${percentage}%)`);
    
    // Trigger garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }
  
  /**
   * Export performance data for analysis
   */
  exportData() {
    const data = {
      timestamp: Date.now(),
      metrics: Object.fromEntries(this.metrics),
      neuralMetrics: this.neuralMetrics,
      summary: this.getPerformanceSummary(),
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.neuralMetrics = {
      snnInferenceTime: [],
      annInferenceTime: [],
      qnnInferenceTime: [],
      threatDetectionAccuracy: [],
      falsePositiveRate: [],
    };
  }
  
  /**
   * Dispose of all observers
   */
  dispose() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disposing observer:', error);
      }
    });
    
    this.observers.clear();
    this.clearMetrics();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export utilities
export default performanceMonitor;

export const recordNeuralInference = (networkType, inferenceTime, accuracy) => {
  performanceMonitor.recordNeuralInference(networkType, inferenceTime, accuracy);
};

export const recordThreatDetection = (detected, actual, confidence) => {
  performanceMonitor.recordThreatDetection(detected, actual, confidence);
};

export const getPerformanceSummary = () => {
  return performanceMonitor.getPerformanceSummary();
};

export const exportPerformanceData = () => {
  return performanceMonitor.exportData();
};

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Expose to global scope for debugging
  window.performanceMonitor = performanceMonitor;
  
  // Log performance summary every 30 seconds
  setInterval(() => {
    const summary = performanceMonitor.getPerformanceSummary();
    console.group('🔍 Performance Summary');
    console.table(summary);
    console.groupEnd();
  }, 30000);
}
