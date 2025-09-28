/**
 * Enhanced Payment Service for PQ359 API
 * Real Stripe integration with advanced fraud detection and security
 */

import { loadStripe } from '@stripe/stripe-js';
import { 
  db, 
  functions,
  auth 
} from '../infrastructure/firebase/firebase-config.js';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import authService from './AuthenticationService.js';

class PaymentService {
  constructor() {
    // Initialize Stripe
    this.stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
    this.stripe = null;
    
    // Payment providers
    this.providers = {
      stripe: 'stripe',
      paypal: 'paypal',
      apple: 'apple_pay',
      google: 'google_pay',
      crypto: 'crypto'
    };
    
    // Subscription tiers
    this.subscriptionTiers = {
      basic: {
        name: 'Basic',
        price: 0,
        priceId: null,
        features: [
          '10 scans per month',
          'Basic threat detection',
          'Email support',
          'Standard security reports'
        ],
        limits: {
          scansPerMonth: 10,
          apiCallsPerHour: 100,
          storageGB: 1
        }
      },
      pro: {
        name: 'Professional',
        price: 29.99,
        priceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID,
        features: [
          '1,000 scans per month',
          'Advanced neural network analysis',
          'Real-time threat monitoring',
          'Priority support',
          'Custom security reports',
          'API access',
          'Quantum threat assessment'
        ],
        limits: {
          scansPerMonth: 1000,
          apiCallsPerHour: 1000,
          storageGB: 10
        }
      },
      enterprise: {
        name: 'Enterprise',
        price: 199.99,
        priceId: process.env.REACT_APP_STRIPE_ENTERPRISE_PRICE_ID,
        features: [
          'Unlimited scans',
          'Advanced SNN/ANN models',
          'Real-time global threat intelligence',
          '24/7 dedicated support',
          'Custom integrations',
          'White-label solutions',
          'Advanced compliance reporting',
          'Multi-tenant management',
          'Custom neural network training'
        ],
        limits: {
          scansPerMonth: -1, // Unlimited
          apiCallsPerHour: 10000,
          storageGB: 100
        }
      }
    };
    
    // Fraud detection settings
    this.fraudSettings = {
      maxDailyAmount: 5000,
      maxTransactionsPerHour: 10,
      maxFailedAttempts: 3,
      velocityCheckWindow: 3600000, // 1 hour
      riskThresholds: {
        low: 30,
        medium: 60,
        high: 80
      }
    };
    
    // Initialize Stripe instance
    this.initializeStripe();
    
    // Fraud detection cache
    this.fraudCache = new Map();
    this.velocityCache = new Map();
  }

  async initializeStripe() {
    try {
      this.stripe = await this.stripePromise;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
    }
  }

  // ===============================================
  // SUBSCRIPTION MANAGEMENT
  // ===============================================

  async createSubscription(userId, tierId, paymentMethodId) {
    try {
      // Validate user authentication
      if (!authService.isAuthenticated()) {
        throw new Error('User must be authenticated to create subscription');
      }

      // Get subscription tier details
      const tier = this.subscriptionTiers[tierId];
      if (!tier || !tier.priceId) {
        throw new Error('Invalid subscription tier');
      }

      // Perform fraud check before processing
      const fraudCheck = await this.performFraudCheck({
        userId,
        amount: tier.price,
        paymentMethodId,
        type: 'subscription'
      });

      if (fraudCheck.riskScore > this.fraudSettings.riskThresholds.high) {
        throw new Error('Payment blocked due to security concerns');
      }

      // Create subscription via Firebase Cloud Function
      const createSubscription = httpsCallable(functions, 'createSubscription');
      const result = await createSubscription({
        userId,
        priceId: tier.priceId,
        paymentMethodId,
        fraudScore: fraudCheck.riskScore
      });

      if (result.data.success) {
        // Update user profile with new subscription
        await authService.updateUserProfile({
          subscriptionTier: tierId,
          subscriptionId: result.data.subscriptionId,
          subscriptionStatus: 'active',
          subscriptionStartDate: serverTimestamp(),
          limits: tier.limits
        });

        // Track subscription event
        await this.trackPaymentEvent('subscription_created', {
          userId,
          tierId,
          amount: tier.price,
          subscriptionId: result.data.subscriptionId
        });

        return {
          success: true,
          subscriptionId: result.data.subscriptionId,
          message: 'Subscription created successfully'
        };
      } else {
        throw new Error(result.data.error || 'Failed to create subscription');
      }

    } catch (error) {
      console.error('Subscription creation error:', error);
      await this.trackPaymentEvent('subscription_failed', {
        userId,
        tierId,
        error: error.message
      });
      throw error;
    }
  }

