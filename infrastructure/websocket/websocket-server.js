/**
 * WebSocket Server for PQ359 API
 * Real-time threat monitoring and live data processing
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

// Import Firebase Admin for server-side operations
const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'pq359-api'
  });
}

const db = admin.firestore();

class WebSocketServer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.port = options.port || process.env.WS_PORT || 8080;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws',
      perMessageDeflate: false
    });
    
    // Connection management
    this.connections = new Map();
    this.subscriptions = new Map();
    this.rooms = new Map();
    
    // Processing queues
    this.scanQueue = [];
    this.processingScans = new Set();
    this.maxConcurrentScans = 10;
    
    // Metrics
    this.metrics = {
      connectionsTotal: 0,
      messagesReceived: 0,
      messagesSent: 0,
      scansProcessed: 0,
      threatsDetected: 0,
      errors: 0
    };
    
    this.setupExpress();
    this.setupWebSocket();
    this.startHeartbeat();
    this.startScanProcessor();
  }

  setupExpress() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://pq359api.com'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP'
    });
    this.app.use('/api', limiter);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        connections: this.connections.size,
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json({
        ...this.metrics,
        connections: this.connections.size,
        subscriptions: this.subscriptions.size,
        rooms: this.rooms.size,
        queueSize: this.scanQueue.length,
        processingScans: this.processingScans.size
      });
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, request) => {
      const connectionId = uuidv4();
      const clientIP = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
      
      console.log(`New WebSocket connection: ${connectionId} from ${clientIP}`);
      
      // Initialize connection
      const connection = {
        id: connectionId,
        ws,
        ip: clientIP,
        authenticated: false,
        userId: null,
        subscriptions: new Set(),
        lastActivity: Date.now(),
        connectedAt: Date.now()
      };
      
      this.connections.set(connectionId, connection);
      this.metrics.connectionsTotal++;
      
      // Set up message handler
      ws.on('message', (data) => {
        this.handleMessage(connectionId, data);
      });
      
      // Handle connection close
      ws.on('close', (code, reason) => {
        console.log(`Connection closed: ${connectionId}, code: ${code}, reason: ${reason}`);
        this.handleDisconnection(connectionId);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${connectionId}:`, error);
        this.metrics.errors++;
        this.handleDisconnection(connectionId);
      });
      
      // Send welcome message
      this.sendToConnection(connectionId, 'welcome', {
        connectionId,
        serverTime: new Date().toISOString(),
        features: ['real-time-scanning', 'threat-monitoring', 'neural-analysis', 'quantum-assessment']
      });
    });
  }

  handleMessage(connectionId, data) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) return;
      
      connection.lastActivity = Date.now();
      this.metrics.messagesReceived++;
      
      const message = JSON.parse(data.toString());
      const { type, payload } = message;
      
      console.log(`Message from ${connectionId}: ${type}`);
      
      switch (type) {
        case 'auth':
          this.handleAuthentication(connectionId, payload);
          break;
        case 'subscribe_scan':
          this.handleScanSubscription(connectionId, payload);
          break;
        case 'subscribe_threats':
          this.handleThreatSubscription(connectionId, payload);
          break;
        case 'subscribe_global_threats':
          this.handleGlobalThreatSubscription(connectionId);
          break;
        case 'start_scan':
          this.handleStartScan(connectionId, payload);
          break;
        case 'start_batch_scan':
          this.handleStartBatchScan(connectionId, payload);
          break;
        case 'heartbeat_ack':
          // Client acknowledged heartbeat
          break;
        case 'notification':
          this.handleNotification(connectionId, payload);
          break;
        default:
          console.log(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error(`Error handling message from ${connectionId}:`, error);
      this.metrics.errors++;
      this.sendToConnection(connectionId, 'error', {
        message: 'Invalid message format'
      });
    }
  }

  async handleAuthentication(connectionId, payload) {
    try {
      const { token } = payload;
      const connection = this.connections.get(connectionId);
      
      if (!connection) return;
      
      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      connection.authenticated = true;
      connection.userId = decodedToken.uid;
      
      this.sendToConnection(connectionId, 'auth_success', {
        userId: decodedToken.uid,
        email: decodedToken.email
      });
      
      console.log(`User authenticated: ${decodedToken.uid} on connection ${connectionId}`);
    } catch (error) {
      console.error(`Authentication failed for ${connectionId}:`, error);
      this.sendToConnection(connectionId, 'auth_error', {
        message: 'Authentication failed'
      });
    }
  }

  handleScanSubscription(connectionId, payload) {
    const { scanId } = payload;
    const connection = this.connections.get(connectionId);
    
    if (!connection) return;
    
    const subscriptionKey = `scan:${scanId}`;
    connection.subscriptions.add(subscriptionKey);
    
    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }
    this.subscriptions.get(subscriptionKey).add(connectionId);
    
    // Set up Firebase listener for this scan
    this.setupScanListener(scanId);
    
    console.log(`Connection ${connectionId} subscribed to scan ${scanId}`);
  }

  handleThreatSubscription(connectionId, payload) {
    const { userId } = payload;
    const connection = this.connections.get(connectionId);
    
    if (!connection || !connection.authenticated || connection.userId !== userId) {
      this.sendToConnection(connectionId, 'error', {
        message: 'Unauthorized threat subscription'
      });
      return;
    }
    
    const subscriptionKey = `threats:${userId}`;
    connection.subscriptions.add(subscriptionKey);
    
    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }
    this.subscriptions.get(subscriptionKey).add(connectionId);
    
    // Set up Firebase listener for user threats
    this.setupThreatListener(userId);
    
    console.log(`Connection ${connectionId} subscribed to threats for user ${userId}`);
  }

  handleGlobalThreatSubscription(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (!connection) return;
    
    const subscriptionKey = 'threats:global';
    connection.subscriptions.add(subscriptionKey);
    
    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }
    this.subscriptions.get(subscriptionKey).add(connectionId);
    
    // Set up Firebase listener for global threats
    this.setupGlobalThreatListener();
    
    console.log(`Connection ${connectionId} subscribed to global threats`);
  }

  handleStartScan(connectionId, payload) {
    const { scanId, code, options } = payload;
    const connection = this.connections.get(connectionId);
    
    if (!connection) return;
    
    // Add to scan queue
    const scanJob = {
      scanId,
      code,
      options,
      connectionId,
      userId: connection.userId,
      createdAt: Date.now()
    };
    
    this.scanQueue.push(scanJob);
    
    this.sendToConnection(connectionId, 'scan_queued', {
      scanId,
      position: this.scanQueue.length,
      estimatedWait: this.scanQueue.length * 2 // seconds
    });
    
    console.log(`Scan ${scanId} queued for connection ${connectionId}`);
  }

  handleStartBatchScan(connectionId, payload) {
    const { batchId, files, options } = payload;
    const connection = this.connections.get(connectionId);
    
    if (!connection) return;
    
    // Create individual scan jobs for each file
    files.forEach((file, index) => {
      const scanId = `${batchId}_${index}`;
      const scanJob = {
        scanId,
        code: file.content,
        options: { ...options, filePath: file.path, batchId },
        connectionId,
        userId: connection.userId,
        createdAt: Date.now()
      };
      
      this.scanQueue.push(scanJob);
    });
    
    this.sendToConnection(connectionId, 'batch_queued', {
      batchId,
      fileCount: files.length,
      estimatedWait: this.scanQueue.length * 2
    });
    
    console.log(`Batch ${batchId} with ${files.length} files queued for connection ${connectionId}`);
  }

  handleNotification(connectionId, payload) {
    const { userId, notification } = payload;
    
    // Send notification to all connections for this user
    this.connections.forEach((connection, id) => {
      if (connection.userId === userId) {
        this.sendToConnection(id, 'notification', notification);
      }
    });
  }

  async startScanProcessor() {
    setInterval(async () => {
      if (this.scanQueue.length === 0 || this.processingScans.size >= this.maxConcurrentScans) {
        return;
      }
      
      const scanJob = this.scanQueue.shift();
      if (!scanJob) return;
      
      this.processingScans.add(scanJob.scanId);
      
      try {
        await this.processScan(scanJob);
      } catch (error) {
        console.error(`Error processing scan ${scanJob.scanId}:`, error);
        this.sendToConnection(scanJob.connectionId, 'scan_error', {
          scanId: scanJob.scanId,
          error: error.message
        });
      } finally {
        this.processingScans.delete(scanJob.scanId);
      }
    }, 1000); // Check every second
  }

  async processScan(scanJob) {
    const { scanId, code, options, connectionId, userId } = scanJob;
    
    console.log(`Processing scan ${scanId}`);
    
    // Send processing started notification
    this.sendToConnection(connectionId, 'scan_started', {
      scanId,
      timestamp: new Date().toISOString()
    });
    
    // Simulate advanced scanning (replace with actual implementation)
    const startTime = Date.now();
    
    // Vulnerability scanning
    const vulnerabilities = await this.scanForVulnerabilities(code);
    
    // Neural network analysis
    const neuralAnalysis = await this.performNeuralAnalysis(code);
    
    // Quantum threat assessment
    const quantumThreats = await this.assessQuantumThreats(code);
    
    // Calculate security score
    const securityScore = this.calculateSecurityScore(vulnerabilities, neuralAnalysis);
    
    const processingTime = Date.now() - startTime;
    
    const results = {
      scanId,
      filePath: options.filePath || 'unknown',
      securityScore,
      vulnerabilities,
      neuralAnalysis,
      quantumThreats,
      processingTime,
      timestamp: new Date().toISOString()
    };
    
    // Store results in Firebase
    await this.storeScanResults(results, userId);
    
    // Send results to client
    this.sendToConnection(connectionId, 'scan_complete', results);
    
    // Broadcast to subscribers
    this.broadcastToSubscribers(`scan:${scanId}`, 'scan_update', results);
    
    this.metrics.scansProcessed++;
    
    console.log(`Scan ${scanId} completed in ${processingTime}ms`);
  }

  async scanForVulnerabilities(code) {
    // Simulate vulnerability scanning
    const patterns = [
      { name: 'SQL_INJECTION', pattern: /(\$\{[^}]*\}.*SELECT|query.*=.*\$\{)/gi, severity: 'critical' },
      { name: 'XSS_VULNERABILITY', pattern: /(innerHTML.*=.*\$\{|\.html\(.*\$\{)/gi, severity: 'high' },
      { name: 'COMMAND_INJECTION', pattern: /(exec\(.*\$\{|system\(.*\$\{)/gi, severity: 'critical' },
      { name: 'WEAK_CRYPTO', pattern: /(md5|sha1|des)/gi, severity: 'medium' }
    ];
    
    const vulnerabilities = [];
    
    patterns.forEach(pattern => {
      const matches = [...code.matchAll(pattern.pattern)];
      matches.forEach(match => {
        vulnerabilities.push({
          type: pattern.name,
          severity: pattern.severity,
          line: this.getLineNumber(code, match.index),
          evidence: match[0].substring(0, 100)
        });
      });
    });
    
    return vulnerabilities;
  }

  async performNeuralAnalysis(code) {
    // Simulate neural network analysis
    const features = this.extractCodeFeatures(code);
    
    return {
      anomalyScore: Math.random() * (features.complexity > 0.7 ? 1 : 0.3),
      threatClassification: ['injection', 'xss', 'crypto_weak', 'safe'][Math.floor(Math.random() * 4)],
      confidence: 0.85 + Math.random() * 0.15
    };
  }

  async assessQuantumThreats(code) {
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
          occurrences: matches.length
        });
      }
    });
    
    return threats;
  }

  calculateSecurityScore(vulnerabilities, neuralAnalysis) {
    let score = 100;
    
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 8; break;
        default: score -= 3;
      }
    });
    
    if (neuralAnalysis) {
      score -= neuralAnalysis.anomalyScore * 20;
    }
    
    return Math.max(0, Math.round(score));
  }

  extractCodeFeatures(code) {
    return {
      length: code.length,
      complexity: (code.match(/function|if|for|while/g) || []).length / 100,
      imports: (code.match(/require|import/g) || []).length
    };
  }

  getLineNumber(code, index) {
    return code.substring(0, index).split('\n').length;
  }

  async storeScanResults(results, userId) {
    try {
      await db.collection('scans').doc(results.scanId).set({
        ...results,
        userId: userId || 'anonymous',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to store scan results:', error);
    }
  }

  setupScanListener(scanId) {
    const listenerKey = `scan_listener:${scanId}`;
    
    if (this.rooms.has(listenerKey)) return;
    
    const unsubscribe = db.collection('scans').doc(scanId).onSnapshot((doc) => {
      if (doc.exists) {
        const data = { id: doc.id, ...doc.data() };
        this.broadcastToSubscribers(`scan:${scanId}`, 'scan_update', data);
      }
    });
    
    this.rooms.set(listenerKey, unsubscribe);
  }

  setupThreatListener(userId) {
    const listenerKey = `threat_listener:${userId}`;
    
    if (this.rooms.has(listenerKey)) return;
    
    const unsubscribe = db.collection('threats')
      .where('userId', '==', userId)
      .orderBy('detectedAt', 'desc')
      .limit(50)
      .onSnapshot((snapshot) => {
        const threats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.broadcastToSubscribers(`threats:${userId}`, 'threat_detected', { threats });
      });
    
    this.rooms.set(listenerKey, unsubscribe);
  }

  setupGlobalThreatListener() {
    const listenerKey = 'global_threat_listener';
    
    if (this.rooms.has(listenerKey)) return;
    
    const unsubscribe = db.collection('threats')
      .where('severity', 'in', ['critical', 'high'])
      .orderBy('detectedAt', 'desc')
      .limit(100)
      .onSnapshot((snapshot) => {
        const threats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.broadcastToSubscribers('threats:global', 'threat_detected', { threats });
        this.metrics.threatsDetected = threats.length;
      });
    
    this.rooms.set(listenerKey, unsubscribe);
  }

  broadcastToSubscribers(subscriptionKey, type, payload) {
    const subscribers = this.subscriptions.get(subscriptionKey);
    if (!subscribers) return;
    
    subscribers.forEach(connectionId => {
      this.sendToConnection(connectionId, type, payload);
    });
  }

  sendToConnection(connectionId, type, payload) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    const message = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    
    try {
      connection.ws.send(JSON.stringify(message));
      this.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(`Failed to send message to ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
      return false;
    }
  }

  handleDisconnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    // Remove from all subscriptions
    connection.subscriptions.forEach(subscriptionKey => {
      const subscribers = this.subscriptions.get(subscriptionKey);
      if (subscribers) {
        subscribers.delete(connectionId);
        if (subscribers.size === 0) {
          this.subscriptions.delete(subscriptionKey);
        }
      }
    });
    
    this.connections.delete(connectionId);
    console.log(`Connection ${connectionId} cleaned up`);
  }

  startHeartbeat() {
    setInterval(() => {
      this.connections.forEach((connection, connectionId) => {
        if (connection.ws.readyState === WebSocket.OPEN) {
          this.sendToConnection(connectionId, 'heartbeat', {
            timestamp: new Date().toISOString()
          });
        } else {
          this.handleDisconnection(connectionId);
        }
      });
    }, 30000); // Every 30 seconds
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`PQ359 WebSocket Server running on port ${this.port}`);
      console.log(`WebSocket endpoint: ws://localhost:${this.port}/ws`);
      console.log(`Health check: http://localhost:${this.port}/health`);
    });
  }

  stop() {
    // Clean up all listeners
    this.rooms.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    // Close all connections
    this.connections.forEach((connection) => {
      connection.ws.close();
    });
    
    // Close server
    this.wss.close();
    this.server.close();
    
    console.log('WebSocket server stopped');
  }
}

module.exports = WebSocketServer;

// Start server if run directly
if (require.main === module) {
  const server = new WebSocketServer({
    port: process.env.WS_PORT || 8080
  });
  
  server.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down WebSocket server...');
    server.stop();
    process.exit(0);
  });
}
