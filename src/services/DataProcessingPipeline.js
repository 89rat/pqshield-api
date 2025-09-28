/**
 * Real-time Data Processing Pipeline for PQShield API
 * Live threat analysis, neural network processing, and quantum assessment
 */

import { EventEmitter } from 'events';
import { db } from '../infrastructure/firebase/firebase-config.js';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';

class DataProcessingPipeline extends EventEmitter {
  constructor() {
    super();
    
    // Processing stages
    this.stages = {
      INPUT_VALIDATION: 'input_validation',
      PREPROCESSING: 'preprocessing',
      NEURAL_ANALYSIS: 'neural_analysis',
      VULNERABILITY_SCAN: 'vulnerability_scan',
      QUANTUM_ASSESSMENT: 'quantum_assessment',
      COMPLIANCE_CHECK: 'compliance_check',
      RESULT_AGGREGATION: 'result_aggregation',
      OUTPUT_FORMATTING: 'output_formatting'
    };
    
    // Processing queues
    this.queues = {
      high: [], // Critical/real-time processing
      medium: [], // Standard processing
      low: [] // Batch/background processing
    };
    
    // Worker pools
    this.workers = {
      neural: new Set(),
      scanner: new Set(),
      quantum: new Set()
    };
    
    // Processing metrics
    this.metrics = {
      processed: 0,
      errors: 0,
      averageProcessingTime: 0,
      throughput: 0,
      queueSizes: { high: 0, medium: 0, low: 0 }
    };
    
    // Cache for frequently accessed data
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Real-time listeners
    this.listeners = new Map();
    
    this.initializeWorkers();
    this.startProcessing();
    this.startMetricsCollection();
  }

  // Initialize processing workers
  initializeWorkers() {
    // Neural network workers
    for (let i = 0; i < 3; i++) {
      const worker = new NeuralAnalysisWorker(`neural_${i}`);
      this.workers.neural.add(worker);
    }
    
    // Vulnerability scanner workers
    for (let i = 0; i < 5; i++) {
      const worker = new VulnerabilityWorker(`scanner_${i}`);
      this.workers.scanner.add(worker);
    }
    
    // Quantum assessment workers
    for (let i = 0; i < 2; i++) {
      const worker = new QuantumWorker(`quantum_${i}`);
      this.workers.quantum.add(worker);
    }
  }

  // Add job to processing queue
  addJob(job, priority = 'medium') {
    const jobWithMetadata = {
      ...job,
      id: this.generateJobId(),
      priority,
      createdAt: Date.now(),
      status: 'queued',
      retries: 0,
      maxRetries: 3
    };
    
    this.queues[priority].push(jobWithMetadata);
    this.updateMetrics();
    
    this.emit('job_queued', jobWithMetadata);
    
    return jobWithMetadata.id;
  }

  // Process code in real-time
  async processCode(code, options = {}) {
    const jobId = this.generateJobId();
    const startTime = Date.now();
    
    try {
      // Create processing context
      const context = {
        jobId,
        code,
        options,
        startTime,
        results: {},
        errors: [],
        stage: this.stages.INPUT_VALIDATION
      };
      
      this.emit('processing_started', { jobId, stage: context.stage });
      
      // Stage 1: Input Validation
      await this.validateInput(context);
      
      // Stage 2: Preprocessing
      await this.preprocessCode(context);
      
      // Stage 3: Parallel Analysis
      const analysisPromises = [
        this.performNeuralAnalysis(context),
        this.performVulnerabilityScan(context),
        this.performQuantumAssessment(context)
      ];
      
      await Promise.all(analysisPromises);
      
      // Stage 4: Compliance Check
      await this.performComplianceCheck(context);
      
      // Stage 5: Result Aggregation
      await this.aggregateResults(context);
      
      // Stage 6: Output Formatting
      await this.formatOutput(context);
      
      const processingTime = Date.now() - startTime;
      context.results.processingTime = processingTime;
      
      this.updateProcessingMetrics(processingTime);
      this.emit('processing_completed', { jobId, results: context.results });
      
      return context.results;
      
    } catch (error) {
      console.error(`Processing error for job ${jobId}:`, error);
      this.metrics.errors++;
      this.emit('processing_error', { jobId, error: error.message });
      throw error;
    }
  }

