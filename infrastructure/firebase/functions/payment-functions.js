/**
 * Firebase Cloud Functions for Payment Processing
 * Stripe integration with advanced fraud detection and security
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ===============================================
// STRIPE CUSTOMER MANAGEMENT
// ===============================================

exports.createStripeCustomer = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { email, name, userId } = data;

    // Check if customer already exists
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData.stripeCustomerId) {
      return {
        success: true,
        customerId: userData.stripeCustomerId,
        message: 'Customer already exists'
      };
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        firebaseUID: userId
      }
    });

    // Update user document with Stripe customer ID
    await db.collection('users').doc(userId).update({
      stripeCustomerId: customer.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      customerId: customer.id,
      message: 'Customer created successfully'
    };

  } catch (error) {
    console.error('Create Stripe customer error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===============================================
// SUBSCRIPTION MANAGEMENT
// ===============================================

exports.createSubscription = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, priceId, paymentMethodId, fraudScore } = data;

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData.stripeCustomerId) {
      throw new functions.https.HttpsError('failed-precondition', 'No Stripe customer found');
    }

    // Fraud check - block high-risk transactions
    if (fraudScore > 80) {
      await logSecurityEvent({
        type: 'subscription_blocked',
        userId,
        reason: 'High fraud score',
        fraudScore,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      throw new functions.https.HttpsError('permission-denied', 'Transaction blocked for security reasons');
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: userData.stripeCustomerId
    });

    // Set as default payment method
    await stripe.customers.update(userData.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: userData.stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        firebaseUID: userId,
        fraudScore: fraudScore.toString()
      }
    });

    // Store subscription in Firestore
    await db.collection('subscriptions').doc(subscription.id).set({
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: userData.stripeCustomerId,
      priceId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      fraudScore
    });

    // Log subscription event
    await logPaymentEvent({
      type: 'subscription_created',
      userId,
      subscriptionId: subscription.id,
      amount: subscription.items.data[0].price.unit_amount / 100,
      currency: subscription.items.data[0].price.currency,
      fraudScore
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      status: subscription.status
    };

  } catch (error) {
    console.error('Create subscription error:', error);
    
    // Log failed subscription attempt
    await logPaymentEvent({
      type: 'subscription_failed',
      userId: data.userId,
      error: error.message,
      fraudScore: data.fraudScore
    });

    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.cancelSubscription = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { subscriptionId } = data;
    const userId = context.auth.uid;

    // Verify subscription ownership
    const subscriptionDoc = await db.collection('subscriptions').doc(subscriptionId).get();
    const subscriptionData = subscriptionDoc.data();

    if (!subscriptionData || subscriptionData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Subscription not found or access denied');
    }

    // Cancel subscription in Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    // Update subscription in Firestore
    await db.collection('subscriptions').doc(subscriptionId).update({
      status: subscription.status,
      cancelAtPeriodEnd: true,
      canceledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log cancellation event
    await logPaymentEvent({
      type: 'subscription_cancelled',
      userId,
      subscriptionId
    });

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    };

  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.updateSubscription = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { subscriptionId, newPriceId } = data;
    const userId = context.auth.uid;

    // Verify subscription ownership
    const subscriptionDoc = await db.collection('subscriptions').doc(subscriptionId).get();
    const subscriptionData = subscriptionDoc.data();

    if (!subscriptionData || subscriptionData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Subscription not found or access denied');
    }

    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update subscription
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId
      }],
      proration_behavior: 'create_prorations'
    });

    // Update subscription in Firestore
    await db.collection('subscriptions').doc(subscriptionId).update({
      priceId: newPriceId,
      status: updatedSubscription.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log update event
    await logPaymentEvent({
      type: 'subscription_updated',
      userId,
      subscriptionId,
      oldPriceId: subscriptionData.priceId,
      newPriceId
    });

    return {
      success: true,
      message: 'Subscription updated successfully',
      subscription: updatedSubscription
    };

  } catch (error) {
    console.error('Update subscription error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===============================================
// ONE-TIME PAYMENTS
// ===============================================

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount, currency, description, userId, fraudScore } = data;

    // Fraud check
    if (fraudScore > 80) {
      await logSecurityEvent({
        type: 'payment_blocked',
        userId,
        reason: 'High fraud score',
        fraudScore,
        amount: amount / 100,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      throw new functions.https.HttpsError('permission-denied', 'Payment blocked for security reasons');
    }

    // Get or create Stripe customer
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.displayName,
        metadata: { firebaseUID: userId }
      });

      customerId = customer.id;

      await db.collection('users').doc(userId).update({
        stripeCustomerId: customerId
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      description,
      metadata: {
        firebaseUID: userId,
        fraudScore: fraudScore.toString()
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Store payment intent in Firestore
    await db.collection('paymentIntents').doc(paymentIntent.id).set({
      userId,
      stripePaymentIntentId: paymentIntent.id,
      amount: amount / 100,
      currency,
      description,
      status: paymentIntent.status,
      fraudScore,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };

  } catch (error) {
    console.error('Create payment intent error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===============================================
// PAYMENT METHOD MANAGEMENT
// ===============================================

exports.attachPaymentMethod = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { paymentMethodId, userId } = data;

    // Get user's Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData.stripeCustomerId) {
      throw new functions.https.HttpsError('failed-precondition', 'No Stripe customer found');
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: userData.stripeCustomerId
    });

    // Store payment method reference
    await db.collection('userPaymentMethods').doc(userId).set({
      methods: admin.firestore.FieldValue.arrayUnion(paymentMethodId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return {
      success: true,
      message: 'Payment method attached successfully'
    };

  } catch (error) {
    console.error('Attach payment method error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.detachPaymentMethod = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { paymentMethodId, userId } = data;

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);

    // Remove payment method reference
    await db.collection('userPaymentMethods').doc(userId).update({
      methods: admin.firestore.FieldValue.arrayRemove(paymentMethodId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'Payment method removed successfully'
    };

  } catch (error) {
    console.error('Detach payment method error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.getPaymentMethods = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId } = data;

    // Get user's Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData.stripeCustomerId) {
      return {
        success: true,
        paymentMethods: []
      };
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: userData.stripeCustomerId,
      type: 'card'
    });

    return {
      success: true,
      paymentMethods: paymentMethods.data
    };

  } catch (error) {
    console.error('Get payment methods error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.getPaymentMethodDetails = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { paymentMethodId } = data;

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    return {
      success: true,
      paymentMethod
    };

  } catch (error) {
    console.error('Get payment method details error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===============================================
// WEBHOOKS
// ===============================================

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).send('Webhook handler failed');
  }
});

// ===============================================
// WEBHOOK HANDLERS
// ===============================================

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const userId = paymentIntent.metadata.firebaseUID;

    // Update payment intent status
    await db.collection('paymentIntents').doc(paymentIntent.id).update({
      status: 'succeeded',
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log successful payment
    await logPaymentEvent({
      type: 'payment_succeeded',
      userId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });

    // Update user statistics
    await db.collection('users').doc(userId).update({
      'stats.totalPaid': admin.firestore.FieldValue.increment(paymentIntent.amount / 100),
      'stats.successfulPayments': admin.firestore.FieldValue.increment(1)
    });

  } catch (error) {
    console.error('Handle payment intent succeeded error:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const userId = paymentIntent.metadata.firebaseUID;

    // Update payment intent status
    await db.collection('paymentIntents').doc(paymentIntent.id).update({
      status: 'failed',
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      failureReason: paymentIntent.last_payment_error?.message
    });

    // Log failed payment
    await logPaymentEvent({
      type: 'payment_failed',
      userId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      error: paymentIntent.last_payment_error?.message
    });

    // Update user statistics
    await db.collection('users').doc(userId).update({
      'stats.failedPayments': admin.firestore.FieldValue.increment(1)
    });

  } catch (error) {
    console.error('Handle payment intent failed error:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.firebaseUID;

    // Update subscription status
    await db.collection('subscriptions').doc(subscription.id).update({
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log successful subscription payment
    await logPaymentEvent({
      type: 'subscription_payment_succeeded',
      userId,
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency
    });

  } catch (error) {
    console.error('Handle invoice payment succeeded error:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.firebaseUID;

    // Log failed subscription payment
    await logPaymentEvent({
      type: 'subscription_payment_failed',
      userId,
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency
    });

    // Check if subscription should be suspended
    if (invoice.attempt_count >= 3) {
      await db.collection('subscriptions').doc(subscription.id).update({
        status: 'past_due',
        suspendedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Downgrade user to basic tier
      await db.collection('users').doc(userId).update({
        subscriptionTier: 'basic',
        subscriptionStatus: 'past_due'
      });
    }

  } catch (error) {
    console.error('Handle invoice payment failed error:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    const userId = subscription.metadata.firebaseUID;

    // Update subscription in Firestore
    await db.collection('subscriptions').doc(subscription.id).update({
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user subscription status
    await db.collection('users').doc(userId).update({
      subscriptionStatus: subscription.status
    });

  } catch (error) {
    console.error('Handle subscription updated error:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const userId = subscription.metadata.firebaseUID;

    // Update subscription status
    await db.collection('subscriptions').doc(subscription.id).update({
      status: 'canceled',
      canceledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Downgrade user to basic tier
    await db.collection('users').doc(userId).update({
      subscriptionTier: 'basic',
      subscriptionStatus: 'canceled'
    });

    // Log subscription deletion
    await logPaymentEvent({
      type: 'subscription_deleted',
      userId,
      subscriptionId: subscription.id
    });

  } catch (error) {
    console.error('Handle subscription deleted error:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod) {
  try {
    // Log payment method attachment
    await logPaymentEvent({
      type: 'payment_method_attached',
      customerId: paymentMethod.customer,
      paymentMethodId: paymentMethod.id,
      cardBrand: paymentMethod.card?.brand,
      cardLast4: paymentMethod.card?.last4
    });

  } catch (error) {
    console.error('Handle payment method attached error:', error);
  }
}

// ===============================================
// BILLING AND INVOICES
// ===============================================

exports.downloadInvoice = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { invoiceId } = data;

    // Get invoice from Stripe
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Verify user has access to this invoice
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.firebaseUID;

    if (userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }

    return {
      success: true,
      downloadUrl: invoice.invoice_pdf,
      invoiceNumber: invoice.number
    };

  } catch (error) {
    console.error('Download invoice error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

async function logPaymentEvent(eventData) {
  try {
    await db.collection('paymentEvents').add({
      ...eventData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Log payment event error:', error);
  }
}

async function logSecurityEvent(eventData) {
  try {
    await db.collection('securityEvents').add({
      ...eventData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Log security event error:', error);
  }
}

// ===============================================
// FRAUD DETECTION FUNCTIONS
// ===============================================

exports.checkTransactionFraud = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount, paymentMethodId, userId, deviceInfo } = data;

    let riskScore = 0;
    const riskFactors = [];

    // Check transaction amount
    if (amount > 1000) {
      riskScore += 20;
      riskFactors.push('High transaction amount');
    }

    // Check user history
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      riskScore += 30;
      riskFactors.push('User not found');
    } else {
      // Check account age
      const accountAge = Date.now() - userData.createdAt.toDate().getTime();
      const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

      if (daysSinceCreation < 1) {
        riskScore += 25;
        riskFactors.push('Very new account');
      }

      // Check email verification
      if (!userData.emailVerified) {
        riskScore += 15;
        riskFactors.push('Email not verified');
      }
    }

    // Check recent failed transactions
    const recentFailures = await db.collection('paymentEvents')
      .where('userId', '==', userId)
      .where('type', '==', 'payment_failed')
      .where('timestamp', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .get();

    if (recentFailures.size > 2) {
      riskScore += 20;
      riskFactors.push('Multiple recent failed payments');
    }

    // Device analysis
    if (deviceInfo) {
      if (deviceInfo.isVPN) {
        riskScore += 15;
        riskFactors.push('VPN detected');
      }

      if (deviceInfo.isNewDevice) {
        riskScore += 10;
        riskFactors.push('New device');
      }
    }

    // Normalize score
    riskScore = Math.min(100, riskScore);

    return {
      success: true,
      riskScore,
      riskFactors,
      recommendation: riskScore > 70 ? 'decline' : riskScore > 40 ? 'verify' : 'approve'
    };

  } catch (error) {
    console.error('Check transaction fraud error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===============================================
// USAGE TRACKING
// ===============================================

exports.trackUsage = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, usageType, amount = 1 } = data;

    // Get user's current usage and limits
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const limits = userData.limits || {
      scansPerMonth: 10,
      apiCallsPerHour: 100,
      storageGB: 1
    };

    // Check current usage
    const currentUsage = userData.usage || {};
    
    let canProceed = true;
    let limitExceeded = null;

    switch (usageType) {
      case 'scan':
        const currentScans = currentUsage.scans || 0;
        if (limits.scansPerMonth !== -1 && currentScans >= limits.scansPerMonth) {
          canProceed = false;
          limitExceeded = 'Monthly scan limit exceeded';
        }
        break;

      case 'api_call':
        const currentApiCalls = currentUsage.apiCallsThisHour || 0;
        if (currentApiCalls >= limits.apiCallsPerHour) {
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

    // Update usage
    const updateData = {};
    updateData[`usage.${usageType}`] = admin.firestore.FieldValue.increment(amount);
    updateData.lastActivity = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('users').doc(userId).update(updateData);

    // Calculate remaining usage
    const newUsage = (currentUsage[usageType] || 0) + amount;
    const remaining = limits[`${usageType}PerMonth`] === -1 ? -1 : 
                     Math.max(0, limits[`${usageType}PerMonth`] - newUsage);

    return {
      success: true,
      remainingUsage: remaining,
      currentUsage: newUsage
    };

  } catch (error) {
    console.error('Track usage error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Reset hourly usage counters
exports.resetHourlyUsage = functions.pubsub.schedule('0 * * * *').onRun(async (context) => {
  try {
    const batch = db.batch();
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    usersSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        'usage.apiCallsThisHour': 0
      });
    });

    await batch.commit();
    console.log('Hourly usage counters reset successfully');

  } catch (error) {
    console.error('Reset hourly usage error:', error);
  }
});

// Reset monthly usage counters
exports.resetMonthlyUsage = functions.pubsub.schedule('0 0 1 * *').onRun(async (context) => {
  try {
    const batch = db.batch();
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    usersSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        'usage.scans': 0,
        'usage.storage': 0
      });
    });

    await batch.commit();
    console.log('Monthly usage counters reset successfully');

  } catch (error) {
    console.error('Reset monthly usage error:', error);
  }
});
