/**
 * Authentication Service for PQShield API
 * Comprehensive user authentication and account management system
 */

import { 
  auth, 
  db, 
  functions,
  apiHelpers,
  errorHandler 
} from '../infrastructure/firebase/firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  deleteUser,
  onAuthStateChanged,
  multiFactor,
  PhoneAuthProvider,
  RecaptchaVerifier,
  linkWithCredential,
  unlink,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

class AuthenticationService {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.authListeners = new Set();
    this.profileListeners = new Set();
    
    // Authentication providers
    this.providers = {
      google: new GoogleAuthProvider(),
      github: new GithubAuthProvider(),
      twitter: new TwitterAuthProvider()
    };
    
    // Configure providers
    this.setupProviders();
    
    // Session management
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.inactivityTimeout = 2 * 60 * 60 * 1000; // 2 hours
    this.lastActivity = Date.now();
    
    // Security features
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    
    // Initialize authentication state listener
    this.initializeAuthListener();
    this.startSessionMonitoring();
  }

  setupProviders() {
    // Google provider configuration
    this.providers.google.addScope('profile');
    this.providers.google.addScope('email');
    this.providers.google.setCustomParameters({
      prompt: 'select_account'
    });

    // GitHub provider configuration
    this.providers.github.addScope('user:email');
    this.providers.github.setCustomParameters({
      allow_signup: 'true'
    });

    // Twitter provider configuration
    this.providers.twitter.setCustomParameters({
      lang: 'en'
    });
  }

  initializeAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        // User is signed in
        await this.handleUserSignIn(user);
      } else {
        // User is signed out
        this.handleUserSignOut();
      }
      
      // Notify listeners
      this.notifyAuthListeners(user);
    });
  }

  async handleUserSignIn(user) {
    try {
      // Update last activity
      this.updateActivity();
      
      // Load or create user profile
      await this.loadUserProfile(user.uid);
      
      // Update user activity in database
      await this.updateUserActivity(user.uid);
      
      // Check for security alerts
      await this.checkSecurityAlerts(user.uid);
      
      // Initialize user session
      await this.initializeUserSession(user);
      
    } catch (error) {
      console.error('Error handling user sign in:', error);
    }
  }

  handleUserSignOut() {
    this.currentUser = null;
    this.userProfile = null;
    this.clearSession();
  }

  // Email/Password Authentication
  async signUpWithEmail(email, password, additionalInfo = {}) {
    try {
      // Validate input
      this.validateEmail(email);
      this.validatePassword(password);
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with additional info
      if (additionalInfo.displayName) {
        await updateProfile(user, {
          displayName: additionalInfo.displayName
        });
      }
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user profile in database
      await this.createUserProfile(user, {
        ...additionalInfo,
        signUpMethod: 'email',
        emailVerified: false
      });
      
      // Track sign up event
      await this.trackAuthEvent('sign_up', {
        method: 'email',
        userId: user.uid
      });
      
      return {
        user,
        message: 'Account created successfully. Please check your email for verification.'
      };
      
    } catch (error) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  async signInWithEmail(email, password) {
    try {
      // Check for account lockout
      await this.checkAccountLockout(email);
      
      // Attempt sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Clear failed login attempts
      await this.clearFailedAttempts(email);
      
      // Track sign in event
      await this.trackAuthEvent('sign_in', {
        method: 'email',
        userId: user.uid
      });
      
      return { user };
      
    } catch (error) {
      console.error('Sign in error:', error);
      
      // Track failed login attempt
      await this.trackFailedLogin(email);
      
      throw this.handleAuthError(error);
    }
  }

  // Social Authentication
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.providers.google);
      const user = result.user;
      
      // Check if this is a new user
      const isNewUser = result._tokenResponse?.isNewUser;
      
      if (isNewUser) {
        await this.createUserProfile(user, {
          signUpMethod: 'google',
          emailVerified: true
        });
      }
      
      await this.trackAuthEvent('sign_in', {
        method: 'google',
        userId: user.uid,
        isNewUser
      });
      
      return { user, isNewUser };
      
    } catch (error) {
      console.error('Google sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  async signInWithGitHub() {
    try {
      const result = await signInWithPopup(auth, this.providers.github);
      const user = result.user;
      
      const isNewUser = result._tokenResponse?.isNewUser;
      
      if (isNewUser) {
        await this.createUserProfile(user, {
          signUpMethod: 'github',
          emailVerified: true
        });
      }
      
      await this.trackAuthEvent('sign_in', {
        method: 'github',
        userId: user.uid,
        isNewUser
      });
      
      return { user, isNewUser };
      
    } catch (error) {
      console.error('GitHub sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  async signInWithTwitter() {
    try {
      const result = await signInWithPopup(auth, this.providers.twitter);
      const user = result.user;
      
      const isNewUser = result._tokenResponse?.isNewUser;
      
      if (isNewUser) {
        await this.createUserProfile(user, {
          signUpMethod: 'twitter',
          emailVerified: user.emailVerified
        });
      }
      
      await this.trackAuthEvent('sign_in', {
        method: 'twitter',
        userId: user.uid,
        isNewUser
      });
      
      return { user, isNewUser };
      
    } catch (error) {
      console.error('Twitter sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Multi-Factor Authentication
  async enableMFA(phoneNumber) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated to enable MFA');
      }
      
      // Set up reCAPTCHA
      const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible'
      }, auth);
      
      // Get multi-factor session
      const multiFactorSession = await multiFactor(this.currentUser).getSession();
      
      // Create phone auth credential
      const phoneAuthCredential = PhoneAuthProvider.credential(
        phoneNumber,
        multiFactorSession
      );
      
      // Enroll the credential
      const multiFactorAssertion = PhoneAuthProvider.credential(phoneAuthCredential);
      await multiFactor(this.currentUser).enroll(multiFactorAssertion, 'Phone Number');
      
      // Update user profile
      await this.updateUserProfile({
        mfaEnabled: true,
        mfaMethod: 'phone',
        phoneNumber: phoneNumber
      });
      
      await this.trackAuthEvent('mfa_enabled', {
        userId: this.currentUser.uid,
        method: 'phone'
      });
      
      return { success: true, message: 'Multi-factor authentication enabled successfully' };
      
    } catch (error) {
      console.error('MFA enable error:', error);
      throw this.handleAuthError(error);
    }
  }

  async disableMFA() {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated to disable MFA');
      }
      
      const multiFactorUser = multiFactor(this.currentUser);
      const enrolledFactors = multiFactorUser.enrolledFactors;
      
      // Unenroll all factors
      for (const factor of enrolledFactors) {
        await multiFactorUser.unenroll(factor);
      }
      
      // Update user profile
      await this.updateUserProfile({
        mfaEnabled: false,
        mfaMethod: null,
        phoneNumber: null
      });
      
      await this.trackAuthEvent('mfa_disabled', {
        userId: this.currentUser.uid
      });
      
      return { success: true, message: 'Multi-factor authentication disabled successfully' };
      
    } catch (error) {
      console.error('MFA disable error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Account Management
  async updateUserProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated to update profile');
      }
      
      const userRef = doc(db, 'users', this.currentUser.uid);
      
      // Update Firebase Auth profile if needed
      const authUpdates = {};
      if (updates.displayName) authUpdates.displayName = updates.displayName;
      if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
      
      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(this.currentUser, authUpdates);
      }
      
      // Update Firestore profile
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Update local profile
      this.userProfile = { ...this.userProfile, ...updates };
      
      // Notify listeners
      this.notifyProfileListeners(this.userProfile);
      
      await this.trackAuthEvent('profile_updated', {
        userId: this.currentUser.uid,
        fields: Object.keys(updates)
      });
      
      return { success: true, message: 'Profile updated successfully' };
      
    } catch (error) {
      console.error('Profile update error:', error);
      throw this.handleAuthError(error);
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated to change password');
      }
      
      // Validate new password
      this.validatePassword(newPassword);
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        this.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(this.currentUser, credential);
      
      // Update password
      await updatePassword(this.currentUser, newPassword);
      
      // Update security info
      await this.updateUserProfile({
        passwordChangedAt: serverTimestamp(),
        securityScore: increment(10) // Increase security score
      });
      
      await this.trackAuthEvent('password_changed', {
        userId: this.currentUser.uid
      });
      
      return { success: true, message: 'Password changed successfully' };
      
    } catch (error) {
      console.error('Password change error:', error);
      throw this.handleAuthError(error);
    }
  }

  async resetPassword(email) {
    try {
      this.validateEmail(email);
      
      await sendPasswordResetEmail(auth, email);
      
      await this.trackAuthEvent('password_reset_requested', {
        email
      });
      
      return { success: true, message: 'Password reset email sent successfully' };
      
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  async deleteAccount(password) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated to delete account');
      }
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        this.currentUser.email,
        password
      );
      await reauthenticateWithCredential(this.currentUser, credential);
      
      const userId = this.currentUser.uid;
      
      // Delete user data from Firestore
      await this.deleteUserData(userId);
      
      // Delete Firebase Auth account
      await deleteUser(this.currentUser);
      
      await this.trackAuthEvent('account_deleted', {
        userId
      });
      
      return { success: true, message: 'Account deleted successfully' };
      
    } catch (error) {
      console.error('Account deletion error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Account Linking
  async linkAccount(provider) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated to link accounts');
      }
      
      const result = await linkWithCredential(this.currentUser, this.providers[provider]);
      
      // Update user profile with linked account info
      await this.updateUserProfile({
        linkedAccounts: {
          ...this.userProfile.linkedAccounts,
          [provider]: {
            providerId: result.providerId,
            linkedAt: serverTimestamp()
          }
        }
      });
      
      await this.trackAuthEvent('account_linked', {
        userId: this.currentUser.uid,
        provider
      });
      
      return { success: true, message: `${provider} account linked successfully` };
      
    } catch (error) {
      console.error('Account linking error:', error);
      throw this.handleAuthError(error);
    }
  }

  async unlinkAccount(providerId) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated to unlink accounts');
      }
      
      await unlink(this.currentUser, providerId);
      
      // Update user profile
      const linkedAccounts = { ...this.userProfile.linkedAccounts };
      delete linkedAccounts[providerId];
      
      await this.updateUserProfile({
        linkedAccounts
      });
      
      await this.trackAuthEvent('account_unlinked', {
        userId: this.currentUser.uid,
        providerId
      });
      
      return { success: true, message: 'Account unlinked successfully' };
      
    } catch (error) {
      console.error('Account unlinking error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Session Management
  async signOut() {
    try {
      if (this.currentUser) {
        await this.trackAuthEvent('sign_out', {
          userId: this.currentUser.uid
        });
      }
      
      await signOut(auth);
      this.clearSession();
      
      return { success: true, message: 'Signed out successfully' };
      
    } catch (error) {
      console.error('Sign out error:', error);
      throw this.handleAuthError(error);
    }
  }

  // User Profile Management
  async createUserProfile(user, additionalInfo = {}) {
    try {
      const userProfile = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified,
        subscription: 'free',
        subscriptionTier: 'basic',
        apiKey: this.generateApiKey(),
        scanCount: 0,
        assessmentCount: 0,
        threatsBlocked: 0,
        quantumThreatsDetected: 0,
        securityScore: 50,
        mfaEnabled: false,
        linkedAccounts: {},
        preferences: {
          notifications: true,
          emailAlerts: true,
          darkMode: false,
          language: 'en'
        },
        ...additionalInfo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      this.userProfile = userProfile;
      
      // Initialize user statistics
      await this.initializeUserStats(user.uid);
      
      return userProfile;
      
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async loadUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        this.userProfile = { id: userDoc.id, ...userDoc.data() };
      } else {
        // Create profile if it doesn't exist
        this.userProfile = await this.createUserProfile(this.currentUser);
      }
      
      // Set up real-time profile listener
      this.setupProfileListener(userId);
      
      return this.userProfile;
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  }

  setupProfileListener(userId) {
    const userRef = doc(db, 'users', userId);
    
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        this.userProfile = { id: doc.id, ...doc.data() };
        this.notifyProfileListeners(this.userProfile);
      }
    });
  }

  // Security Features
  async checkAccountLockout(email) {
    try {
      const lockoutDoc = await getDoc(doc(db, 'accountLockouts', email));
      
      if (lockoutDoc.exists()) {
        const lockoutData = lockoutDoc.data();
        const now = Date.now();
        
        if (lockoutData.lockedUntil > now) {
          const remainingTime = Math.ceil((lockoutData.lockedUntil - now) / 60000);
          throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
        }
      }
    } catch (error) {
      if (error.message.includes('Account locked')) {
        throw error;
      }
      // Ignore other errors (document doesn't exist, etc.)
    }
  }

  async trackFailedLogin(email) {
    try {
      const lockoutRef = doc(db, 'accountLockouts', email);
      const lockoutDoc = await getDoc(lockoutRef);
      
      let attempts = 1;
      let lockedUntil = null;
      
      if (lockoutDoc.exists()) {
        const data = lockoutDoc.data();
        attempts = data.attempts + 1;
        
        if (attempts >= this.maxLoginAttempts) {
          lockedUntil = Date.now() + this.lockoutDuration;
        }
      }
      
      await setDoc(lockoutRef, {
        email,
        attempts,
        lockedUntil,
        lastAttempt: serverTimestamp()
      });
      
      if (lockedUntil) {
        throw new Error(`Too many failed login attempts. Account locked for 15 minutes.`);
      }
      
    } catch (error) {
      console.error('Error tracking failed login:', error);
      throw error;
    }
  }

  async clearFailedAttempts(email) {
    try {
      await deleteDoc(doc(db, 'accountLockouts', email));
    } catch (error) {
      // Ignore errors (document might not exist)
    }
  }

  async checkSecurityAlerts(userId) {
    try {
      // Check for suspicious activity
      const alertsQuery = query(
        collection(db, 'securityAlerts'),
        where('userId', '==', userId),
        where('resolved', '==', false),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const alertsSnapshot = await alertsQuery.get();
      const alerts = alertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (alerts.length > 0) {
        // Notify user of security alerts
        this.notifySecurityAlerts(alerts);
      }
      
    } catch (error) {
      console.error('Error checking security alerts:', error);
    }
  }

  // Utility Methods
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  validatePassword(password) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }

  generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'pqs_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async updateUserActivity(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  async initializeUserSession(user) {
    const sessionData = {
      userId: user.uid,
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent
    };
    
    localStorage.setItem('pqshield_session', JSON.stringify(sessionData));
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  updateActivity() {
    this.lastActivity = Date.now();
  }

  startSessionMonitoring() {
    setInterval(() => {
      if (this.currentUser && Date.now() - this.lastActivity > this.inactivityTimeout) {
        this.handleInactiveSession();
      }
    }, 60000); // Check every minute
  }

  async handleInactiveSession() {
    console.log('Session inactive, signing out user');
    await this.signOut();
  }

  clearSession() {
    localStorage.removeItem('pqshield_session');
    localStorage.removeItem('pqshield_auth_token');
  }

  async trackAuthEvent(event, data) {
    try {
      await addDoc(collection(db, 'authEvents'), {
        event,
        ...data,
        timestamp: serverTimestamp(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error tracking auth event:', error);
    }
  }

  async initializeUserStats(userId) {
    try {
      await setDoc(doc(db, 'userStats', userId), {
        userId,
        totalScans: 0,
        totalThreats: 0,
        totalVulnerabilities: 0,
        averageSecurityScore: 0,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error initializing user stats:', error);
    }
  }

  async deleteUserData(userId) {
    try {
      // Delete user profile
      await deleteDoc(doc(db, 'users', userId));
      
      // Delete user stats
      await deleteDoc(doc(db, 'userStats', userId));
      
      // Delete user scans (in batches)
      const scansQuery = query(
        collection(db, 'scans'),
        where('userId', '==', userId),
        limit(500)
      );
      
      const scansSnapshot = await scansQuery.get();
      const batch = writeBatch(db);
      
      scansSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  handleAuthError(error) {
    const errorMessage = errorHandler.handleFirebaseError(error);
    return new Error(errorMessage);
  }

  // Event Listeners
  onAuthStateChanged(callback) {
    this.authListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.authListeners.delete(callback);
    };
  }

  onProfileChanged(callback) {
    this.profileListeners.add(callback);
    
    return () => {
      this.profileListeners.delete(callback);
    };
  }

  notifyAuthListeners(user) {
    this.authListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  notifyProfileListeners(profile) {
    this.profileListeners.forEach(callback => {
      try {
        callback(profile);
      } catch (error) {
        console.error('Error in profile listener:', error);
      }
    });
  }

  notifySecurityAlerts(alerts) {
    // Implement security alert notifications
    console.log('Security alerts:', alerts);
  }

  // Getters
  getCurrentUser() {
    return this.currentUser;
  }

  getUserProfile() {
    return this.userProfile;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isEmailVerified() {
    return this.currentUser?.emailVerified || false;
  }

  getSubscriptionTier() {
    return this.userProfile?.subscriptionTier || 'basic';
  }

  getApiKey() {
    return this.userProfile?.apiKey;
  }
}

// Singleton instance
const authService = new AuthenticationService();

export default authService;

// React hooks for easy integration
export const useAuth = () => {
  const [user, setUser] = React.useState(authService.getCurrentUser());
  const [profile, setProfile] = React.useState(authService.getUserProfile());
  
  React.useEffect(() => {
    const unsubscribeAuth = authService.onAuthStateChanged(setUser);
    const unsubscribeProfile = authService.onProfileChanged(setProfile);
    
    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);
  
  return {
    user,
    profile,
    isAuthenticated: authService.isAuthenticated(),
    isEmailVerified: authService.isEmailVerified(),
    subscriptionTier: authService.getSubscriptionTier(),
    apiKey: authService.getApiKey(),
    signUp: authService.signUpWithEmail.bind(authService),
    signIn: authService.signInWithEmail.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signInWithGitHub: authService.signInWithGitHub.bind(authService),
    signOut: authService.signOut.bind(authService),
    updateProfile: authService.updateUserProfile.bind(authService),
    changePassword: authService.changePassword.bind(authService),
    resetPassword: authService.resetPassword.bind(authService)
  };
};