  // Stage 1: Input Validation
  async validateInput(context) {
    context.stage = this.stages.INPUT_VALIDATION;
    this.emit('stage_started', { jobId: context.jobId, stage: context.stage });
    
    if (!context.code || typeof context.code !== 'string') {
      throw new Error('Invalid code input');
    }
    
    if (context.code.length > 1000000) { // 1MB limit
      throw new Error('Code size exceeds maximum limit');
    }
    
    // Sanitize code
    context.sanitizedCode = this.sanitizeCode(context.code);
    
    this.emit('stage_completed', { jobId: context.jobId, stage: context.stage });
  }

  // Stage 2: Preprocessing
  async preprocessCode(context) {
    context.stage = this.stages.PREPROCESSING;
    this.emit('stage_started', { jobId: context.jobId, stage: context.stage });
    
    // Extract code features
    context.features = this.extractCodeFeatures(context.sanitizedCode);
    
    // Generate code hash for caching
    context.codeHash = await this.generateCodeHash(context.sanitizedCode);
    
    // Check cache
    const cached = this.cache.get(context.codeHash);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      context.results = { ...cached.results, fromCache: true };
      return;
    }
    
    this.emit('stage_completed', { jobId: context.jobId, stage: context.stage });
  }

  // Stage 3a: Neural Network Analysis
  async performNeuralAnalysis(context) {
    context.stage = this.stages.NEURAL_ANALYSIS;
    this.emit('stage_started', { jobId: context.jobId, stage: context.stage });
    
    try {
      const worker = this.getAvailableWorker('neural');
      if (!worker) {
        throw new Error('No neural analysis workers available');
      }
      
      const analysis = await worker.analyze(context.features, context.sanitizedCode);
      context.results.neuralAnalysis = analysis;
      
      this.emit('neural_analysis_completed', { 
        jobId: context.jobId, 
        analysis 
      });
      
    } catch (error) {
      console.error('Neural analysis error:', error);
      context.errors.push({ stage: 'neural_analysis', error: error.message });
    }
    
    this.emit('stage_completed', { jobId: context.jobId, stage: context.stage });
  }

  // Stage 3b: Vulnerability Scanning
  async performVulnerabilityScan(context) {
    context.stage = this.stages.VULNERABILITY_SCAN;
    this.emit('stage_started', { jobId: context.jobId, stage: context.stage });
    
    try {
      const worker = this.getAvailableWorker('scanner');
      if (!worker) {
        throw new Error('No vulnerability scanner workers available');
      }
      
      const scan = await worker.scan(context.sanitizedCode, context.options);
      context.results.vulnerabilities = scan.vulnerabilities;
      context.results.securityScore = scan.securityScore;
      
      this.emit('vulnerability_scan_completed', { 
        jobId: context.jobId, 
        vulnerabilities: scan.vulnerabilities,
        securityScore: scan.securityScore
      });
      
    } catch (error) {
      console.error('Vulnerability scan error:', error);
      context.errors.push({ stage: 'vulnerability_scan', error: error.message });
    }
    
    this.emit('stage_completed', { jobId: context.jobId, stage: context.stage });
  }

  // Stage 3c: Quantum Threat Assessment
  async performQuantumAssessment(context) {
    context.stage = this.stages.QUANTUM_ASSESSMENT;
    this.emit('stage_started', { jobId: context.jobId, stage: context.stage });
    
    try {
      const worker = this.getAvailableWorker('quantum');
      if (!worker) {
        throw new Error('No quantum assessment workers available');
      }
      
      const assessment = await worker.assess(context.sanitizedCode);
      context.results.quantumThreats = assessment.threats;
      context.results.quantumRisk = assessment.overallRisk;
      
      this.emit('quantum_assessment_completed', { 
        jobId: context.jobId, 
        threats: assessment.threats,
        risk: assessment.overallRisk
      });
      
    } catch (error) {
      console.error('Quantum assessment error:', error);
      context.errors.push({ stage: 'quantum_assessment', error: error.message });
    }
    
    this.emit('stage_completed', { jobId: context.jobId, stage: context.stage });
  }

  // Stage 4: Compliance Check
  async performComplianceCheck(context) {
    context.stage = this.stages.COMPLIANCE_CHECK;
    this.emit('stage_started', { jobId: context.jobId, stage: context.stage });
    
    try {
      const framework = context.options.complianceFramework || 'OWASP';
      const compliance = this.assessCompliance(context.results, framework);
      context.results.compliance = compliance;
      
      this.emit('compliance_check_completed', { 
        jobId: context.jobId, 
        compliance 
      });
      
    } catch (error) {
      console.error('Compliance check error:', error);
      context.errors.push({ stage: 'compliance_check', error: error.message });
    }
    
    this.emit('stage_completed', { jobId: context.jobId, stage: context.stage });
  }

  // Stage 5: Result Aggregation
  async aggregateResults(context) {
    context.stage = this.stages.RESULT_AGGREGATION;
    this.emit('stage_started', { jobId: context.jobId, stage: context.stage });
    
    // Calculate overall risk score
    const riskFactors = [
      context.results.securityScore ? (100 - context.results.securityScore) / 100 : 0,
      context.results.neuralAnalysis?.anomalyScore || 0,
      context.results.quantumRisk === 'high' ? 0.8 : context.results.quantumRisk === 'medium' ? 0.5 : 0.2
    ];
    
    context.results.overallRisk = riskFactors.reduce((sum, factor) => sum + factor, 0) / riskFactors.length;
    
    // Generate recommendations
    context.results.recommendations = this.generateRecommendations(context.results);
    
    // Create summary
    context.results.summary = {
      totalVulnerabilities: context.results.vulnerabilities?.length || 0,
      criticalIssues: context.results.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
      quantumThreats: context.results.quantumThreats?.length || 0,
      overallRisk: context.results.overallRisk,
      complianceStatus: context.results.compliance?.status || 'unknown'
    };
    
    this.emit('stage_completed', { jobId: context.jobId, stage: context.stage });
  }

  // Stage 6: Output Formatting
  async formatOutput(context) {
    context.stage = this.stages.OUTPUT_FORMATTING;
    this.emit('stage_started', { jobId: context.jobId, stage: context.stage });
    
    // Add metadata
    context.results.metadata = {
      jobId: context.jobId,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      processingStages: Object.values(this.stages),
      errors: context.errors
    };
    
    // Cache results
    this.cache.set(context.codeHash, {
      results: context.results,
      timestamp: Date.now()
    });
    
    this.emit('stage_completed', { jobId: context.jobId, stage: context.stage });
  }

  // Real-time threat monitoring
  startThreatMonitoring(userId) {
    const listenerId = `threats_${userId}`;
    
    if (this.listeners.has(listenerId)) {
      return this.listeners.get(listenerId);
    }
    
    const threatsQuery = query(
      collection(db, 'threats'),
      where('userId', '==', userId),
      orderBy('detectedAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(threatsQuery, (snapshot) => {
      const threats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      this.emit('threats_updated', { userId, threats });
      
      // Process new threats in real-time
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const threat = { id: change.doc.id, ...change.doc.data() };
          this.processThreatInRealTime(threat);
        }
      });
    });
    
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Process individual threats in real-time
  async processThreatInRealTime(threat) {
    try {
      // Analyze threat severity and impact
      const analysis = await this.analyzeThreat(threat);
      
      // Update threat with analysis
      await updateDoc(doc(db, 'threats', threat.id), {
        analysis,
        processedAt: serverTimestamp()
      });
      
      // Trigger alerts if necessary
      if (analysis.severity === 'critical') {
        this.emit('critical_threat_detected', { threat, analysis });
      }
      
      this.emit('threat_processed', { threat, analysis });
      
    } catch (error) {
      console.error('Real-time threat processing error:', error);
    }
  }

  // Analyze individual threats
  async analyzeThreat(threat) {
    return {
      riskScore: this.calculateThreatRiskScore(threat),
      impactAssessment: this.assessThreatImpact(threat),
      mitigationSuggestions: this.generateMitigationSuggestions(threat),
      relatedThreats: await this.findRelatedThreats(threat)
    };
  }

  // Helper methods
  sanitizeCode(code) {
    // Remove potentially dangerous content while preserving structure
    return code
      .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .trim();
  }

  extractCodeFeatures(code) {
    return {
      length: code.length,
      lines: code.split('\n').length,
      functions: (code.match(/function|def|class/g) || []).length,
      conditionals: (code.match(/if|else|switch|case/g) || []).length,
      loops: (code.match(/for|while|do/g) || []).length,
      imports: (code.match(/import|require|include/g) || []).length,
      strings: (code.match(/["'`]/g) || []).length,
      comments: (code.match(/\/\/|\/\*|\#/g) || []).length,
      complexity: this.calculateCyclomaticComplexity(code)
    };
  }

  calculateCyclomaticComplexity(code) {
    const complexityPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g
    ];
    
    let complexity = 1; // Base complexity
    
    complexityPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }

  async generateCodeHash(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  getAvailableWorker(type) {
    const workers = Array.from(this.workers[type]);
    return workers.find(worker => !worker.isBusy()) || workers[0];
  }

  assessCompliance(results, framework) {
    const score = results.securityScore || 0;
    
    const frameworks = {
      'OWASP': {
        framework: 'OWASP Top 10',
        score,
        status: score >= 80 ? 'compliant' : 'non-compliant',
        details: {
          'A01_Broken_Access_Control': score > 70,
          'A02_Cryptographic_Failures': score > 60,
          'A03_Injection': score > 80,
          'A04_Insecure_Design': score > 75
        }
      }
    };
    
    return frameworks[framework] || frameworks['OWASP'];
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    if (results.vulnerabilities) {
      results.vulnerabilities.forEach(vuln => {
        recommendations.push({
          type: 'vulnerability_fix',
          severity: vuln.severity,
          title: `Fix ${vuln.type}`,
          description: `Address ${vuln.type} vulnerability at line ${vuln.line}`,
          priority: vuln.severity === 'critical' ? 'high' : 'medium'
        });
      });
    }
    
    if (results.quantumThreats && results.quantumThreats.length > 0) {
      recommendations.push({
        type: 'quantum_migration',
        title: 'Quantum-Resistant Cryptography',
        description: 'Migrate to post-quantum cryptographic algorithms',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  calculateThreatRiskScore(threat) {
    const severityScores = { critical: 10, high: 7, medium: 4, low: 2, info: 1 };
    return severityScores[threat.severity] || 1;
  }

  assessThreatImpact(threat) {
    return {
      confidentiality: threat.type?.includes('injection') ? 'high' : 'medium',
      integrity: threat.type?.includes('xss') ? 'high' : 'medium',
      availability: threat.type?.includes('dos') ? 'high' : 'low'
    };
  }

  generateMitigationSuggestions(threat) {
    const suggestions = {
      'SQL_INJECTION': ['Use parameterized queries', 'Implement input validation'],
      'XSS_VULNERABILITY': ['Sanitize user input', 'Use Content Security Policy'],
      'COMMAND_INJECTION': ['Avoid system calls with user input', 'Use safe APIs']
    };
    
    return suggestions[threat.type] || ['Review and update security practices'];
  }

  async findRelatedThreats(threat) {
    // Find threats with similar characteristics
    const relatedQuery = query(
      collection(db, 'threats'),
      where('type', '==', threat.type),
      orderBy('detectedAt', 'desc'),
      limit(5)
    );
    
    try {
      const snapshot = await relatedQuery.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error finding related threats:', error);
      return [];
    }
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateMetrics() {
    this.metrics.queueSizes = {
      high: this.queues.high.length,
      medium: this.queues.medium.length,
      low: this.queues.low.length
    };
  }

  updateProcessingMetrics(processingTime) {
    this.metrics.processed++;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.processed - 1) + processingTime) / 
      this.metrics.processed;
  }

  startProcessing() {
    // Process queues in priority order
    setInterval(() => {
      ['high', 'medium', 'low'].forEach(priority => {
        if (this.queues[priority].length > 0) {
          const job = this.queues[priority].shift();
          this.processJob(job);
        }
      });
    }, 100); // Check every 100ms
  }

  async processJob(job) {
    try {
      const result = await this.processCode(job.code, job.options);
      this.emit('job_completed', { job, result });
    } catch (error) {
      job.retries++;
      if (job.retries < job.maxRetries) {
        this.queues[job.priority].push(job);
      } else {
        this.emit('job_failed', { job, error });
      }
    }
  }

  startMetricsCollection() {
    setInterval(() => {
      this.emit('metrics_updated', this.metrics);
    }, 5000); // Every 5 seconds
  }

  getMetrics() {
    return {
      ...this.metrics,
      queueSizes: this.metrics.queueSizes,
      cacheSize: this.cache.size,
      activeListeners: this.listeners.size
    };
  }
}

// Worker classes for different processing types
class NeuralAnalysisWorker {
  constructor(id) {
    this.id = id;
    this.busy = false;
  }

  isBusy() {
    return this.busy;
  }

  async analyze(features, code) {
    this.busy = true;
    
    try {
      // Simulate neural network processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const anomalyScore = Math.random() * (features.complexity > 10 ? 1 : 0.3);
      const threatTypes = ['injection', 'xss', 'crypto_weak', 'safe'];
      const threatClassification = threatTypes[Math.floor(Math.random() * threatTypes.length)];
      
      return {
        anomalyScore,
        threatClassification,
        confidence: 0.85 + Math.random() * 0.15,
        processingTime: 100,
        workerId: this.id
      };
    } finally {
      this.busy = false;
    }
  }
}

class VulnerabilityWorker {
  constructor(id) {
    this.id = id;
    this.busy = false;
  }

  isBusy() {
    return this.busy;
  }

  async scan(code, options) {
    this.busy = true;
    
    try {
      // Simulate vulnerability scanning
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const patterns = [
        { name: 'SQL_INJECTION', pattern: /(\$\{[^}]*\}.*SELECT|query.*=.*\$\{)/gi, severity: 'critical' },
        { name: 'XSS_VULNERABILITY', pattern: /(innerHTML.*=.*\$\{|\.html\(.*\$\{)/gi, severity: 'high' },
        { name: 'COMMAND_INJECTION', pattern: /(exec\(.*\$\{|system\(.*\$\{)/gi, severity: 'critical' }
      ];
      
      const vulnerabilities = [];
      let securityScore = 100;
      
      patterns.forEach(pattern => {
        const matches = [...code.matchAll(pattern.pattern)];
        matches.forEach(match => {
          vulnerabilities.push({
            type: pattern.name,
            severity: pattern.severity,
            line: this.getLineNumber(code, match.index),
            evidence: match[0].substring(0, 100)
          });
          
          securityScore -= pattern.severity === 'critical' ? 25 : 15;
        });
      });
      
      return {
        vulnerabilities,
        securityScore: Math.max(0, securityScore),
        workerId: this.id
      };
    } finally {
      this.busy = false;
    }
  }

  getLineNumber(code, index) {
    return code.substring(0, index).split('\n').length;
  }
}

class QuantumWorker {
  constructor(id) {
    this.id = id;
    this.busy = false;
  }

  isBusy() {
    return this.busy;
  }

  async assess(code) {
    this.busy = true;
    
    try {
      // Simulate quantum threat assessment
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const quantumVulnerable = [
        { pattern: /RSA/gi, algorithm: 'RSA', risk: 'high' },
        { pattern: /ECDSA/gi, algorithm: 'ECDSA', risk: 'high' },
        { pattern: /md5|sha1/gi, algorithm: 'Weak Hash', risk: 'medium' }
      ];
      
      const threats = [];
      
      quantumVulnerable.forEach(vuln => {
        const matches = [...code.matchAll(vuln.pattern)];
        if (matches.length > 0) {
          threats.push({
            algorithm: vuln.algorithm,
            risk: vuln.risk,
            occurrences: matches.length,
            recommendation: `Replace ${vuln.algorithm} with quantum-resistant alternative`
          });
        }
      });
      
      const overallRisk = threats.some(t => t.risk === 'high') ? 'high' : 
                         threats.some(t => t.risk === 'medium') ? 'medium' : 'low';
      
      return {
        threats,
        overallRisk,
        workerId: this.id
      };
    } finally {
      this.busy = false;
    }
  }
}

// Singleton instance
const dataProcessingPipeline = new DataProcessingPipeline();

export default dataProcessingPipeline;
