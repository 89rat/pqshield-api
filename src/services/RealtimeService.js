/**
 * Real-time WebSocket Service for PQ359 API
 * Live threat monitoring, scan updates, and data processing
 */

import { db, functions } from '../infrastructure/firebase/firebase-config.js';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

class RealtimeService {
  constructor() {
    this.connections = new Map();
    this.subscriptions = new Map();
    this.threatListeners = new Map();
    this.scanListeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // WebSocket connection for real-time updates
    this.ws = null;
    this.wsUrl = this.getWebSocketUrl();
    
    // Event handlers
    this.eventHandlers = {
      'scan_update': [],
      'threat_detected': [],
      'compliance_change': [],
      'neural_analysis': [],
      'quantum_threat': [],
      'system_alert': [],
      'connection_status': []
    };

    this.initializeConnection();
  }

  getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? 'wss://pq359api.com/ws' 
      : 'ws://localhost:8080/ws';
    return host;
  }

  // Initialize WebSocket connection
  initializeConnection() {
    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = (event) => {
        console.log('WebSocket connected:', event);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connection_status', { status: 'connected', timestamp: new Date() });
        
        // Send authentication if available
        const authToken = localStorage.getItem('pq359_auth_token');
        if (authToken) {
          this.send('auth', { token: authToken });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
        this.isConnected = false;
        this.emit('connection_status', { status: 'disconnected', timestamp: new Date() });
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
            this.initializeConnection();
          }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('connection_status', { status: 'error', error, timestamp: new Date() });
      };

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      // Fallback to Firebase real-time listeners
      this.initializeFirebaseListeners();
    }
  }

  // Handle incoming WebSocket messages
  handleMessage(data) {
    const { type, payload, timestamp } = data;
    
    switch (type) {
      case 'scan_update':
        this.emit('scan_update', payload);
        break;
      case 'threat_detected':
        this.emit('threat_detected', payload);
        this.updateThreatCache(payload);
        break;
      case 'neural_analysis':
        this.emit('neural_analysis', payload);
        break;
      case 'quantum_threat':
        this.emit('quantum_threat', payload);
        break;
      case 'compliance_change':
        this.emit('compliance_change', payload);
        break;
      case 'system_alert':
        this.emit('system_alert', payload);
        break;
      case 'heartbeat':
        this.send('heartbeat_ack', { timestamp: new Date().toISOString() });
        break;
      default:
        console.log('Unknown message type:', type, payload);
    }
  }

  // Send message via WebSocket
  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Event system
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
    
    return () => {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    };
  }

  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Real-time scan monitoring
  subscribeScanUpdates(scanId, callback) {
    if (this.scanListeners.has(scanId)) {
      return this.scanListeners.get(scanId);
    }

    // WebSocket subscription
    this.send('subscribe_scan', { scanId });

    // Firebase fallback
    const scanRef = doc(db, 'scans', scanId);
    const unsubscribe = onSnapshot(scanRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() };
        callback(data);
        this.emit('scan_update', data);
      }
    }, (error) => {
      console.error('Scan subscription error:', error);
    });

    this.scanListeners.set(scanId, unsubscribe);
    return unsubscribe;
  }

  // Real-time threat monitoring
  subscribeThreatUpdates(userId, callback) {
    const listenerId = `threats_${userId}`;
    
    if (this.threatListeners.has(listenerId)) {
      return this.threatListeners.get(listenerId);
    }

    // WebSocket subscription
    this.send('subscribe_threats', { userId });

    // Firebase fallback
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
      callback(threats);
      this.emit('threat_detected', { userId, threats });
    }, (error) => {
      console.error('Threat subscription error:', error);
    });

    this.threatListeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Global threat monitoring (for dashboard)
  subscribeGlobalThreats(callback) {
    const listenerId = 'global_threats';
    
    if (this.threatListeners.has(listenerId)) {
      return this.threatListeners.get(listenerId);
    }

    // WebSocket subscription
    this.send('subscribe_global_threats', {});

    // Firebase fallback
    const globalThreatsQuery = query(
      collection(db, 'threats'),
      where('severity', 'in', ['critical', 'high']),
      orderBy('detectedAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(globalThreatsQuery, (snapshot) => {
      const threats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(threats);
      this.emit('threat_detected', { global: true, threats });
    }, (error) => {
      console.error('Global threat subscription error:', error);
    });

    this.threatListeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Real-time neural analysis updates
  subscribeNeuralAnalysis(callback) {
    return this.on('neural_analysis', callback);
  }

  // Real-time quantum threat updates
  subscribeQuantumThreats(callback) {
    return this.on('quantum_threat', callback);
  }

  // System alerts and notifications
  subscribeSystemAlerts(callback) {
    return this.on('system_alert', callback);
  }

  // Live scan processing
  async startLiveScan(code, options = {}) {
    const scanId = this.generateScanId();
    
    try {
      // Send scan request via WebSocket for real-time processing
      const success = this.send('start_scan', {
        scanId,
        code,
        options: {
          ...options,
          realtime: true,
          enableNeuralAnalysis: true,
          enableQuantumAssessment: true
        }
      });

      if (!success) {
        // Fallback to Firebase Cloud Function
        const processScan = httpsCallable(functions, 'processScan');
        const result = await processScan({ code, options });
        return result.data;
      }

      return { scanId, status: 'processing' };
    } catch (error) {
      console.error('Failed to start live scan:', error);
      throw error;
    }
  }

  // Batch processing with real-time updates
  async startBatchScan(files, options = {}) {
    const batchId = this.generateBatchId();
    
    try {
      const success = this.send('start_batch_scan', {
        batchId,
        files,
        options: {
          ...options,
          realtime: true
        }
      });

      if (!success) {
        // Process files sequentially with real-time updates
        const results = [];
        for (const file of files) {
          const scanResult = await this.startLiveScan(file.content, {
            ...options,
            filePath: file.path
          });
          results.push(scanResult);
        }
        return { batchId, results };
      }

      return { batchId, status: 'processing' };
    } catch (error) {
      console.error('Failed to start batch scan:', error);
      throw error;
    }
  }

  // Real-time threat intelligence updates
  subscribeThreatIntelligence(callback) {
    const threatIntelQuery = query(
      collection(db, 'threatIntelligence'),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );

    return onSnapshot(threatIntelQuery, (snapshot) => {
      const intelligence = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(intelligence);
    });
  }

  // Performance metrics monitoring
  subscribePerformanceMetrics(callback) {
    const metricsQuery = query(
      collection(db, 'performanceMetrics'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(metricsQuery, (snapshot) => {
      const metrics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(metrics);
    });
  }

  // User activity tracking
  async trackUserActivity(activity) {
    try {
      await addDoc(collection(db, 'userActivity'), {
        ...activity,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to track user activity:', error);
    }
  }

  // Real-time notifications
  async sendNotification(userId, notification) {
    try {
      const success = this.send('notification', {
        userId,
        notification: {
          ...notification,
          timestamp: new Date().toISOString()
        }
      });

      if (!success) {
        // Store notification in Firebase
        await addDoc(collection(db, 'notifications'), {
          userId,
          ...notification,
          timestamp: serverTimestamp(),
          read: false
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Cache management
  updateThreatCache(threat) {
    const cacheKey = `threat_${threat.id}`;
    const cached = {
      ...threat,
      cachedAt: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cached));
    } catch (error) {
      console.error('Failed to cache threat:', error);
    }
  }

  getCachedThreat(threatId) {
    try {
      const cached = localStorage.getItem(`threat_${threatId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached threat:', error);
      return null;
    }
  }

  // Utility functions
  generateScanId() {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize Firebase listeners as fallback
  initializeFirebaseListeners() {
    console.log('Initializing Firebase real-time listeners as fallback');
    
    // Global threat statistics
    const statsRef = doc(db, 'threatStats', 'daily');
    onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        this.emit('system_alert', {
          type: 'stats_update',
          data: doc.data()
        });
      }
    });
  }

  // Cleanup
  disconnect() {
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Unsubscribe from all Firebase listeners
    this.scanListeners.forEach(unsubscribe => unsubscribe());
    this.threatListeners.forEach(unsubscribe => unsubscribe());
    
    this.scanListeners.clear();
    this.threatListeners.clear();
    this.connections.clear();
    this.subscriptions.clear();
    
    this.isConnected = false;
  }

  // Connection status
  getConnectionStatus() {
    return {
      websocket: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;

// React hook for easy integration
export const useRealtimeService = () => {
  return realtimeService;
};

// Specific hooks for different data types
export const useScanUpdates = (scanId, callback) => {
  React.useEffect(() => {
    if (!scanId) return;
    
    const unsubscribe = realtimeService.subscribeScanUpdates(scanId, callback);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [scanId, callback]);
};

export const useThreatUpdates = (userId, callback) => {
  React.useEffect(() => {
    if (!userId) return;
    
    const unsubscribe = realtimeService.subscribeThreatUpdates(userId, callback);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, callback]);
};

export const useGlobalThreats = (callback) => {
  React.useEffect(() => {
    const unsubscribe = realtimeService.subscribeGlobalThreats(callback);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [callback]);
};

export const useNeuralAnalysis = (callback) => {
  React.useEffect(() => {
    const unsubscribe = realtimeService.subscribeNeuralAnalysis(callback);
    return unsubscribe;
  }, [callback]);
};

export const useQuantumThreats = (callback) => {
  React.useEffect(() => {
    const unsubscribe = realtimeService.subscribeQuantumThreats(callback);
    return unsubscribe;
  }, [callback]);
};

export const useSystemAlerts = (callback) => {
  React.useEffect(() => {
    const unsubscribe = realtimeService.subscribeSystemAlerts(callback);
    return unsubscribe;
  }, [callback]);
};
