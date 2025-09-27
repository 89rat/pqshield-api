/**
 * SNN/ANN Edge Security API - Cloudflare Workers
 * Ultra-low latency neural network threat detection at the edge
 */

import { Router } from 'itty-router';

const router = Router();

// Environment variables bound to the worker
interface Env {
  OPENAI_API_KEY: string;
  FIREBASE_API_KEY: string;
  R2_BUCKET: R2Bucket;
  D1_DATABASE: D1Database;
  KV_CACHE: KVNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  SNN_MODEL_CACHE: KVNamespace;
  ANN_MODEL_CACHE: KVNamespace;
}

// SNN/ANN Threat Detection endpoint - runs at edge for <1ms latency
router.post('/api/detect-threat', async (request: Request, env: Env) => {
  const { deviceId, packetData, timestamp, metadata } = await request.json();
  
  // Rate limiting using Durable Objects
  const rateLimiter = env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName(deviceId));
  const allowed = await rateLimiter.fetch(request);
  
  if (!allowed) {
    return new Response(JSON.stringify({ 
      error: 'Rate limit exceeded',
      threatLevel: 'blocked',
      action: 'rate_limited'
    }), { 
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check threat pattern cache first (Cloudflare KV)
  const cacheKey = `threat:${hashPacket(packetData)}`;
  const cached = await env.KV_CACHE.get(cacheKey, 'json');
  
  if (cached) {
    await trackDetection(env.D1_DATABASE, deviceId, 'cache_hit', cached);
    return new Response(JSON.stringify({
      ...cached,
      source: 'cache',
      processingTime: 0.1
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Process with SNN at edge for ultra-fast anomaly detection
  const snnResult = await processSNNAtEdge(env.SNN_MODEL_CACHE, packetData);
  
  // If SNN detects anomaly, run ANN for classification
  let annResult = null;
  if (snnResult.anomalyScore > 0.7) {
    annResult = await processANNAtEdge(env.ANN_MODEL_CACHE, packetData, snnResult);
  }
  
  // Hybrid decision making
  const threatAnalysis = await hybridThreatAnalysis(snnResult, annResult);
  
  // Store in cache with adaptive TTL based on threat level
  const cacheTTL = threatAnalysis.threatLevel === 'critical' ? 300 : 3600;
  await env.KV_CACHE.put(cacheKey, JSON.stringify(threatAnalysis), {
    expirationTtl: cacheTTL,
  });
  
  // Store packet data in R2 if threat detected
  if (threatAnalysis.threatLevel !== 'safe') {
    const packetId = generateId();
    await env.R2_BUCKET.put(
      `threats/${deviceId}/${packetId}.bin`,
      new TextEncoder().encode(JSON.stringify(packetData)),
      {
        httpMetadata: { contentType: 'application/octet-stream' },
        customMetadata: { 
          deviceId, 
          threatLevel: threatAnalysis.threatLevel,
          timestamp: timestamp.toString()
        },
      }
    );
  }
  
  // Log to D1 database for analytics
  await env.D1_DATABASE.prepare(`
    INSERT INTO threat_detections (
      device_id, packet_hash, snn_score, ann_score, 
      threat_level, action_taken, processing_time_ms, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    deviceId, 
    cacheKey, 
    snnResult.anomalyScore, 
    annResult?.threatScore || 0,
    threatAnalysis.threatLevel,
    threatAnalysis.action,
    threatAnalysis.processingTime,
    Date.now()
  ).run();
  
  return new Response(JSON.stringify(threatAnalysis), {
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${cacheTTL}`,
      'X-Processing-Time': `${threatAnalysis.processingTime}ms`,
    },
  });
});

// Real-time system health endpoint
router.get('/api/system-health', async (request: Request, env: Env) => {
  const health = await getSystemHealth(env.D1_DATABASE, env.KV_CACHE);
  
  return new Response(JSON.stringify(health), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30', // Cache for 30 seconds
    },
  });
});

// Neural network model update endpoint
router.post('/api/update-models', async (request: Request, env: Env) => {
  const { snnModel, annModel, version } = await request.json();
  
  // Store updated models in KV cache
  await env.SNN_MODEL_CACHE.put(`model:snn:${version}`, snnModel);
  await env.ANN_MODEL_CACHE.put(`model:ann:${version}`, annModel);
  
  // Update model version in D1
  await env.D1_DATABASE.prepare(`
    INSERT INTO model_versions (snn_version, ann_version, deployed_at)
    VALUES (?, ?, ?)
  `).bind(version, version, Date.now()).run();
  
  return new Response(JSON.stringify({ 
    success: true, 
    version,
    message: 'Models updated successfully'
  }));
});

// SNN Processing at Edge
async function processSNNAtEdge(cache: KVNamespace, packetData: any): Promise<SNNResult> {
  const startTime = performance.now();
  
  // Get SNN model from cache
  const snnModel = await cache.get('model:snn:latest', 'json');
  
  // Convert packet to spike train
  const spikeTrain = encodePacketToSpikes(packetData);
  
  // Process through SNN layers
  const snnOutput = await runSNNInference(snnModel, spikeTrain);
  
  const processingTime = performance.now() - startTime;
  
  return {
    anomalyScore: snnOutput.anomalyScore,
    spikePattern: snnOutput.pattern,
    processingTime,
    confidence: snnOutput.confidence
  };
}

// ANN Processing at Edge
async function processANNAtEdge(
  cache: KVNamespace, 
  packetData: any, 
  snnResult: SNNResult
): Promise<ANNResult> {
  const startTime = performance.now();
  
  // Get ANN model from cache
  const annModel = await cache.get('model:ann:latest', 'json');
  
  // Feature extraction combining packet data and SNN output
  const features = extractFeatures(packetData, snnResult);
  
  // Run ANN inference
  const annOutput = await runANNInference(annModel, features);
  
  const processingTime = performance.now() - startTime;
  
  return {
    threatScore: annOutput.threatScore,
    threatType: annOutput.classification,
    processingTime,
    confidence: annOutput.confidence
  };
}

// Hybrid Decision Making
async function hybridThreatAnalysis(
  snnResult: SNNResult, 
  annResult: ANNResult | null
): Promise<ThreatAnalysis> {
  const startTime = performance.now();
  
  let threatLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
  let action: 'allow' | 'monitor' | 'block' | 'quarantine' = 'allow';
  let confidence = snnResult.confidence;
  
  // SNN-based decision
  if (snnResult.anomalyScore > 0.9) {
    threatLevel = 'critical';
    action = 'block';
  } else if (snnResult.anomalyScore > 0.7) {
    threatLevel = 'high';
    action = 'quarantine';
  } else if (snnResult.anomalyScore > 0.5) {
    threatLevel = 'medium';
    action = 'monitor';
  }
  
  // ANN refinement if available
  if (annResult) {
    confidence = (snnResult.confidence + annResult.confidence) / 2;
    
    if (annResult.threatScore > 0.8) {
      threatLevel = 'critical';
      action = 'block';
    } else if (annResult.threatScore > 0.6) {
      threatLevel = 'high';
      action = 'quarantine';
    }
  }
  
  const processingTime = performance.now() - startTime;
  
  return {
    threatLevel,
    action,
    confidence,
    snnScore: snnResult.anomalyScore,
    annScore: annResult?.threatScore || 0,
    threatType: annResult?.threatType || 'unknown',
    processingTime: snnResult.processingTime + (annResult?.processingTime || 0) + processingTime,
    timestamp: Date.now()
  };
}

// Durable Object for advanced rate limiting
export class ThreatDetectionRateLimiter {
  state: DurableObjectState;
  requests: Map<string, RequestHistory> = new Map();
  
  constructor(state: DurableObjectState) {
    this.state = state;
  }
  
  async fetch(request: Request): Promise<Response> {
    const deviceId = request.headers.get('device-id');
    const now = Date.now();
    
    // Get device's request history
    let history = this.requests.get(deviceId) || {
      requests: [],
      threatLevel: 'normal',
      lastThreat: 0
    };
    
    // Remove requests older than 1 minute
    history.requests = history.requests.filter(time => now - time < 60000);
    
    // Adaptive rate limiting based on threat history
    let limit = 1000; // Default: 1000 packets/minute
    
    if (history.threatLevel === 'high') {
      limit = 100; // Reduce limit for high-threat devices
    } else if (history.threatLevel === 'critical') {
      limit = 10; // Severely limit critical threat devices
    }
    
    if (history.requests.length >= limit) {
      return new Response('false');
    }
    
    history.requests.push(now);
    this.requests.set(deviceId, history);
    
    return new Response('true');
  }
  
  async updateThreatLevel(deviceId: string, level: string): Promise<void> {
    const history = this.requests.get(deviceId) || {
      requests: [],
      threatLevel: 'normal',
      lastThreat: 0
    };
    
    history.threatLevel = level;
    history.lastThreat = Date.now();
    this.requests.set(deviceId, history);
  }
}

// Utility functions
function hashPacket(packetData: any): string {
  // Create hash of packet for caching
  return btoa(JSON.stringify(packetData)).slice(0, 32);
}

function generateId(): string {
  return crypto.randomUUID();
}

function encodePacketToSpikes(packetData: any): number[] {
  // Convert packet data to spike train for SNN processing
  const bytes = new TextEncoder().encode(JSON.stringify(packetData));
  const spikes = [];
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Convert each byte to spike timing
    for (let bit = 0; bit < 8; bit++) {
      if ((byte >> bit) & 1) {
        spikes.push(i * 8 + bit);
      }
    }
  }
  
  return spikes;
}

async function runSNNInference(model: any, spikeTrain: number[]): Promise<any> {
  // Simplified SNN inference simulation
  // In production, this would use WebAssembly or optimized JS
  const anomalyScore = Math.random() * (spikeTrain.length > 100 ? 1 : 0.3);
  
  return {
    anomalyScore,
    pattern: spikeTrain.slice(0, 10),
    confidence: 0.85 + Math.random() * 0.15
  };
}

async function runANNInference(model: any, features: number[]): Promise<any> {
  // Simplified ANN inference simulation
  const threatScore = Math.random() * 0.9;
  const classifications = ['malware', 'ddos', 'intrusion', 'phishing', 'botnet'];
  
  return {
    threatScore,
    classification: classifications[Math.floor(Math.random() * classifications.length)],
    confidence: 0.80 + Math.random() * 0.20
  };
}

function extractFeatures(packetData: any, snnResult: SNNResult): number[] {
  // Extract features for ANN processing
  const features = [
    snnResult.anomalyScore,
    snnResult.confidence,
    JSON.stringify(packetData).length,
    snnResult.spikePattern.length,
    ...snnResult.spikePattern.slice(0, 10).map(x => x / 1000)
  ];
  
  return features;
}

async function getSystemHealth(db: D1Database, cache: KVNamespace): Promise<any> {
  // Get recent detection stats
  const stats = await db.prepare(`
    SELECT 
      COUNT(*) as total_detections,
      AVG(processing_time_ms) as avg_processing_time,
      COUNT(CASE WHEN threat_level != 'safe' THEN 1 END) as threats_detected,
      COUNT(CASE WHEN action_taken = 'blocked' THEN 1 END) as threats_blocked
    FROM threat_detections 
    WHERE timestamp > ? 
  `).bind(Date.now() - 300000).first(); // Last 5 minutes
  
  return {
    status: 'healthy',
    totalDetections: stats.total_detections,
    avgProcessingTime: stats.avg_processing_time,
    threatsDetected: stats.threats_detected,
    threatsBlocked: stats.threats_blocked,
    cacheHitRate: 0.85, // Would calculate from actual cache metrics
    timestamp: Date.now()
  };
}

async function trackDetection(
  db: D1Database, 
  deviceId: string, 
  type: string, 
  result: any
): Promise<void> {
  await db.prepare(`
    INSERT INTO detection_events (device_id, event_type, result, timestamp)
    VALUES (?, ?, ?, ?)
  `).bind(deviceId, type, JSON.stringify(result), Date.now()).run();
}

// Type definitions
interface SNNResult {
  anomalyScore: number;
  spikePattern: number[];
  processingTime: number;
  confidence: number;
}

interface ANNResult {
  threatScore: number;
  threatType: string;
  processingTime: number;
  confidence: number;
}

interface ThreatAnalysis {
  threatLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'monitor' | 'block' | 'quarantine';
  confidence: number;
  snnScore: number;
  annScore: number;
  threatType: string;
  processingTime: number;
  timestamp: number;
}

interface RequestHistory {
  requests: number[];
  threatLevel: string;
  lastThreat: number;
}

export default {
  fetch: router.handle,
};

export { ThreatDetectionRateLimiter };