  async cancelSubscription(userId) {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error('User must be authenticated');
      }

      const userProfile = authService.getUserProfile();
      if (!userProfile.subscriptionId) {
        throw new Error('No active subscription found');
      }

      // Cancel subscription via Firebase Cloud Function
      const cancelSubscription = httpsCallable(functions, 'cancelSubscription');
      const result = await cancelSubscription({
        subscriptionId: userProfile.subscriptionId
      });

      if (result.data.success) {
        // Update user profile
        await authService.updateUserProfile({
          subscriptionStatus: 'cancelled',
          subscriptionEndDate: serverTimestamp()
        });

        await this.trackPaymentEvent('subscription_cancelled', {
          userId,
          subscriptionId: userProfile.subscriptionId
        });

        return {
          success: true,
          message: 'Subscription cancelled successfully'
        };
      } else {
        throw new Error(result.data.error || 'Failed to cancel subscription');
      }

    } catch (error) {
      console.error('Subscription cancellation error:', error);
      throw error;
    }
  }

  async updateSubscription(userId, newTierId) {
    try {
      const userProfile = authService.getUserProfile();
      const newTier = this.subscriptionTiers[newTierId];

      if (!newTier.priceId) {
        throw new Error('Invalid subscription tier');
      }

      // Update subscription via Firebase Cloud Function
      const updateSubscription = httpsCallable(functions, 'updateSubscription');
      const result = await updateSubscription({
        subscriptionId: userProfile.subscriptionId,
        newPriceId: newTier.priceId
      });

      if (result.data.success) {
        await authService.updateUserProfile({
          subscriptionTier: newTierId,
          limits: newTier.limits
        });

        await this.trackPaymentEvent('subscription_updated', {
          userId,
          oldTier: userProfile.subscriptionTier,
          newTier: newTierId
        });

        return {
          success: true,
          message: 'Subscription updated successfully'
        };
      } else {
        throw new Error(result.data.error || 'Failed to update subscription');
      }

    } catch (error) {
      console.error('Subscription update error:', error);
      throw error;
    }
  }

  // ===============================================
  // ONE-TIME PAYMENTS
  // ===============================================

  async processOneTimePayment(paymentData) {
    try {
      const { amount, currency = 'usd', description, userId } = paymentData;

      // Fraud check
      const fraudCheck = await this.performFraudCheck({
        userId,
        amount,
        type: 'one_time',
        ...paymentData
      });

      if (fraudCheck.riskScore > this.fraudSettings.riskThresholds.high) {
        return {
          success: false,
          error: 'Payment blocked due to security concerns',
          fraudScore: fraudCheck.riskScore
        };
      }

      // Create payment intent
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const result = await createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        description,
        userId,
        fraudScore: fraudCheck.riskScore
      });

      if (result.data.success) {
        return {
          success: true,
          clientSecret: result.data.clientSecret,
          paymentIntentId: result.data.paymentIntentId
        };
      } else {
        throw new Error(result.data.error || 'Failed to create payment intent');
      }

    } catch (error) {
      console.error('One-time payment error:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId, paymentMethodId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error, paymentIntent } = await this.stripe.confirmCardPayment(
        paymentIntentId,
        {
          payment_method: paymentMethodId
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        await this.trackPaymentEvent('payment_succeeded', {
          paymentIntentId,
          amount: paymentIntent.amount / 100
        });

        return {
          success: true,
          paymentIntent
        };
      } else {
        throw new Error('Payment confirmation failed');
      }

    } catch (error) {
      console.error('Payment confirmation error:', error);
      throw error;
    }
  }

  // ===============================================
  // FRAUD DETECTION SYSTEM
  // ===============================================

  async performFraudCheck(paymentData) {
    const {
      userId,
      amount,
      paymentMethodId,
      type,
      ipAddress,
      deviceFingerprint,
      userAgent
    } = paymentData;

    let riskScore = 0;
    const riskFactors = [];

    try {
      // 1. User behavior analysis
      const userRisk = await this.analyzeUserBehavior(userId, amount);
      riskScore += userRisk.score;
      if (userRisk.factors.length > 0) {
        riskFactors.push(...userRisk.factors);
      }

      // 2. Transaction velocity check
      const velocityRisk = await this.checkTransactionVelocity(userId, amount);
      riskScore += velocityRisk.score;
      if (velocityRisk.factors.length > 0) {
        riskFactors.push(...velocityRisk.factors);
      }

      // 3. Device and location analysis
      if (ipAddress || deviceFingerprint) {
        const deviceRisk = await this.analyzeDeviceAndLocation({
          userId,
          ipAddress,
          deviceFingerprint,
          userAgent
        });
        riskScore += deviceRisk.score;
        if (deviceRisk.factors.length > 0) {
          riskFactors.push(...deviceRisk.factors);
        }
      }

      // 4. Payment method analysis
      if (paymentMethodId) {
        const paymentRisk = await this.analyzePaymentMethod(paymentMethodId, userId);
        riskScore += paymentRisk.score;
        if (paymentRisk.factors.length > 0) {
          riskFactors.push(...paymentRisk.factors);
        }
      }

      // 5. Amount analysis
      const amountRisk = this.analyzeTransactionAmount(amount, userId);
      riskScore += amountRisk.score;
      if (amountRisk.factors.length > 0) {
        riskFactors.push(...amountRisk.factors);
      }

      // Normalize risk score (0-100)
      riskScore = Math.min(100, Math.max(0, riskScore));

      // Store fraud check result
      await this.storeFraudCheck({
        userId,
        riskScore,
        riskFactors,
        paymentData,
        timestamp: new Date()
      });

      return {
        riskScore,
        riskFactors,
        recommendation: this.getFraudRecommendation(riskScore),
        requiresVerification: riskScore > this.fraudSettings.riskThresholds.medium
      };

    } catch (error) {
      console.error('Fraud check error:', error);
      // Return high risk score on error
      return {
        riskScore: 90,
        riskFactors: ['Fraud check system error'],
        recommendation: 'manual_review',
        requiresVerification: true
      };
    }
  }

  async analyzeUserBehavior(userId, amount) {
    let score = 0;
    const factors = [];

    try {
      const userProfile = authService.getUserProfile();
      
      if (!userProfile) {
        score += 30;
        factors.push('No user profile found');
        return { score, factors };
      }

      // Check account age
      const accountAge = Date.now() - new Date(userProfile.createdAt?.toDate?.() || userProfile.createdAt).getTime();
      const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

      if (daysSinceCreation < 1) {
        score += 25;
        factors.push('Very new account (less than 1 day)');
      } else if (daysSinceCreation < 7) {
        score += 15;
        factors.push('New account (less than 1 week)');
      }

      // Check email verification
      if (!userProfile.emailVerified) {
        score += 20;
        factors.push('Email not verified');
      }

      // Check previous payment history
      const paymentHistory = await this.getUserPaymentHistory(userId);
      
      if (paymentHistory.length === 0) {
        score += 15;
        factors.push('No previous payment history');
      } else {
        // Check for failed payments
        const failedPayments = paymentHistory.filter(p => p.status === 'failed').length;
        const failureRate = failedPayments / paymentHistory.length;
        
        if (failureRate > 0.3) {
          score += 25;
          factors.push('High payment failure rate');
        }

        // Check average transaction amount
        const avgAmount = paymentHistory.reduce((sum, p) => sum + p.amount, 0) / paymentHistory.length;
        
        if (amount > avgAmount * 5) {
          score += 20;
          factors.push('Transaction amount significantly higher than average');
        }
      }

      // Check subscription status
      if (userProfile.subscriptionTier === 'basic' && amount > 100) {
        score += 10;
        factors.push('High amount for basic tier user');
      }

    } catch (error) {
      console.error('User behavior analysis error:', error);
      score += 20;
      factors.push('Error analyzing user behavior');
    }

    return { score, factors };
  }

  async checkTransactionVelocity(userId, amount) {
    let score = 0;
    const factors = [];

    try {
      const now = Date.now();
      const oneHourAgo = now - this.fraudSettings.velocityCheckWindow;

      // Get recent transactions
      const recentTransactions = await this.getRecentTransactions(userId, oneHourAgo);

      // Check transaction count
      if (recentTransactions.length >= this.fraudSettings.maxTransactionsPerHour) {
        score += 30;
        factors.push('Too many transactions in the last hour');
      }

      // Check total amount
      const totalAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      if (totalAmount + amount > this.fraudSettings.maxDailyAmount) {
        score += 25;
        factors.push('Daily transaction limit exceeded');
      }

      // Check for rapid successive transactions
      if (recentTransactions.length > 0) {
        const lastTransaction = recentTransactions[0];
        const timeSinceLastTransaction = now - lastTransaction.timestamp;
        
        if (timeSinceLastTransaction < 60000) { // Less than 1 minute
          score += 20;
          factors.push('Very rapid successive transactions');
        }
      }

    } catch (error) {
      console.error('Velocity check error:', error);
      score += 15;
      factors.push('Error checking transaction velocity');
    }

    return { score, factors };
  }

  async analyzeDeviceAndLocation(deviceData) {
    let score = 0;
    const factors = [];

    try {
      const { userId, ipAddress, deviceFingerprint, userAgent } = deviceData;

      // Check if device is known
      const knownDevices = await this.getUserKnownDevices(userId);
      
      if (!knownDevices.includes(deviceFingerprint)) {
        score += 15;
        factors.push('Unknown device');
      }

      // Check for VPN/Proxy (simplified check)
      if (await this.isVPNOrProxy(ipAddress)) {
        score += 20;
        factors.push('VPN or proxy detected');
      }

      // Check for suspicious user agent
      if (this.isSuspiciousUserAgent(userAgent)) {
        score += 10;
        factors.push('Suspicious user agent');
      }

      // Check IP geolocation vs user's typical location
      const userLocation = await this.getUserTypicalLocation(userId);
      const currentLocation = await this.getIPLocation(ipAddress);
      
      if (userLocation && currentLocation) {
        const distance = this.calculateDistance(userLocation, currentLocation);
        
        if (distance > 1000) { // More than 1000 km from usual location
          score += 15;
          factors.push('Unusual geographic location');
        }
      }

    } catch (error) {
      console.error('Device and location analysis error:', error);
      score += 10;
      factors.push('Error analyzing device and location');
    }

    return { score, factors };
  }

  async analyzePaymentMethod(paymentMethodId, userId) {
    let score = 0;
    const factors = [];

    try {
      // Check if payment method is known for this user
      const userPaymentMethods = await this.getUserPaymentMethods(userId);
      
      if (!userPaymentMethods.includes(paymentMethodId)) {
        score += 10;
        factors.push('New payment method');
      }

      // Check payment method details via Stripe
      const getPaymentMethodDetails = httpsCallable(functions, 'getPaymentMethodDetails');
      const result = await getPaymentMethodDetails({ paymentMethodId });
      
      if (result.data.success) {
        const details = result.data.paymentMethod;
        
        // Check for prepaid cards
        if (details.card?.funding === 'prepaid') {
          score += 15;
          factors.push('Prepaid card detected');
        }

        // Check card country vs user country
        const userProfile = authService.getUserProfile();
        if (userProfile.country && details.card?.country !== userProfile.country) {
          score += 10;
          factors.push('Card country mismatch');
        }

        // Check for high-risk BIN ranges (simplified)
        const bin = details.card?.last4; // In real implementation, use first 6 digits
        if (this.isHighRiskBIN(bin)) {
          score += 20;
          factors.push('High-risk card BIN');
        }
      }

    } catch (error) {
      console.error('Payment method analysis error:', error);
      score += 10;
      factors.push('Error analyzing payment method');
    }

    return { score, factors };
  }

  analyzeTransactionAmount(amount, userId) {
    let score = 0;
    const factors = [];

    // Check for unusually high amounts
    if (amount > 1000) {
      score += 15;
      factors.push('High transaction amount');
    }

    if (amount > 5000) {
      score += 25;
      factors.push('Very high transaction amount');
    }

    // Check for round numbers (often used in fraud)
    if (amount % 100 === 0 && amount >= 500) {
      score += 5;
      factors.push('Round number amount');
    }

    return { score, factors };
  }

  getFraudRecommendation(riskScore) {
    if (riskScore < this.fraudSettings.riskThresholds.low) {
      return 'approve';
    } else if (riskScore < this.fraudSettings.riskThresholds.medium) {
      return 'monitor';
    } else if (riskScore < this.fraudSettings.riskThresholds.high) {
      return 'verify';
    } else {
      return 'decline';
    }
  }

  // ===============================================
  // PAYMENT METHODS MANAGEMENT
  // ===============================================

  async addPaymentMethod(userId, paymentMethodData) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      // Create payment method
      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: paymentMethodData.card,
        billing_details: paymentMethodData.billingDetails
      });

      if (error) {
        throw new Error(error.message);
      }

      // Attach payment method to customer
      const attachPaymentMethod = httpsCallable(functions, 'attachPaymentMethod');
      const result = await attachPaymentMethod({
        paymentMethodId: paymentMethod.id,
        userId
      });

      if (result.data.success) {
        await this.trackPaymentEvent('payment_method_added', {
          userId,
          paymentMethodId: paymentMethod.id
        });

        return {
          success: true,
          paymentMethod
        };
      } else {
        throw new Error(result.data.error || 'Failed to attach payment method');
      }

    } catch (error) {
      console.error('Add payment method error:', error);
      throw error;
    }
  }

  async removePaymentMethod(userId, paymentMethodId) {
    try {
      const detachPaymentMethod = httpsCallable(functions, 'detachPaymentMethod');
      const result = await detachPaymentMethod({
        paymentMethodId,
        userId
      });

      if (result.data.success) {
        await this.trackPaymentEvent('payment_method_removed', {
          userId,
          paymentMethodId
        });

        return {
          success: true,
          message: 'Payment method removed successfully'
        };
      } else {
        throw new Error(result.data.error || 'Failed to remove payment method');
      }

    } catch (error) {
      console.error('Remove payment method error:', error);
      throw error;
    }
  }

  async getPaymentMethods(userId) {
    try {
      const getPaymentMethods = httpsCallable(functions, 'getPaymentMethods');
      const result = await getPaymentMethods({ userId });

      if (result.data.success) {
        return result.data.paymentMethods;
      } else {
        throw new Error(result.data.error || 'Failed to get payment methods');
      }

    } catch (error) {
      console.error('Get payment methods error:', error);
      throw error;
    }
  }

  // ===============================================
  // BILLING AND INVOICES
  // ===============================================

  async getBillingHistory(userId) {
    try {
      const billingQuery = query(
        collection(db, 'billing'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await billingQuery.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('Get billing history error:', error);
      throw error;
    }
  }

  async downloadInvoice(invoiceId) {
    try {
      const downloadInvoice = httpsCallable(functions, 'downloadInvoice');
      const result = await downloadInvoice({ invoiceId });

      if (result.data.success) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.data.downloadUrl;
        link.download = `invoice-${invoiceId}.pdf`;
        link.click();

        return {
          success: true,
          message: 'Invoice downloaded successfully'
        };
      } else {
        throw new Error(result.data.error || 'Failed to download invoice');
      }

    } catch (error) {
      console.error('Download invoice error:', error);
      throw error;
    }
  }

  // ===============================================
  // USAGE TRACKING
  // ===============================================

  async trackUsage(userId, usageType, amount = 1) {
    try {
      const userProfile = authService.getUserProfile();
      const limits = userProfile.limits || this.subscriptionTiers.basic.limits;

      // Check if usage exceeds limits
      const currentUsage = await this.getCurrentUsage(userId);
      
      let canProceed = true;
      let limitExceeded = null;

      switch (usageType) {
        case 'scan':
          if (limits.scansPerMonth !== -1 && currentUsage.scans >= limits.scansPerMonth) {
            canProceed = false;
            limitExceeded = 'Monthly scan limit exceeded';
          }
          break;
        case 'api_call':
          if (currentUsage.apiCallsThisHour >= limits.apiCallsPerHour) {
            canProceed = false;
            limitExceeded = 'Hourly API call limit exceeded';
          }
          break;
      }

      if (!canProceed) {
        return {
          success: false,
          error: limitExceeded,
          upgrade: true
        };
      }

      // Track usage
      await updateDoc(doc(db, 'users', userId), {
        [`usage.${usageType}`]: increment(amount),
        lastActivity: serverTimestamp()
      });

      return {
        success: true,
        remainingUsage: this.calculateRemainingUsage(currentUsage, limits)
      };

    } catch (error) {
      console.error('Usage tracking error:', error);
      throw error;
    }
  }

  async getCurrentUsage(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      return {
        scans: userData.usage?.scan || 0,
        apiCallsThisHour: userData.usage?.api_call_hour || 0,
        storage: userData.usage?.storage || 0
      };

    } catch (error) {
      console.error('Get current usage error:', error);
      return { scans: 0, apiCallsThisHour: 0, storage: 0 };
    }
  }

  calculateRemainingUsage(currentUsage, limits) {
    return {
      scans: limits.scansPerMonth === -1 ? -1 : Math.max(0, limits.scansPerMonth - currentUsage.scans),
      apiCalls: Math.max(0, limits.apiCallsPerHour - currentUsage.apiCallsThisHour),
      storage: Math.max(0, limits.storageGB - currentUsage.storage)
    };
  }

  // ===============================================
  // HELPER METHODS
  // ===============================================

  async getUserPaymentHistory(userId) {
    try {
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await paymentsQuery.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('Get payment history error:', error);
      return [];
    }
  }

  async getRecentTransactions(userId, since) {
    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('timestamp', '>=', since),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await transactionsQuery.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('Get recent transactions error:', error);
      return [];
    }
  }

  async getUserKnownDevices(userId) {
    try {
      const devicesDoc = await getDoc(doc(db, 'userDevices', userId));
      return devicesDoc.exists() ? devicesDoc.data().devices || [] : [];
    } catch (error) {
      return [];
    }
  }

  async getUserPaymentMethods(userId) {
    try {
      const methodsDoc = await getDoc(doc(db, 'userPaymentMethods', userId));
      return methodsDoc.exists() ? methodsDoc.data().methods || [] : [];
    } catch (error) {
      return [];
    }
  }

  async isVPNOrProxy(ipAddress) {
    // Simplified VPN/Proxy detection
    const vpnRanges = ['10.', '192.168.', '172.'];
    return vpnRanges.some(range => ipAddress.startsWith(range));
  }

  isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true;
    
    const suspiciousPatterns = [
      'bot', 'crawler', 'spider', 'scraper',
      'curl', 'wget', 'python', 'java'
    ];
    
    return suspiciousPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern)
    );
  }

  async getUserTypicalLocation(userId) {
    try {
      const locationDoc = await getDoc(doc(db, 'userLocations', userId));
      return locationDoc.exists() ? locationDoc.data().typical : null;
    } catch (error) {
      return null;
    }
  }

  async getIPLocation(ipAddress) {
    try {
      // In production, use a real IP geolocation service
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const data = await response.json();
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        country: data.country_code
      };
    } catch (error) {
      return null;
    }
  }

  calculateDistance(location1, location2) {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(location2.latitude - location1.latitude);
    const dLon = this.toRadians(location2.longitude - location1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(location1.latitude)) * 
              Math.cos(this.toRadians(location2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  isHighRiskBIN(bin) {
    // Simplified high-risk BIN check
    const highRiskBins = ['4000', '4001', '4002'];
    return highRiskBins.some(riskBin => bin?.startsWith(riskBin));
  }

  async storeFraudCheck(fraudData) {
    try {
      await addDoc(collection(db, 'fraudChecks'), {
        ...fraudData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Store fraud check error:', error);
    }
  }

  async trackPaymentEvent(event, data) {
    try {
      await addDoc(collection(db, 'paymentEvents'), {
        event,
        ...data,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Track payment event error:', error);
    }
  }

  // ===============================================
  // PUBLIC API
  // ===============================================

  getSubscriptionTiers() {
    return this.subscriptionTiers;
  }

  getCurrentTier(userId) {
    const userProfile = authService.getUserProfile();
    return userProfile?.subscriptionTier || 'basic';
  }

  canUpgrade(currentTier) {
    const tiers = Object.keys(this.subscriptionTiers);
    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1;
  }

  getUpgradeOptions(currentTier) {
    const tiers = Object.keys(this.subscriptionTiers);
    const currentIndex = tiers.indexOf(currentTier);
    
    return tiers.slice(currentIndex + 1).map(tierId => ({
      id: tierId,
      ...this.subscriptionTiers[tierId]
    }));
  }
}

// Singleton instance
const paymentService = new PaymentService();

export default paymentService;

// React hook for payment integration
export const usePayment = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const createSubscription = async (tierId, paymentMethodId) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = authService.getCurrentUser();
      const result = await paymentService.createSubscription(user.uid, tierId, paymentMethodId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (paymentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = authService.getCurrentUser();
      const result = await paymentService.processOneTimePayment({
        ...paymentData,
        userId: user.uid
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createSubscription,
    processPayment,
    subscriptionTiers: paymentService.getSubscriptionTiers(),
    trackUsage: paymentService.trackUsage.bind(paymentService)
  };
};
