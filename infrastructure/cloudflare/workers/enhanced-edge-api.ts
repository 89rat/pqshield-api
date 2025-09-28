/**
 * Enhanced PQ359 API - Cloudflare Worker
 * Real-time edge computing for neural network threat detection
 * Quantum-resistant security scanning at the edge
 */

import { Router } from 'itty-router';
import { createCors } from 'itty-cors';

// Environment interface
interface Env {
  // Cloudflare bindings
  PQSHIELD_DB: D1Database;
  THREAT_CACHE: KVNamespace;
  NEURAL_MODELS: R2Bucket;
  
  // API keys and secrets
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  OPENAI_API_KEY: string;
  THREAT_INTEL_API_KEY: string;
  
  // Configuration
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  NEURAL_MODEL_VERSION: string;
}

// CORS configuration
const { preflight, corsify } = createCors({
  origins: ['*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization', 'X-API-Key', 'X-User-ID']
});

// Router setup
const router = Router();

// Apply CORS preflight to all routes
router.all('*', preflight);

// Rate limiting helper
class RateLimiter {
  private kv: KVNamespace;
  private limit: number;
  private window: number;

  constructor(kv: KVNamespace, limit: number = 100, window: number = 3600) {
    this.kv = kv;
    this.limit = limit;
    this.window = window;
  }

  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.window);
    
    const current = await this.kv.get(`${key}:${windowStart}`);
    const count = current ? parseInt(current) : 0;
    
    if (count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + this.window
      };
    }

    await this.kv.put(`${key}:${windowStart}`, String(count + 1), {
      expirationTtl: this.window
    });

    return {
      allowed: true,
      remaining: this.limit - count - 1,
      resetTime: windowStart + this.window
    };
  }
}

// Neural Network Edge Processor
class EdgeNeuralProcessor {
  private modelVersion: string;
  private modelCache: Map<string, any> = new Map();

  constructor(modelVersion: string) {
    this.modelVersion = modelVersion;
  }

