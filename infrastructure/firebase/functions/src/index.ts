/**
 * Firebase Cloud Functions for SNN/ANN Edge Security System
 * Real-time notifications, authentication, and analytics integration
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
const pubsub = new PubSub();

// Sync user data between Firebase Auth and Cloudflare D1
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    // Create user profile in Firestore
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName,
      role: 'security_analyst',
      permissions: ['view_dashboard', 'view_threats', 'acknowledge_alerts'],
      deviceAccess: [], // Will be populated by admin
      preferences: {
        emailAlerts: true,
        pushNotifications: true,
        alertThreshold: 'medium',
        dashboardRefresh: 30 // seconds
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    // Sync with Cloudflare D1 via edge API
    const response = await fetch('https://api.snn-ann-security.app/internal/user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${functions.config().cloudflare.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: user.uid,
        email: user.email,
        role: 'security_analyst',
        createdAt: Date.now()
      }),
    });

    if (!response.ok) {
      console.error('Failed to sync user with Cloudflare D1:', await response.text());
    }

    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'security_analyst',
      permissions: ['view_dashboard', 'view_threats', 'acknowledge_alerts'],
    });

    // Send welcome email with security dashboard access
    if (user.email) {
      await sendWelcomeEmail(user.email, user.displayName || 'Security Analyst');
    }

    // Track user creation in analytics
    await logAnalyticsEvent('user_created', {
      userId: user.uid,
      email: user.email,
      authMethod: user.providerData[0]?.providerId || 'email',
    });

    console.log(`User created successfully: ${user.uid}`);
  } catch (error) {
    console.error('Error in onUserCreated:', error);
    throw error;
  }
});

// Real-time threat alert processing
export const onThreatDetected = functions.firestore
  .document('threats/{threatId}')
  .onCreate(async (snap, context) => {
    const threat = snap.data();
    const threatId = context.params.threatId;

    try {
      // Determine alert severity and recipients
      const alertLevel = determineAlertLevel(threat);
      const recipients = await getAlertRecipients(threat.deviceId, alertLevel);

      // Send push notifications
      if (recipients.length > 0) {
        const notifications = recipients.map(user => ({
          token: user.fcmToken,
          notification: {
            title: `🚨 ${alertLevel.toUpperCase()} Threat Detected`,
            body: `${threat.threatType} detected on ${threat.deviceName}`,
            icon: '/icons/threat-alert.png',
          },
          data: {
            type: 'threat_alert',
            threatId,
            deviceId: threat.deviceId,
            severity: alertLevel,
            threatType: threat.threatType,
            timestamp: threat.timestamp.toString(),
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'security_alerts',
              priority: 'high',
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                category: 'SECURITY_ALERT',
              },
            },
          },
        }));

        const results = await messaging.sendAll(notifications);
        console.log(`Sent ${results.successCount} threat notifications`);
      }

      // Send email alerts for critical threats
      if (alertLevel === 'critical') {
        await sendCriticalThreatEmail(recipients, threat);
      }

      // Update incident in Cloudflare D1
      await updateIncidentInD1(threatId, threat);

      // Trigger automated response if configured
      if (threat.autoResponse && alertLevel === 'critical') {
        await triggerAutomatedResponse(threat);
      }

      // Log alert in analytics
      await logAnalyticsEvent('threat_alert_sent', {
        threatId,
        alertLevel,
        recipientCount: recipients.length,
        threatType: threat.threatType,
        deviceId: threat.deviceId,
      });

    } catch (error) {
      console.error('Error processing threat alert:', error);
      throw error;
    }
  });

// Real-time system health monitoring
export const onSystemHealthUpdate = functions.firestore
  .document('system_health/{metricId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const metricId = context.params.metricId;

    try {
      // Check for performance degradation
      if (after.avgProcessingTime > before.avgProcessingTime * 1.5) {
        await sendPerformanceAlert('processing_time_degraded', {
          metric: 'avgProcessingTime',
          before: before.avgProcessingTime,
          after: after.avgProcessingTime,
          increase: ((after.avgProcessingTime - before.avgProcessingTime) / before.avgProcessingTime * 100).toFixed(2)
        });
      }

      // Check for high error rates
      if (after.errorRate > 0.05 && after.errorRate > before.errorRate * 2) {
        await sendPerformanceAlert('error_rate_spike', {
          metric: 'errorRate',
          before: before.errorRate,
          after: after.errorRate,
          errorRate: (after.errorRate * 100).toFixed(2)
        });
      }

      // Check for cache hit rate degradation
      if (after.cacheHitRate < 0.7 && after.cacheHitRate < before.cacheHitRate * 0.8) {
        await sendPerformanceAlert('cache_performance_degraded', {
          metric: 'cacheHitRate',
          before: before.cacheHitRate,
          after: after.cacheHitRate,
          hitRate: (after.cacheHitRate * 100).toFixed(2)
        });
      }

      // Update system health in Cloudflare D1
      await updateSystemHealthInD1(metricId, after);

    } catch (error) {
      console.error('Error processing system health update:', error);
    }
  });

// Scheduled daily security report
export const generateDailySecurityReport = functions.pubsub
  .schedule('every day 08:00')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      // Get daily security metrics from Cloudflare D1
      const metrics = await getDailySecurityMetrics();
      
      // Generate report
      const report = await generateSecurityReport(metrics);
      
      // Get report recipients
      const recipients = await getReportRecipients();
      
      // Send email reports
      for (const recipient of recipients) {
        await sendDailySecurityReport(recipient.email, report);
      }
      
      // Store report in Firestore
      await db.collection('security_reports').add({
        ...report,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        type: 'daily'
      });
      
      console.log(`Daily security report generated and sent to ${recipients.length} recipients`);
      
    } catch (error) {
      console.error('Error generating daily security report:', error);
    }
  });

// Real-time dashboard data sync
export const syncDashboardData = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    try {
      // Get latest metrics from Cloudflare D1
      const metrics = await getLatestMetrics();
      
      // Update Firestore for real-time dashboard
      await db.collection('dashboard_metrics').doc('current').set({
        ...metrics,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Trigger real-time updates to connected clients
      await pubsub.topic('dashboard-updates').publishMessage({
        data: Buffer.from(JSON.stringify(metrics)),
        attributes: {
          type: 'metrics_update',
          timestamp: Date.now().toString()
        }
      });
      
    } catch (error) {
      console.error('Error syncing dashboard data:', error);
    }
  });

// Device status change notifications
export const onDeviceStatusChange = functions.firestore
  .document('devices/{deviceId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const deviceId = context.params.deviceId;

    try {
      // Check for status changes
      if (before.status !== after.status) {
        const statusChange = {
          deviceId,
          deviceName: after.name,
          oldStatus: before.status,
          newStatus: after.status,
          timestamp: Date.now()
        };

        // Send notifications for critical status changes
        if (after.status === 'offline' || after.status === 'quarantined') {
          const recipients = await getDeviceAlertRecipients(deviceId);
          
          const notifications = recipients.map(user => ({
            token: user.fcmToken,
            notification: {
              title: `Device Status Change`,
              body: `${after.name} is now ${after.status}`,
            },
            data: {
              type: 'device_status_change',
              deviceId,
              status: after.status,
            },
          }));

          await messaging.sendAll(notifications);
        }

        // Log status change
        await logAnalyticsEvent('device_status_change', statusChange);
      }

      // Check for threat level changes
      if (before.threatLevel !== after.threatLevel) {
        await handleThreatLevelChange(deviceId, before.threatLevel, after.threatLevel);
      }

    } catch (error) {
      console.error('Error processing device status change:', error);
    }
  });

// Utility functions
async function determineAlertLevel(threat: any): Promise<string> {
  if (threat.snnScore > 0.9 || threat.annScore > 0.9) return 'critical';
  if (threat.snnScore > 0.7 || threat.annScore > 0.7) return 'high';
  if (threat.snnScore > 0.5 || threat.annScore > 0.5) return 'medium';
  return 'low';
}

async function getAlertRecipients(deviceId: string, alertLevel: string): Promise<any[]> {
  const usersSnapshot = await db.collection('users')
    .where('deviceAccess', 'array-contains', deviceId)
    .where('preferences.alertThreshold', '<=', alertLevel)
    .where('preferences.pushNotifications', '==', true)
    .get();

  return usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function sendWelcomeEmail(email: string, displayName: string): Promise<void> {
  // Implementation would use SendGrid, Mailgun, or similar service
  console.log(`Sending welcome email to ${email}`);
}

async function sendCriticalThreatEmail(recipients: any[], threat: any): Promise<void> {
  // Implementation would send detailed threat information via email
  console.log(`Sending critical threat email to ${recipients.length} recipients`);
}

async function updateIncidentInD1(threatId: string, threat: any): Promise<void> {
  try {
    await fetch('https://api.snn-ann-security.app/internal/incident', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${functions.config().cloudflare.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threatId,
        deviceId: threat.deviceId,
        severity: threat.severity,
        threatType: threat.threatType,
        timestamp: threat.timestamp
      }),
    });
  } catch (error) {
    console.error('Failed to update incident in D1:', error);
  }
}

async function triggerAutomatedResponse(threat: any): Promise<void> {
  // Trigger automated response actions
  console.log(`Triggering automated response for threat: ${threat.threatType}`);
}

async function sendPerformanceAlert(type: string, data: any): Promise<void> {
  const adminUsers = await db.collection('users')
    .where('role', '==', 'admin')
    .where('preferences.pushNotifications', '==', true)
    .get();

  const notifications = adminUsers.docs.map(doc => {
    const user = doc.data();
    return {
      token: user.fcmToken,
      notification: {
        title: '⚠️ System Performance Alert',
        body: `${type.replace(/_/g, ' ').toUpperCase()}: ${data.metric}`,
      },
      data: {
        type: 'performance_alert',
        alertType: type,
        ...data,
      },
    };
  });

  if (notifications.length > 0) {
    await messaging.sendAll(notifications);
  }
}

async function updateSystemHealthInD1(metricId: string, metrics: any): Promise<void> {
  try {
    await fetch('https://api.snn-ann-security.app/internal/health', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${functions.config().cloudflare.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metricId, ...metrics }),
    });
  } catch (error) {
    console.error('Failed to update system health in D1:', error);
  }
}

async function getDailySecurityMetrics(): Promise<any> {
  try {
    const response = await fetch('https://api.snn-ann-security.app/analytics/daily', {
      headers: {
        'Authorization': `Bearer ${functions.config().cloudflare.api_key}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get daily metrics:', error);
    return {};
  }
}

async function generateSecurityReport(metrics: any): Promise<any> {
  return {
    summary: {
      totalDevices: metrics.totalDevices || 0,
      threatsDetected: metrics.threatsDetected || 0,
      threatsBlocked: metrics.threatsBlocked || 0,
      avgResponseTime: metrics.avgResponseTime || 0,
      systemUptime: metrics.systemUptime || 0,
    },
    topThreats: metrics.topThreats || [],
    performanceMetrics: metrics.performance || {},
    recommendations: generateRecommendations(metrics),
  };
}

function generateRecommendations(metrics: any): string[] {
  const recommendations = [];
  
  if (metrics.avgResponseTime > 2) {
    recommendations.push('Consider optimizing neural network models for better performance');
  }
  
  if (metrics.falsePositiveRate > 0.05) {
    recommendations.push('Review and retrain ANN model to reduce false positives');
  }
  
  if (metrics.cacheHitRate < 0.8) {
    recommendations.push('Optimize caching strategy for better performance');
  }
  
  return recommendations;
}

async function getReportRecipients(): Promise<any[]> {
  const snapshot = await db.collection('users')
    .where('preferences.emailAlerts', '==', true)
    .get();
  
  return snapshot.docs.map(doc => doc.data());
}

async function sendDailySecurityReport(email: string, report: any): Promise<void> {
  // Implementation would send formatted email report
  console.log(`Sending daily report to ${email}`);
}

async function getLatestMetrics(): Promise<any> {
  try {
    const response = await fetch('https://api.snn-ann-security.app/analytics/current', {
      headers: {
        'Authorization': `Bearer ${functions.config().cloudflare.api_key}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get latest metrics:', error);
    return {};
  }
}

async function getDeviceAlertRecipients(deviceId: string): Promise<any[]> {
  const snapshot = await db.collection('users')
    .where('deviceAccess', 'array-contains', deviceId)
    .where('preferences.pushNotifications', '==', true)
    .get();
  
  return snapshot.docs.map(doc => doc.data());
}

async function handleThreatLevelChange(deviceId: string, oldLevel: string, newLevel: string): Promise<void> {
  // Update rate limiting in Cloudflare Workers
  try {
    await fetch('https://api.snn-ann-security.app/internal/device-threat-level', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${functions.config().cloudflare.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId,
        threatLevel: newLevel
      }),
    });
  } catch (error) {
    console.error('Failed to update threat level in edge:', error);
  }
}

async function logAnalyticsEvent(eventName: string, parameters: any): Promise<void> {
  // Log to Firebase Analytics or custom analytics system
  console.log(`Analytics event: ${eventName}`, parameters);
}
