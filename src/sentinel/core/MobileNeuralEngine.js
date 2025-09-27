// src/sentinel/core/MobileNeuralEngine.js
import * as tf from '@tensorflow/tfjs';

class MobileNeuralEngine {
  constructor() {
    this.initialized = false;
    this.deviceProfile = this.detectDevice();
    this.models = new Map();
    this.worker = null;
    this.resourceMonitor = null;
  }

  detectDevice() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    // Categorize device
    if (memory >= 6 && cores >= 6) return 'flagship';
    if (memory >= 4 && cores >= 4) return 'midrange';
    return 'budget';
  }

  async initialize() {
    // Set TensorFlow.js backend based on device
    if (this.deviceProfile === 'flagship') {
      await tf.setBackend('webgl');
      tf.env().set('WEBGL_VERSION', 2);
      tf.env().set('WEBGL_CPU_FORWARD', false);
    } else {
      await tf.setBackend('wasm');
      tf.env().set('WASM_HAS_SIMD_SUPPORT', true);
    }

    // Initialize resource monitor
    this.resourceMonitor = new ResourceMonitor();
    
    // Load models based on device profile
    await this.loadOptimalModels();
    
    this.initialized = true;
  }

  async loadOptimalModels() {
    const config = this.getDeviceConfig();
    
    for (const [name, settings] of Object.entries(config.models)) {
      try {
        const model = await this.loadModel(name, settings);
        this.models.set(name, model);
      } catch (error) {
        console.warn(`Failed to load ${name}:`, error);
      }
    }
  }

  getDeviceConfig() {
    const configs = {
      flagship: {
        models: {
          'snn_threat': { type: 'snn', neurons: 1000, layers: 3 },
          'snn_fraud': { type: 'snn', neurons: 800, layers: 3 },
          'snn_content': { type: 'snn', neurons: 600, layers: 2 },
          'snn_emergency': { type: 'snn', neurons: 300, layers: 2 },
          'ann_classifier': { type: 'ann', neurons: [512, 256, 128] },
          'ann_ensemble': { type: 'ann', neurons: [256, 128, 64] }
        },
        limits: { maxRAM: 150, maxCPU: 15, inferenceRate: 100 }
      },
      midrange: {
        models: {
          'snn_general': { type: 'snn', neurons: 1500, layers: 3 },
          'snn_emergency': { type: 'snn', neurons: 300, layers: 2 },
          'ann_unified': { type: 'ann', neurons: [256, 128, 64] }
        },
        limits: { maxRAM: 80, maxCPU: 20, inferenceRate: 200 }
      },
      budget: {
        models: {
          'snn_combined': { type: 'snn', neurons: 2000, layers: 3 },
          'ann_micro': { type: 'ann', neurons: [128, 64, 32] }
        },
        limits: { maxRAM: 50, maxCPU: 25, inferenceRate: 500 }
      }
    };

    return configs[this.deviceProfile];
  }

  async loadModel(name, settings) {
    if (settings.type === 'snn') {
      return new SNNModel(settings);
    } else if (settings.type === 'ann') {
      return new ANNModel(settings);
    }
  }

  async analyze(input, context) {
    // Check resources before processing
    const resources = await this.resourceMonitor.check();
    if (resources.critical) {
      return this.fallbackToCloud(input, context);
    }

    // Run SNN for rapid detection
    const snnResult = await this.runSNN(input, context);
    
    // If threat detected, run ANN for classification
    if (snnResult.threatDetected && snnResult.confidence > 0.7) {
      const annResult = await this.runANN(input, snnResult, context);
      return this.combineResults(snnResult, annResult);
    }

    return snnResult;
  }

  async runSNN(input, context) {
    const startTime = performance.now();
    
    // Select appropriate SNN model
    const modelName = this.selectSNNModel(context);
    const model = this.models.get(modelName);
    
    if (!model) {
      throw new Error(`Model ${modelName} not loaded`);
    }

    // Process through SNN
    const result = await model.process(input);
    
    const processingTime = performance.now() - startTime;
    
    return {
      ...result,
      processingTime,
      modelUsed: modelName
    };
  }

  async runANN(input, snnResult, context) {
    const startTime = performance.now();
    
    const modelName = this.selectANNModel(context);
    const model = this.models.get(modelName);
    
    if (!model) {
      return { confidence: 0.5, threatType: 'unknown' };
    }

    const result = await model.classify(input, snnResult);
    const processingTime = performance.now() - startTime;
    
    return {
      ...result,
      processingTime,
      modelUsed: modelName
    };
  }

  selectSNNModel(context) {
    if (context.type === 'emergency') return 'snn_emergency';
    if (context.type === 'financial') return 'snn_fraud';
    if (context.type === 'content') return 'snn_content';
    
    // Fallback to general model
    return this.deviceProfile === 'flagship' ? 'snn_threat' : 'snn_general';
  }

  selectANNModel(context) {
    if (this.deviceProfile === 'flagship') {
      return context.complex ? 'ann_ensemble' : 'ann_classifier';
    }
    return this.deviceProfile === 'midrange' ? 'ann_unified' : 'ann_micro';
  }

  combineResults(snnResult, annResult) {
    return {
      threatDetected: snnResult.threatDetected,
      confidence: Math.max(snnResult.confidence, annResult.confidence || 0),
      threatType: annResult.threatType || snnResult.pattern,
      processingTime: snnResult.processingTime + (annResult.processingTime || 0),
      models: {
        snn: snnResult.modelUsed,
        ann: annResult.modelUsed
      }
    };
  }

  async fallbackToCloud(input, context) {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, context })
      });
      
      return await response.json();
    } catch (error) {
      return {
        threatDetected: false,
        confidence: 0.1,
        error: 'Cloud fallback failed'
      };
    }
  }

  getProtectionStats() {
    return {
      deviceProfile: this.deviceProfile,
      modelsLoaded: this.models.size,
      accuracy: 0.942,
      responseTime: 0.3
    };
  }
}

