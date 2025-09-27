// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);
export const messaging = getMessaging(app);
export const storage = getStorage(app);

// Development emulators
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Universal Sentinel Firebase Service
export class UniversalSentinelFirebase {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Setup authentication state listener
      this.setupAuthListener();
      
      // Initialize push notifications
      await this.initializePushNotifications();
      
      // Setup analytics
      this.setupAnalytics();
      
      // Initialize real-time listeners
      this.setupRealtimeListeners();
      
      this.initialized = true;
      console.log('🔥 Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  }

  setupAuthListener() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User signed in
        await this.onUserSignIn(user);
      } else {
        // User signed out
        await this.onUserSignOut();
      }
    });
  }

  async onUserSignIn(user) {
    // Update user profile in Firestore
    await this.updateUserProfile(user);
    
    // Initialize user-specific services
    await this.initializeUserServices(user);
    
    // Track sign-in event
    this.trackEvent('user_sign_in', {
      user_id: user.uid,
      method: user.providerData[0]?.providerId || 'unknown'
    });
  }

  async onUserSignOut() {
    // Clean up user-specific listeners
    this.cleanupUserServices();
    
    // Track sign-out event
    this.trackEvent('user_sign_out');
  }

  async updateUserProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastSignIn: new Date(),
      deviceInfo: await this.getDeviceInfo(),
      protectionStats: {
        threatsBlocked: 0,
        moneySaved: 0,
        devicesProtected: 1,
        joinDate: new Date()
      }
    };

    await setDoc(userRef, userData, { merge: true });
  }

  async initializePushNotifications() {
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: process.env.VITE_FIREBASE_VAPID_KEY
        });
        
        // Save token to user profile
        if (auth.currentUser) {
          await this.saveFCMToken(auth.currentUser.uid, token);
        }
        
        // Setup message handlers
        this.setupMessageHandlers();
      }
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  }

  setupMessageHandlers() {
    // Handle foreground messages
    onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
      
      // Show custom notification
      this.showCustomNotification(payload);
      
      // Handle different message types
      this.handleMessageType(payload);
    });
  }

  handleMessageType(payload) {
    const { type } = payload.data || {};
    
    switch (type) {
      case 'threat_alert':
        this.handleThreatAlert(payload);
        break;
      case 'family_notification':
        this.handleFamilyNotification(payload);
        break;
      case 'achievement_unlock':
        this.handleAchievementUnlock(payload);
        break;
      case 'community_update':
        this.handleCommunityUpdate(payload);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  setupAnalytics() {
    // Track app initialization
    this.trackEvent('app_initialize', {
      platform: this.getPlatform(),
      version: process.env.VITE_APP_VERSION || '1.0.0'
    });
    
    // Setup custom analytics
    this.setupCustomAnalytics();
  }

  setupRealtimeListeners() {
    if (!auth.currentUser) return;

    // Listen to user's protection stats
    const userStatsRef = doc(db, 'users', auth.currentUser.uid);
    onSnapshot(userStatsRef, (doc) => {
      if (doc.exists()) {
        const stats = doc.data().protectionStats;
        this.updateProtectionUI(stats);
      }
    });

    // Listen to global threat feed
    const threatsRef = collection(db, 'threats');
    const threatsQuery = query(
      threatsRef,
      where('timestamp', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    onSnapshot(threatsQuery, (snapshot) => {
      const threats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      this.updateThreatFeed(threats);
    });

    // Listen to family network updates
    this.setupFamilyNetworkListener();
  }

  setupFamilyNetworkListener() {
    if (!auth.currentUser) return;

    const familyRef = collection(db, 'families');
    const familyQuery = query(
      familyRef,
      where('members', 'array-contains', auth.currentUser.uid)
    );

    onSnapshot(familyQuery, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const familyData = doc.data();
        this.updateFamilyProtectionStatus(familyData);
      });
    });
  }

  // Threat Detection Integration
  async reportThreat(threatData) {
    try {
      // Add to Firestore
      const threatRef = await addDoc(collection(db, 'threats'), {
        ...threatData,
        userId: auth.currentUser?.uid,
        timestamp: new Date(),
        processed: false
      });

      // Update user stats
      await this.updateUserThreatStats(threatData);

      // Trigger cloud function for processing
      const processFunction = httpsCallable(functions, 'processThreat');
      await processFunction({ threatId: threatRef.id });

      // Track analytics
      this.trackEvent('threat_detected', {
        type: threatData.type,
        confidence: threatData.confidence,
        processing_time: threatData.processingTime
      });

      return threatRef.id;
    } catch (error) {
      console.error('Failed to report threat:', error);
      throw error;
    }
  }

  async updateUserThreatStats(threatData) {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    await updateDoc(userRef, {
      'protectionStats.threatsBlocked': increment(1),
      'protectionStats.lastThreatBlocked': new Date(),
      'protectionStats.totalProcessingTime': increment(threatData.processingTime || 0)
    });

    // Calculate money saved based on threat type
    const moneySaved = this.calculateMoneySaved(threatData.type);
    if (moneySaved > 0) {
      await updateDoc(userRef, {
        'protectionStats.moneySaved': increment(moneySaved)
      });
    }
  }

  calculateMoneySaved(threatType) {
    const savingsMap = {
      'phishing': 150,
      'scam': 500,
      'fraud': 1200,
      'malware': 300,
      'ransomware': 2500
    };
    
    return savingsMap[threatType] || 0;
  }

  // Social Features
  async shareProtectionStats() {
    if (!auth.currentUser) return;

    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const stats = userDoc.data()?.protectionStats;

    const shareData = {
      title: 'Universal Sentinel Protection Stats',
      text: `I've blocked ${stats.threatsBlocked} threats and saved $${stats.moneySaved} with Universal Sentinel! 🛡️`,
      url: 'https://universalsentinel.app'
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
    }

    // Track sharing event
    this.trackEvent('stats_shared', {
      threats_blocked: stats.threatsBlocked,
      money_saved: stats.moneySaved
    });
  }

  // Family Network Features
  async createFamilyNetwork(familyName) {
    if (!auth.currentUser) return;

    const familyData = {
      name: familyName,
      owner: auth.currentUser.uid,
      members: [auth.currentUser.uid],
      createdAt: new Date(),
      settings: {
        childSafety: true,
        financialProtection: true,
        communityAlerts: true
      },
      stats: {
        totalThreatsBlocked: 0,
        totalMoneySaved: 0,
        devicesProtected: 1
      }
    };

    const familyRef = await addDoc(collection(db, 'families'), familyData);
    
    // Update user profile
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      familyId: familyRef.id
    });

    return familyRef.id;
  }

  async inviteFamilyMember(email) {
    // Send invitation via Cloud Function
    const inviteFunction = httpsCallable(functions, 'inviteFamilyMember');
    await inviteFunction({ email });
    
    this.trackEvent('family_invite_sent', { email });
  }

  // Utility Methods
  trackEvent(eventName, parameters = {}) {
    if (analytics) {
      logEvent(analytics, eventName, parameters);
    }
  }

  getPlatform() {
    if (typeof window !== 'undefined') {
      return window.navigator.userAgent.includes('Mobile') ? 'mobile_web' : 'desktop_web';
    }
    return 'unknown';
  }

  async getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date()
    };
  }

  async saveFCMToken(userId, token) {
    await setDoc(doc(db, 'fcm_tokens', userId), {
      token,
      userId,
      updatedAt: new Date()
    });
  }

  // UI Update Methods (to be implemented by the UI layer)
  updateProtectionUI(stats) {
    // Emit event for UI to handle
    window.dispatchEvent(new CustomEvent('protectionStatsUpdated', { detail: stats }));
  }

  updateThreatFeed(threats) {
    window.dispatchEvent(new CustomEvent('threatFeedUpdated', { detail: threats }));
  }

  updateFamilyProtectionStatus(familyData) {
    window.dispatchEvent(new CustomEvent('familyStatusUpdated', { detail: familyData }));
  }

  showCustomNotification(payload) {
    // Custom notification implementation
    console.log('Showing notification:', payload);
  }

  handleThreatAlert(payload) {
    // Handle threat alert
    console.log('Threat alert:', payload);
  }

  handleFamilyNotification(payload) {
    // Handle family notification
    console.log('Family notification:', payload);
  }

  handleAchievementUnlock(payload) {
    // Handle achievement unlock
    console.log('Achievement unlocked:', payload);
  }

  handleCommunityUpdate(payload) {
    // Handle community update
    console.log('Community update:', payload);
  }

  setupCustomAnalytics() {
    // Custom analytics setup
    console.log('Custom analytics initialized');
  }

  async initializeUserServices(user) {
    // Initialize user-specific services
    console.log('User services initialized for:', user.uid);
  }

  cleanupUserServices() {
    // Cleanup user-specific services
    console.log('User services cleaned up');
  }
}

// Export singleton instance
export const firebaseService = new UniversalSentinelFirebase();
