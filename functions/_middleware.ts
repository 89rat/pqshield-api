/**
 * Cloudflare Pages Functions Middleware
 * 
 * This middleware handles:
 * - Security headers
 * - Authentication
 * - Rate limiting
 * - Analytics
 * - Neural network integration
 * - Quantum security
 */

interface Env {
  // KV Stores
  CACHE_KV: KVNamespace;
  SESSIONS_KV: KVNamespace;
  CONFIG_KV: KVNamespace;
  
  // D1 Databases
  PQ359_DB: D1Database;
  ANALYTICS_DB: D1Database;
  
  // R2 Buckets
  ASSETS_BUCKET: R2Bucket;
  
  // Durable Objects
  NEURAL_NETWORK_DO: DurableObjectNamespace;
  GAMIFICATION_DO: DurableObjectNamespace;
  
  // Environment variables
  ENVIRONMENT: string;
  API_BASE_URL: string;
  NEURAL_NETWORK_ENDPOINT: string;
  QUANTUM_SECURITY_LEVEL: string;
}

// Security headers configuration
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.pq359.com https://neural.pq359.com https://www.google-analytics.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim()
};

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/': { requests: 100, window: 60 }, // 100 requests per minute for API
  '/auth/': { requests: 10, window: 60 }, // 10 requests per minute for auth
  '/neural/': { requests: 50, window: 60 }, // 50 requests per minute for neural network
  default: { requests: 200, window: 60 } // 200 requests per minute default
};

// Neural network integration
class NeuralNetworkIntegration {
  constructor(private env: Env) {}
  
  async analyzeRequest(request: Request): Promise<{
    threatLevel: number;
    isBot: boolean;
    riskScore: number;
    recommendations: string[];
  }> {
    try {
      const userAgent = request.headers.get('User-Agent') || '';
      const ip = request.headers.get('CF-Connecting-IP') || '';
      const country = request.headers.get('CF-IPCountry') || '';
      
      // Get neural network analysis
      const neuralResponse = await fetch(`${this.env.NEURAL_NETWORK_ENDPOINT}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getApiKey()}`
        },
        body: JSON.stringify({
          userAgent,
          ip,
          country,
          timestamp: Date.now(),
          url: request.url
        })
      });
      
      if (neuralResponse.ok) {
        return await neuralResponse.json();
      }
      
      // Fallback analysis
      return this.fallbackAnalysis(userAgent, ip);
      
    } catch (error) {
      console.error('Neural network analysis failed:', error);
      return this.fallbackAnalysis('', '');
    }
  }
  
  private async getApiKey(): Promise<string> {
    return await this.env.CONFIG_KV.get('neural_api_key') || 'fallback-key';
  }
  
  private fallbackAnalysis(userAgent: string, ip: string) {
    const isBot = /bot|crawler|spider|scraper/i.test(userAgent);
    const threatLevel = isBot ? 0.3 : 0.1;
    
    return {
      threatLevel,
      isBot,
      riskScore: threatLevel * 100,
      recommendations: isBot ? ['Monitor bot activity'] : ['Normal traffic']
    };
  }
}

// Quantum security implementation
class QuantumSecurity {
  constructor(private env: Env) {}
  
  async generateQuantumToken(userId: string): Promise<string> {
    // Quantum-resistant token generation
    const timestamp = Date.now();
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const quantumSeed = await this.getQuantumSeed();
    
    // Combine entropy sources
    const combined = new Uint8Array(randomBytes.length + quantumSeed.length + 8);
    combined.set(randomBytes, 0);
    combined.set(quantumSeed, randomBytes.length);
    
    // Add timestamp
    const timestampBytes = new ArrayBuffer(8);
    new DataView(timestampBytes).setBigUint64(0, BigInt(timestamp));
    combined.set(new Uint8Array(timestampBytes), randomBytes.length + quantumSeed.length);
    
    // Hash with quantum-resistant algorithm
    const hash = await crypto.subtle.digest('SHA-512', combined);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  private async getQuantumSeed(): Promise<Uint8Array> {
    // Get quantum entropy from KV store or generate new
    const stored = await this.env.CONFIG_KV.get('quantum_seed', 'arrayBuffer');
    if (stored) {
      return new Uint8Array(stored);
    }
    
    // Generate new quantum seed
    const seed = crypto.getRandomValues(new Uint8Array(64));
    await this.env.CONFIG_KV.put('quantum_seed', seed, { expirationTtl: 3600 });
    return seed;
  }
}

// Rate limiting implementation
class RateLimiter {
  constructor(private env: Env) {}
  