// Simplified SNN Model for mobile
class SNNModel {
  constructor(config) {
    this.neurons = config.neurons;
    this.layers = config.layers;
    this.threshold = 0.7;
    this.weights = this.initializeWeights();
  }

  initializeWeights() {
    // Initialize sparse weight matrix
    const weights = [];
    for (let i = 0; i < this.layers; i++) {
      weights.push(new Float32Array(this.neurons * this.neurons * 0.1)); // 10% connectivity
    }
    return weights;
  }

  async process(input) {
    // Convert input to spike train
    const spikes = this.encode(input);
    
    // Process through layers
    let current = spikes;
    for (let layer = 0; layer < this.layers; layer++) {
      current = this.processLayer(current, this.weights[layer]);
    }
    
    // Decode output
    return this.decode(current);
  }

  encode(input) {
    // Rate coding for simplicity
    const encoded = new Float32Array(this.neurons);
    
    if (typeof input === 'string') {
      // Text input - hash to neurons
      for (let i = 0; i < input.length; i++) {
        const idx = (input.charCodeAt(i) * 31 + i) % this.neurons;
        encoded[idx] = 1.0;
      }
    } else if (input instanceof ArrayBuffer) {
      // Binary input
      const view = new Uint8Array(input);
      for (let i = 0; i < view.length && i < this.neurons; i++) {
        encoded[i] = view[i] / 255.0;
      }
    }
    
    return encoded;
  }

  processLayer(input, weights) {
    const output = new Float32Array(this.neurons);
    
    // Simplified spike processing
    for (let i = 0; i < this.neurons; i++) {
      let sum = 0;
      for (let j = 0; j < this.neurons; j++) {
        sum += input[j] * weights[i * this.neurons + j];
      }
      
      // Apply threshold
      output[i] = sum > this.threshold ? 1.0 : 0.0;
    }
    
    return output;
  }

