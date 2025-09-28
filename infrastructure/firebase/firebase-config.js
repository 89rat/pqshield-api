/**
 * Firebase Configuration for PQShield API
 * Real-time database, authentication, and cloud functions setup
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getPerformance } from 'firebase/performance';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "pqshield-api.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "pqshield-api",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "pqshield-api.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const performance = typeof window !== 'undefined' ? getPerformance(app) : null;

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

// Firebase Cloud Messaging setup
export const initializeMessaging = async () => {
  if (!messaging) return null;

  try {
    const vapidKey = process.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('VAPID key not configured for push notifications');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Failed to initialize messaging:', error);
    return null;
  }
};

// Handle foreground messages
export const onMessageListener = () => {
  if (!messaging) return Promise.resolve();

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      resolve(payload);
    });
  });
};

// Firestore collections and document references
export const collections = {
  users: 'users',
  scans: 'scans',
  vulnerabilities: 'vulnerabilities',
  threats: 'threats',
  threatIntelligence: 'threatIntelligence',
  compliance: 'compliance',
  quantumAssessments: 'quantumAssessments',
  analytics: 'analytics',
  userTokens: 'userTokens',
  threatStats: 'threatStats'
};

// Security rules helper functions
export const securityRules = {
  // Check if user owns the document
  isOwner: (userId, docUserId) => userId === docUserId,
  
  // Check if user has premium subscription
  isPremiumUser: async (userId) => {
    try {
      const userDoc = await db.collection(collections.users).doc(userId).get();
      return userDoc.exists && userDoc.data()?.subscription === 'premium';
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  },
  
  // Check rate limits
  checkRateLimit: async (userId, action) => {
    try {
      const userDoc = await db.collection(collections.users).doc(userId).get();
      if (!userDoc.exists) return false;
      
      const userData = userDoc.data();
      const limits = {
        free: { scans: 100, assessments: 50 },
        premium: { scans: 10000, assessments: 5000 }
      };
      
      const userLimits = limits[userData.subscription] || limits.free;
      return userData[`${action}Count`] < userLimits[action];
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }
  }
};

// Real-time listeners
export const realtimeListeners = {
  // Listen to scan status updates
  onScanUpdate: (scanId, callback) => {
    return db.collection(collections.scans).doc(scanId).onSnapshot(callback);
  },
  
  // Listen to threat updates
  onThreatUpdate: (userId, callback) => {
    return db.collection(collections.threats)
      .where('userId', '==', userId)
      .orderBy('detectedAt', 'desc')
      .limit(10)
      .onSnapshot(callback);
  },
  
  // Listen to global threat statistics
  onThreatStatsUpdate: (callback) => {
    return db.collection(collections.threatStats)
      .doc('daily')
      .onSnapshot(callback);
  }
};

// API helper functions
export const apiHelpers = {
  // Create user profile
  createUserProfile: async (user, subscription = 'free') => {
    const userProfile = {
      userId: user.uid,
      email: user.email,
      displayName: user.displayName,
      subscription,
      scanCount: 0,
      assessmentCount: 0,
      threatsBlocked: 0,
      quantumThreatsDetected: 0,
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    await db.collection(collections.users).doc(user.uid).set(userProfile);
    return userProfile;
  },
  
  // Update user activity
  updateUserActivity: async (userId) => {
    await db.collection(collections.users).doc(userId).update({
      lastActivity: new Date()
    });
  },
  
  // Increment user counters
  incrementCounter: async (userId, counter, amount = 1) => {
    const increment = firebase.firestore.FieldValue.increment(amount);
    await db.collection(collections.users).doc(userId).update({
      [counter]: increment
    });
  },
  
  // Store FCM token
  storeFCMToken: async (userId, token) => {
    const tokenDoc = db.collection(collections.userTokens).doc(userId);
    const doc = await tokenDoc.get();
    
    if (doc.exists) {
      const tokens = doc.data().tokens || [];
      if (!tokens.includes(token)) {
        tokens.push(token);
        await tokenDoc.update({ tokens });
      }
    } else {
      await tokenDoc.set({ tokens: [token] });
    }
  }
};

// Error handling
export const errorHandler = {
  handleFirebaseError: (error) => {
    console.error('Firebase error:', error);
    
    const errorMessages = {
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Invalid password',
      'auth/email-already-in-use': 'Email already registered',
      'auth/weak-password': 'Password is too weak',
      'permission-denied': 'Access denied',
      'unavailable': 'Service temporarily unavailable',
      'deadline-exceeded': 'Request timeout'
    };
    
    return errorMessages[error.code] || 'An unexpected error occurred';
  }
};

// Performance monitoring
export const performanceMonitoring = {
  // Track custom metrics
  trackMetric: (name, value) => {
    if (performance) {
      const metric = performance.trace(name);
      metric.putMetric('value', value);
      metric.stop();
    }
  },
  
  // Track scan performance
  trackScanPerformance: (scanId, duration, vulnerabilityCount) => {
    if (performance) {
      const trace = performance.trace('security_scan');
      trace.putAttribute('scan_id', scanId);
      trace.putMetric('duration_ms', duration);
      trace.putMetric('vulnerabilities_found', vulnerabilityCount);
      trace.stop();
    }
  }
};

export default app;