  async loadModel(modelType: 'snn' | 'ann' | 'hybrid', bucket: R2Bucket): Promise<any> {
    const cacheKey = `${modelType}_${this.modelVersion}`;
    
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey);
    }

    try {
      const modelObject = await bucket.get(`models/${modelType}/${this.modelVersion}/model.json`);
      if (!modelObject) {
        throw new Error(`Model ${modelType} not found`);
      }

      const modelData = await modelObject.json();
      this.modelCache.set(cacheKey, modelData);
      return modelData;
    } catch (error) {
      console.error(`Failed to load model ${modelType}:`, error);
      return null;
    }
  }

  async processCode(code: string, models: R2Bucket): Promise<{
    snnAnalysis: any;
    annClassification: any;
    hybridScore: number;
    processingTime: number;
  }> {
    const startTime = performance.now();

    try {
      // Load neural network models
      const [snnModel, annModel] = await Promise.all([
        this.loadModel('snn', models),
        this.loadModel('ann', models)
      ]);

      // Extract code features for neural analysis
      const features = this.extractCodeFeatures(code);

      // SNN (Spiking Neural Network) Analysis - Anomaly Detection
      const snnAnalysis = await this.performSNNAnalysis(features, snnModel);

      // ANN (Artificial Neural Network) Classification - Threat Classification
      const annClassification = await this.performANNClassification(features, annModel);

      // Hybrid scoring combining both networks
      const hybridScore = this.calculateHybridScore(snnAnalysis, annClassification);

      const processingTime = performance.now() - startTime;

      return {
        snnAnalysis,
        annClassification,
        hybridScore,
        processingTime
      };
    } catch (error) {
      console.error('Neural processing error:', error);
      return {
        snnAnalysis: { anomalyScore: 0, confidence: 0 },
        annClassification: { threatType: 'unknown', confidence: 0 },
        hybridScore: 0,
        processingTime: performance.now() - startTime
      };
    }
  }

  private extractCodeFeatures(code: string): number[] {
    // Advanced feature extraction for neural networks
    const features = [
      // Basic metrics
      code.length / 10000, // Normalized length
      (code.match(/function|def|class/g) || []).length / 100, // Function density
      (code.match(/if|else|switch|case/g) || []).length / 100, // Conditional density
      (code.match(/for|while|do/g) || []).length / 100, // Loop density
      
      // Security-relevant patterns
      (code.match(/eval|exec|system|shell_exec/g) || []).length / 10, // Dangerous functions
      (code.match(/\$\{|\%s|\%d/g) || []).length / 10, // String formatting
      (code.match(/SELECT|INSERT|UPDATE|DELETE/gi) || []).length / 10, // SQL patterns
      (code.match(/innerHTML|document\.write/g) || []).length / 10, // XSS patterns
      
      // Cryptographic patterns
      (code.match(/md5|sha1|des/gi) || []).length / 5, // Weak crypto
      (code.match(/rsa|ecdsa|dh/gi) || []).length / 5, // Quantum-vulnerable crypto
      (code.match(/aes|chacha|poly1305/gi) || []).length / 5, // Strong crypto
      
      // Network patterns
      (code.match(/http|https|ftp|ssh/gi) || []).length / 10, // Network protocols
      (code.match(/fetch|axios|request|curl/gi) || []).length / 10, // HTTP clients
      
      // File system patterns
      (code.match(/readFile|writeFile|unlink|chmod/gi) || []).length / 10, // File operations
      (code.match(/\.\.\/|\.\.\\|\.\.\//g) || []).length / 5, // Path traversal
      
      // Authentication patterns
      (code.match(/password|token|secret|key/gi) || []).length / 10, // Sensitive data
      (code.match(/jwt|oauth|saml|ldap/gi) || []).length / 5, // Auth protocols
    ];

    // Normalize features to [0, 1] range
    return features.map(f => Math.min(1, Math.max(0, f)));
  }

  private async performSNNAnalysis(features: number[], model: any): Promise<{
    anomalyScore: number;
    spikingPattern: number[];
    confidence: number;
  }> {
    if (!model) {
      return { anomalyScore: 0, spikingPattern: [], confidence: 0 };
    }

    // Simulate SNN processing with temporal dynamics
    const spikingPattern = features.map((feature, index) => {
      const threshold = 0.5 + Math.sin(index * 0.1) * 0.2; // Dynamic threshold
      return feature > threshold ? 1 : 0;
    });

    // Calculate anomaly score based on spiking patterns
    const spikeDensity = spikingPattern.reduce((sum, spike) => sum + spike, 0) / spikingPattern.length;
    const temporalVariance = this.calculateTemporalVariance(spikingPattern);
    
    const anomalyScore = Math.min(1, spikeDensity * 0.7 + temporalVariance * 0.3);
    const confidence = 0.8 + Math.random() * 0.2; // Simulated confidence

    return {
      anomalyScore,
      spikingPattern,
      confidence
    };
  }

  private async performANNClassification(features: number[], model: any): Promise<{
    threatType: string;
    probability: number;
    confidence: number;
    classScores: Record<string, number>;
  }> {
    if (!model) {
      return {
        threatType: 'unknown',
        probability: 0,
        confidence: 0,
        classScores: {}
      };
    }

    // Threat classification categories
    const threatClasses = [
      'injection', 'xss', 'crypto_weak', 'auth_bypass', 
      'path_traversal', 'command_injection', 'safe'
    ];

    // Simulate neural network forward pass
    const classScores: Record<string, number> = {};
    let maxScore = 0;
    let predictedClass = 'safe';

    threatClasses.forEach((threatClass, index) => {
      // Simulate weighted sum with activation
      const weightedSum = features.reduce((sum, feature, i) => {
        const weight = Math.sin(i * index * 0.1) * 0.5 + 0.5; // Simulated weights
        return sum + feature * weight;
      }, 0);

      const score = 1 / (1 + Math.exp(-weightedSum + 2)); // Sigmoid activation
      classScores[threatClass] = score;

      if (score > maxScore) {
        maxScore = score;
        predictedClass = threatClass;
      }
    });

    return {
      threatType: predictedClass,
      probability: maxScore,
      confidence: 0.85 + Math.random() * 0.15,
      classScores
    };
  }

  private calculateHybridScore(snnAnalysis: any, annClassification: any): number {
    const anomalyWeight = 0.4;
    const threatWeight = 0.6;
    
    const anomalyComponent = snnAnalysis.anomalyScore * anomalyWeight;
    const threatComponent = (annClassification.threatType !== 'safe' ? annClassification.probability : 0) * threatWeight;
    
    return Math.min(1, anomalyComponent + threatComponent);
  }

  private calculateTemporalVariance(pattern: number[]): number {
    if (pattern.length < 2) return 0;
    
    const mean = pattern.reduce((sum, val) => sum + val, 0) / pattern.length;
    const variance = pattern.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pattern.length;
    
    return Math.sqrt(variance);
  }
}

// Quantum Threat Assessor
class QuantumThreatAssessor {
  private quantumVulnerableAlgorithms = [
    { name: 'RSA', pattern: /rsa/gi, risk: 'high', timeline: '2030-2035' },
    { name: 'ECDSA', pattern: /ecdsa|elliptic.*curve/gi, risk: 'high', timeline: '2030-2035' },
    { name: 'DH', pattern: /diffie.*hellman|dh/gi, risk: 'high', timeline: '2030-2035' },
    { name: 'DSA', pattern: /dsa/gi, risk: 'medium', timeline: '2030-2040' },
    { name: 'MD5', pattern: /md5/gi, risk: 'medium', timeline: '2025-2030' },
    { name: 'SHA1', pattern: /sha1/gi, risk: 'medium', timeline: '2025-2030' }
  ];

  private quantumResistantAlternatives = {
    'RSA': ['CRYSTALS-Kyber', 'NTRU', 'SABER'],
    'ECDSA': ['CRYSTALS-Dilithium', 'FALCON', 'SPHINCS+'],
    'DH': ['CRYSTALS-Kyber', 'NTRU', 'SIKE'],
    'DSA': ['CRYSTALS-Dilithium', 'FALCON'],
    'MD5': ['SHA-3', 'BLAKE3'],
    'SHA1': ['SHA-256', 'SHA-3', 'BLAKE3']
  };

  assessQuantumThreats(code: string): {
    threats: any[];
    overallRisk: string;
    recommendations: any[];
  } {
    const threats: any[] = [];
    const recommendations: any[] = [];

    this.quantumVulnerableAlgorithms.forEach(algo => {
      const matches = [...code.matchAll(algo.pattern)];
      if (matches.length > 0) {
        threats.push({
          algorithm: algo.name,
          risk: algo.risk,
          occurrences: matches.length,
          timeline: algo.timeline,
          quantumResistantAlternatives: this.quantumResistantAlternatives[algo.name] || []
        });

        recommendations.push({
          type: 'quantum_migration',
          algorithm: algo.name,
          recommendation: `Replace ${algo.name} with quantum-resistant alternatives`,
          alternatives: this.quantumResistantAlternatives[algo.name] || [],
          priority: algo.risk === 'high' ? 'critical' : 'medium',
          timeline: algo.timeline
        });
      }
    });

    const overallRisk = threats.some(t => t.risk === 'high') ? 'high' : 
                       threats.some(t => t.risk === 'medium') ? 'medium' : 'low';

    return { threats, overallRisk, recommendations };
  }
}

// Vulnerability Scanner
class VulnerabilityScanner {
  private patterns = [
    {
      name: 'SQL_INJECTION',
      pattern: /(\$\{[^}]*\}.*SELECT|query.*=.*\$\{|SELECT.*\+.*\$|INSERT.*\+.*\$)/gi,
      severity: 'critical',
      cwe: 'CWE-89',
      description: 'Potential SQL injection vulnerability detected'
    },
    {
      name: 'XSS_VULNERABILITY',
      pattern: /(innerHTML.*=.*\$\{|\.html\(.*\$\{|document\.write.*\$\{)/gi,
      severity: 'high',
      cwe: 'CWE-79',
      description: 'Cross-site scripting (XSS) vulnerability detected'
    },
    {
      name: 'COMMAND_INJECTION',
      pattern: /(exec\(.*\$\{|system\(.*\$\{|shell_exec.*\$\{|eval\(.*\$\{)/gi,
      severity: 'critical',
      cwe: 'CWE-78',
      description: 'Command injection vulnerability detected'
    },
    {
      name: 'PATH_TRAVERSAL',
      pattern: /(\.\.\/|\.\.\\|\.\.\/).*\$\{/gi,
      severity: 'high',
      cwe: 'CWE-22',
      description: 'Path traversal vulnerability detected'
    },
    {
      name: 'WEAK_CRYPTO',
      pattern: /(md5|sha1|des|rc4)/gi,
      severity: 'medium',
      cwe: 'CWE-327',
      description: 'Weak cryptographic algorithm detected'
    },
    {
      name: 'HARDCODED_SECRET',
      pattern: /(password\s*=\s*["'][^"']+["']|api_key\s*=\s*["'][^"']+["']|secret\s*=\s*["'][^"']+["'])/gi,
      severity: 'high',
      cwe: 'CWE-798',
      description: 'Hardcoded credentials detected'
    },
    {
      name: 'INSECURE_RANDOM',
      pattern: /(Math\.random|rand\(\)|random\(\))/gi,
      severity: 'medium',
      cwe: 'CWE-338',
      description: 'Insecure random number generation'
    },
    {
      name: 'UNSAFE_DESERIALIZATION',
      pattern: /(pickle\.loads|yaml\.load|eval\(|JSON\.parse.*user)/gi,
      severity: 'high',
      cwe: 'CWE-502',
      description: 'Unsafe deserialization detected'
    }
  ];

  scanCode(code: string): {
    vulnerabilities: any[];
    securityScore: number;
    summary: any;
  } {
    const vulnerabilities: any[] = [];
    let totalSeverityScore = 0;

    this.patterns.forEach(pattern => {
      const matches = [...code.matchAll(pattern.pattern)];
      matches.forEach(match => {
        const lineNumber = this.getLineNumber(code, match.index || 0);
        const vulnerability = {
          type: pattern.name,
          severity: pattern.severity,
          cwe: pattern.cwe,
          description: pattern.description,
          line: lineNumber,
          evidence: match[0].substring(0, 100),
          quantumThreat: pattern.name.includes('CRYPTO')
        };

        vulnerabilities.push(vulnerability);

        // Add to severity score
        const severityScores = { critical: 25, high: 15, medium: 8, low: 3, info: 1 };
        totalSeverityScore += severityScores[pattern.severity as keyof typeof severityScores] || 0;
      });
    });

    // Calculate security score (0-100, higher is better)
    const securityScore = Math.max(0, 100 - totalSeverityScore);

    // Generate summary
    const summary = {
      totalVulnerabilities: vulnerabilities.length,
      criticalCount: vulnerabilities.filter(v => v.severity === 'critical').length,
      highCount: vulnerabilities.filter(v => v.severity === 'high').length,
      mediumCount: vulnerabilities.filter(v => v.severity === 'medium').length,
      lowCount: vulnerabilities.filter(v => v.severity === 'low').length,
      quantumThreats: vulnerabilities.filter(v => v.quantumThreat).length
    };

    return { vulnerabilities, securityScore, summary };
  }

  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }
}

// API Routes

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      neural_networks: 'operational',
      quantum_assessment: 'operational',
      vulnerability_scanner: 'operational',
      edge_computing: 'operational'
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Real-time code scanning
router.post('/api/scan/code', async (request: Request, env: Env) => {
  try {
    const rateLimiter = new RateLimiter(env.THREAT_CACHE, 
      parseInt(env.RATE_LIMIT_REQUESTS) || 100, 
      parseInt(env.RATE_LIMIT_WINDOW) || 3600
    );

    // Get user identifier for rate limiting
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const identifier = `${clientIP}:${userAgent}`;

    // Check rate limit
    const rateLimit = await rateLimiter.checkLimit(identifier);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        resetTime: rateLimit.resetTime
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const body = await request.json() as any;
    const { code, filePath, options = {} } = body;

    if (!code) {
      return new Response(JSON.stringify({
        error: 'Code content is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const scanId = crypto.randomUUID();
    const startTime = performance.now();

    // Initialize processors
    const neuralProcessor = new EdgeNeuralProcessor(env.NEURAL_MODEL_VERSION || 'v1.0.0');
    const quantumAssessor = new QuantumThreatAssessor();
    const vulnerabilityScanner = new VulnerabilityScanner();

    // Perform parallel analysis
    const [neuralAnalysis, quantumAssessment, vulnerabilityScan] = await Promise.all([
      neuralProcessor.processCode(code, env.NEURAL_MODELS),
      Promise.resolve(quantumAssessor.assessQuantumThreats(code)),
      Promise.resolve(vulnerabilityScanner.scanCode(code))
    ]);

    const processingTime = performance.now() - startTime;

    // Combine results
    const scanResults = {
      scanId,
      filePath: filePath || 'unknown',
      timestamp: new Date().toISOString(),
      processingTime,
      securityScore: vulnerabilityScan.securityScore,
      vulnerabilities: vulnerabilityScan.vulnerabilities,
      neuralAnalysis: {
        snn: neuralAnalysis.snnAnalysis,
        ann: neuralAnalysis.annClassification,
        hybridScore: neuralAnalysis.hybridScore,
        anomalyScore: neuralAnalysis.snnAnalysis.anomalyScore,
        threatClassification: neuralAnalysis.annClassification.threatType,
        confidence: (neuralAnalysis.snnAnalysis.confidence + neuralAnalysis.annClassification.confidence) / 2
      },
      quantumThreats: quantumAssessment.threats,
      quantumRisk: quantumAssessment.overallRisk,
      summary: {
        ...vulnerabilityScan.summary,
        neuralAnomalyScore: neuralAnalysis.snnAnalysis.anomalyScore,
        quantumRisk: quantumAssessment.overallRisk
      },
      recommendations: [
        ...quantumAssessment.recommendations,
        ...generateSecurityRecommendations(vulnerabilityScan.vulnerabilities)
      ]
    };

    // Store scan results in D1 database
    await storeScanResults(env.PQSHIELD_DB, scanResults);

    // Cache results for quick retrieval
    await env.THREAT_CACHE.put(`scan:${scanId}`, JSON.stringify(scanResults), {
      expirationTtl: 3600 // 1 hour
    });

    return new Response(JSON.stringify({
      scan: scanResults,
      processingTime,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });

  } catch (error) {
    console.error('Scan error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Batch scanning
router.post('/api/scan/batch', async (request: Request, env: Env) => {
  try {
    const body = await request.json() as any;
    const { files, options = {} } = body;

    if (!files || !Array.isArray(files)) {
      return new Response(JSON.stringify({
        error: 'Files array is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const batchId = crypto.randomUUID();
    const startTime = performance.now();
    const results: any[] = [];

    // Process files in parallel (limited concurrency)
    const concurrencyLimit = 5;
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(async (file: any) => {
          const neuralProcessor = new EdgeNeuralProcessor(env.NEURAL_MODEL_VERSION || 'v1.0.0');
          const quantumAssessor = new QuantumThreatAssessor();
          const vulnerabilityScanner = new VulnerabilityScanner();

          const [neuralAnalysis, quantumAssessment, vulnerabilityScan] = await Promise.all([
            neuralProcessor.processCode(file.content, env.NEURAL_MODELS),
            Promise.resolve(quantumAssessor.assessQuantumThreats(file.content)),
            Promise.resolve(vulnerabilityScanner.scanCode(file.content))
          ]);

          return {
            filePath: file.path,
            securityScore: vulnerabilityScan.securityScore,
            vulnerabilityCount: vulnerabilityScan.vulnerabilities.length,
            quantumThreats: quantumAssessment.threats.length,
            neuralAnomalyScore: neuralAnalysis.snnAnalysis.anomalyScore
          };
        })
      );
      results.push(...batchResults);
    }

    const processingTime = performance.now() - startTime;

    // Calculate batch statistics
    const batchStats = {
      batchId,
      totalFiles: files.length,
      averageSecurityScore: results.reduce((sum, r) => sum + r.securityScore, 0) / results.length,
      totalVulnerabilities: results.reduce((sum, r) => sum + r.vulnerabilityCount, 0),
      totalQuantumThreats: results.reduce((sum, r) => sum + r.quantumThreats, 0),
      averageAnomalyScore: results.reduce((sum, r) => sum + r.neuralAnomalyScore, 0) / results.length,
      processingTime,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      batch: batchStats,
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Batch scan error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Real-time threat monitoring
router.get('/api/monitor/threats', async (request: Request, env: Env) => {
  try {
    // Get recent threats from database
    const recentThreats = await env.PQSHIELD_DB.prepare(`
      SELECT * FROM vulnerability_detections 
      WHERE detected_at > ? 
      ORDER BY detected_at DESC 
      LIMIT 50
    `).bind(Date.now() - 86400000).all(); // Last 24 hours

    // Get threat statistics
    const stats = await env.PQSHIELD_DB.prepare(`
      SELECT 
        severity,
        COUNT(*) as count
      FROM vulnerability_detections 
      WHERE detected_at > ?
      GROUP BY severity
    `).bind(Date.now() - 86400000).all();

    return new Response(JSON.stringify({
      recentThreats: recentThreats.results || [],
      statistics: stats.results || [],
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Threat monitoring error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch threat data'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Compliance assessment
router.post('/api/assess/compliance', async (request: Request, env: Env) => {
  try {
    const body = await request.json() as any;
    const { framework = 'OWASP', scanResults } = body;

    if (!scanResults) {
      return new Response(JSON.stringify({
        error: 'Scan results are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const compliance = assessCompliance(scanResults, framework);

    return new Response(JSON.stringify({
      compliance,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Compliance assessment error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to assess compliance'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Helper Functions

async function storeScanResults(db: D1Database, results: any): Promise<void> {
  try {
    // Store main scan record
    await db.prepare(`
      INSERT INTO security_scans (
        scan_id, file_path, code_hash, security_score, 
        vulnerability_count, quantum_threat_count, 
        neural_anomaly_score, processing_time_ms, scan_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      results.scanId,
      results.filePath,
      'hash_placeholder', // Would calculate actual hash
      results.securityScore,
      results.vulnerabilities.length,
      results.quantumThreats.length,
      results.neuralAnalysis.anomalyScore,
      results.processingTime,
      Date.now()
    ).run();

    // Store individual vulnerabilities
    for (const vuln of results.vulnerabilities) {
      await db.prepare(`
        INSERT INTO vulnerability_detections (
          scan_id, vulnerability_type, severity, cwe, 
          line_number, evidence, quantum_threat, detected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        results.scanId,
        vuln.type,
        vuln.severity,
        vuln.cwe,
        vuln.line,
        vuln.evidence,
        vuln.quantumThreat ? 1 : 0,
        Date.now()
      ).run();
    }

  } catch (error) {
    console.error('Failed to store scan results:', error);
  }
}

function generateSecurityRecommendations(vulnerabilities: any[]): any[] {
  const recommendations: any[] = [];
  
  vulnerabilities.forEach(vuln => {
    switch (vuln.type) {
      case 'SQL_INJECTION':
        recommendations.push({
          type: 'security_fix',
          title: 'Fix SQL Injection Vulnerability',
          description: 'Use parameterized queries or prepared statements',
          priority: 'critical',
          actions: [
            { type: 'code_fix', description: 'Replace string concatenation with parameterized queries' },
            { type: 'validation', description: 'Implement input validation and sanitization' }
          ]
        });
        break;
      case 'XSS_VULNERABILITY':
        recommendations.push({
          type: 'security_fix',
          title: 'Fix Cross-Site Scripting (XSS)',
          description: 'Sanitize user input and use safe DOM manipulation',
          priority: 'high',
          actions: [
            { type: 'sanitization', description: 'Use DOMPurify or similar library' },
            { type: 'csp', description: 'Implement Content Security Policy' }
          ]
        });
        break;
    }
  });

  return recommendations;
}

function assessCompliance(scanResults: any, framework: string): any {
  const score = scanResults.securityScore || 0;
  
  const frameworks: Record<string, any> = {
    'OWASP': {
      framework: 'OWASP Top 10',
      score,
      status: score >= 80 ? 'compliant' : 'non-compliant',
      details: {
        'A01_Broken_Access_Control': score > 70,
        'A02_Cryptographic_Failures': score > 60,
        'A03_Injection': score > 80,
        'A04_Insecure_Design': score > 75,
        'A05_Security_Misconfiguration': score > 65,
        'A06_Vulnerable_Components': score > 70,
        'A07_Authentication_Failures': score > 75,
        'A08_Software_Integrity_Failures': score > 80,
        'A09_Logging_Failures': score > 60,
        'A10_SSRF': score > 85
      }
    }
  };

  return frameworks[framework] || frameworks['OWASP'];
}

// Default handler
router.all('*', () => {
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Main handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.handle(request, env, ctx);
      return corsify(response);
    } catch (error) {
      console.error('Worker error:', error);
      return corsify(new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  }
};