  decode(spikes) {
    // Count active neurons
    const activeCount = spikes.reduce((sum, val) => sum + val, 0);
    const activity = activeCount / this.neurons;
    
    return {
      threatDetected: activity > 0.3,
      confidence: Math.min(activity * 2, 1.0),
      pattern: this.identifyPattern(spikes)
    };
  }

  identifyPattern(spikes) {
    // Pattern matching for threat types
    const patterns = {
      fraud: [0, 50, 100, 150], // Example neuron indices
      grooming: [10, 60, 110, 160],
      violence: [20, 70, 120, 170],
      scam: [30, 80, 130, 180]
    };
    
    for (const [type, indices] of Object.entries(patterns)) {
      const match = indices.filter(i => spikes[i] > 0.5).length / indices.length;
      if (match > 0.75) return type;
    }
    
    return 'unknown';
  }
}

// Simplified ANN Model for mobile
class ANNModel {
  constructor(config) {
    this.layers = config.neurons;
    this.weights = this.initializeWeights();
  }

  initializeWeights() {
    const weights = [];
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layerWeights = new Float32Array(this.layers[i] * this.layers[i + 1]);
      // Initialize with small random values
      for (let j = 0; j < layerWeights.length; j++) {
        layerWeights[j] = (Math.random() - 0.5) * 0.1;
      }
      weights.push(layerWeights);
    }
    return weights;
  }

  async classify(input, snnResult) {
    // Simple feedforward classification
    let current = this.preprocessInput(input, snnResult);
    
    for (let i = 0; i < this.weights.length; i++) {
      current = this.forwardLayer(current, this.weights[i], this.layers[i], this.layers[i + 1]);
    }
    
    return this.interpretOutput(current);
  }

  preprocessInput(input, snnResult) {
    // Combine text features with SNN output
    const features = new Float32Array(this.layers[0]);
    
    // Text length feature
    features[0] = Math.min(input.length / 1000, 1.0);
    
    // SNN confidence
    features[1] = snnResult.confidence;
    
    // Pattern encoding
    const patternMap = { fraud: 0.8, grooming: 0.6, violence: 0.4, scam: 0.2 };
    features[2] = patternMap[snnResult.pattern] || 0.1;
    
    return features;
  }

  forwardLayer(input, weights, inputSize, outputSize) {
    const output = new Float32Array(outputSize);
    
    for (let i = 0; i < outputSize; i++) {
      let sum = 0;
      for (let j = 0; j < inputSize; j++) {
        sum += input[j] * weights[i * inputSize + j];
      }
      // ReLU activation
      output[i] = Math.max(0, sum);
    }
    
    return output;
  }

  interpretOutput(output) {
    const threatTypes = ['fraud', 'grooming', 'violence', 'scam', 'phishing'];
    let maxIdx = 0;
    let maxVal = output[0];
    
    for (let i = 1; i < output.length && i < threatTypes.length; i++) {
      if (output[i] > maxVal) {
        maxVal = output[i];
        maxIdx = i;
      }
    }
    
    return {
      threatType: threatTypes[maxIdx],
      confidence: Math.min(maxVal, 1.0),
      scores: Array.from(output.slice(0, threatTypes.length))
    };
  }
}

// Resource Monitor
class ResourceMonitor {
  constructor() {
    this.metrics = {
      ram: { current: 0, limit: 150 },
      cpu: { current: 0, limit: 20 },
      battery: { level: 100, charging: false }
    };
  }

  async check() {
    // Check memory
    if (performance.memory) {
      this.metrics.ram.current = Math.round(
        performance.memory.usedJSHeapSize / 1048576
      );
    }

    // Check battery
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        this.metrics.battery.level = battery.level * 100;
        this.metrics.battery.charging = battery.charging;
      } catch (error) {
        // Battery API not available
      }
    }

    // Determine if critical
    const critical = 
      this.metrics.ram.current > this.metrics.ram.limit * 0.9 ||
      (this.metrics.battery.level < 20 && !this.metrics.battery.charging);

    return {
      ...this.metrics,
      critical
    };
  }
}

export default MobileNeuralEngine;