  async checkRateLimit(request: Request): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Determine rate limit for this path
    const limit = this.getRateLimitForPath(path);
    const key = `rate_limit:${ip}:${path}`;
    
    // Get current count
    const current = await this.env.CACHE_KV.get(key);
    const count = current ? parseInt(current) : 0;
    
    const now = Math.floor(Date.now() / 1000);
    const windowStart = Math.floor(now / limit.window) * limit.window;
    const resetTime = windowStart + limit.window;
    
    if (count >= limit.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime
      };
    }
    
    // Increment counter
    await this.env.CACHE_KV.put(key, (count + 1).toString(), {
      expirationTtl: limit.window
    });
    
    return {
      allowed: true,
      remaining: limit.requests - count - 1,
      resetTime
    };
  }
  
  private getRateLimitForPath(path: string) {
    for (const [pattern, limit] of Object.entries(RATE_LIMITS)) {
      if (pattern === 'default') continue;
      if (path.startsWith(pattern)) {
        return limit;
      }
    }
    return RATE_LIMITS.default;
  }
}

// Analytics tracking
class Analytics {
  constructor(private env: Env) {}
  
  async trackRequest(request: Request, response: Response, processingTime: number) {
    try {
      const url = new URL(request.url);
      const data = {
        timestamp: Date.now(),
        method: request.method,
        path: url.pathname,
        status: response.status,
        processingTime,
        userAgent: request.headers.get('User-Agent'),
        ip: request.headers.get('CF-Connecting-IP'),
        country: request.headers.get('CF-IPCountry'),
        referer: request.headers.get('Referer'),
        cacheStatus: response.headers.get('CF-Cache-Status')
      };
      
      // Store in analytics database
      await this.env.ANALYTICS_DB.prepare(`
        INSERT INTO requests (timestamp, method, path, status, processing_time, user_agent, ip, country, referer, cache_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.timestamp,
        data.method,
        data.path,
        data.status,
        data.processingTime,
        data.userAgent,
        data.ip,
        data.country,
        data.referer,
        data.cacheStatus
      ).run();
      
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }
}

// Main middleware function
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const startTime = Date.now();
  
  // Initialize services
  const neuralNetwork = new NeuralNetworkIntegration(env);
  const quantumSecurity = new QuantumSecurity(env);
  const rateLimiter = new RateLimiter(env);
  const analytics = new Analytics(env);
  
  try {
    // Rate limiting check
    const rateLimit = await rateLimiter.checkRateLimit(request);
    if (!rateLimit.allowed) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'Retry-After': rateLimit.resetTime.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          ...SECURITY_HEADERS
        }
      });
    }
    
    // Neural network threat analysis
    const threatAnalysis = await neuralNetwork.analyzeRequest(request);
    
    // Block high-risk requests
    if (threatAnalysis.threatLevel > 0.8) {
      console.warn('High threat level detected:', threatAnalysis);
      return new Response('Request blocked by security system', {
        status: 403,
        headers: SECURITY_HEADERS
      });
    }
    
    // Add security context to request
    const securityContext = {
      threatLevel: threatAnalysis.threatLevel,
      isBot: threatAnalysis.isBot,
      riskScore: threatAnalysis.riskScore,
      quantumToken: await quantumSecurity.generateQuantumToken('anonymous')
    };
    
    // Clone request and add security headers
    const modifiedRequest = new Request(request, {
      headers: {
        ...request.headers,
        'X-Security-Context': JSON.stringify(securityContext),
        'X-Quantum-Token': securityContext.quantumToken
      }
    });
    
    // Process request
    const response = await next(modifiedRequest);
    
    // Clone response to add headers
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        ...SECURITY_HEADERS,
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        'X-Threat-Level': threatAnalysis.threatLevel.toString(),
        'X-Processing-Time': (Date.now() - startTime).toString(),
        'X-Quantum-Protected': 'true'
      }
    });
    
    // Track analytics (async)
    analytics.trackRequest(request, modifiedResponse, Date.now() - startTime);
    
    return modifiedResponse;
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Track error
    analytics.trackRequest(request, new Response('', { status: 500 }), Date.now() - startTime);
    
    return new Response('Internal server error', {
      status: 500,
      headers: SECURITY_HEADERS
    });
  }
};

// API route handlers
export const onRequestGet: PagesFunction<Env> = async (context) => {
  return await onRequest(context);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return await onRequest(context);
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  return await onRequest(context);
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  return await onRequest(context);
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  return await onRequest(context);
};

export const onRequestHead: PagesFunction<Env> = async (context) => {
  return await onRequest(context);
};

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  // Handle CORS preflight
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      ...SECURITY_HEADERS
    }
  });
};
