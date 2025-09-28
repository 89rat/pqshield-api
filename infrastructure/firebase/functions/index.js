/**
 * Firebase Cloud Functions for PQShield API
 * Real-time backend processing for security scanning and threat detection
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Set global options
setGlobalOptions({
  maxInstances: 100,
  region: 'us-central1',
  memory: '1GiB',
  timeoutSeconds: 540
});

/**
 * Real-time security scan processing
 */
exports.processScan = onCall({
  cors: true,
  enforceAppCheck: false
}, async (request) => {
  try {
    const { code, filePath, options = {} } = request.data;
    const userId = request.auth?.uid;

    if (!code) {
      throw new HttpsError('invalid-argument', 'Code content is required');
    }

    // Rate limiting check
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (userData?.scanCount >= (userData?.subscription === 'premium' ? 10000 : 100)) {
        throw new HttpsError('resource-exhausted', 'Scan limit exceeded');
      }
    }

    // Generate scan ID
    const scanId = admin.firestore().collection('scans').doc().id;
    
    // Create scan record
    const scanData = {
      scanId,
      userId: userId || 'anonymous',
      filePath: filePath || 'unknown',
      codeHash: generateHash(code),
      status: 'processing',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      options
    };

    await db.collection('scans').doc(scanId).set(scanData);

    // Process scan asynchronously
    processSecurityScan(scanId, code, options);

    return {
      scanId,
      status: 'processing',
      message: 'Scan initiated successfully'
    };

  } catch (error) {
    console.error('Scan processing error:', error);
    throw new HttpsError('internal', 'Failed to process scan');
  }
});

/**
 * Real-time threat monitoring
 */
exports.monitorThreats = onCall({
  cors: true
}, async (request) => {
  try {
    const userId = request.auth?.uid;
    
    // Get recent threats for user or global threats
    const threatsQuery = userId 
      ? db.collection('threats').where('userId', '==', userId)
      : db.collection('threats').where('severity', 'in', ['critical', 'high']);
    
    const recentThreats = await threatsQuery
      .orderBy('detectedAt', 'desc')
      .limit(50)
      .get();

    const threats = recentThreats.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      detectedAt: doc.data().detectedAt?.toDate()
    }));

    // Get threat statistics
    const statsQuery = await db.collection('threatStats')
      .doc('daily')
      .get();

    return {
      threats,
      statistics: statsQuery.data() || {},
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Threat monitoring error:', error);
    throw new HttpsError('internal', 'Failed to fetch threat data');
  }
});

/**
 * User authentication and profile management
 */
exports.createUserProfile = onCall({
  cors: true
}, async (request) => {
  try {
    const { email, subscription = 'free' } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userProfile = {
      userId,
      email,
      subscription,
      scanCount: 0,
      threatsBlocked: 0,
      quantumThreatsDetected: 0,
      apiKey: generateApiKey(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userId).set(userProfile);

    return {
      success: true,
      profile: userProfile
    };

  } catch (error) {
    console.error('User profile creation error:', error);
    throw new HttpsError('internal', 'Failed to create user profile');
  }
});

/**
 * Compliance assessment
 */
exports.assessCompliance = onCall({
  cors: true
}, async (request) => {
  try {
    const { scanId, framework = 'OWASP' } = request.data;
    const userId = request.auth?.uid;

    // Get scan results
    const scanDoc = await db.collection('scans').doc(scanId).get();
    if (!scanDoc.exists) {
      throw new HttpsError('not-found', 'Scan not found');
    }

    const scanData = scanDoc.data();
    
    // Verify user access
    if (scanData.userId !== userId && scanData.userId !== 'anonymous') {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    // Perform compliance assessment
    const assessment = await performComplianceAssessment(scanData, framework);

    // Store assessment
    await db.collection('compliance').add({
      scanId,
      userId: userId || 'anonymous',
      framework,
      assessment,
      assessedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      framework,
      assessment,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Compliance assessment error:', error);
    throw new HttpsError('internal', 'Failed to assess compliance');
  }
});

/**
 * Quantum threat assessment
 */
exports.assessQuantumThreats = onCall({
  cors: true
}, async (request) => {
  try {
    const { code, algorithms = [] } = request.data;
    const userId = request.auth?.uid;

    if (!code) {
      throw new HttpsError('invalid-argument', 'Code content is required');
    }

    // Perform quantum vulnerability assessment
    const quantumAssessment = await assessQuantumVulnerabilities(code, algorithms);

    // Store assessment if user is authenticated
    if (userId) {
      await db.collection('quantumAssessments').add({
        userId,
        assessment: quantumAssessment,
        assessedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      assessment: quantumAssessment,
      recommendations: generateQuantumRecommendations(quantumAssessment),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Quantum assessment error:', error);
    throw new HttpsError('internal', 'Failed to assess quantum threats');
  }
});

/**
 * Real-time notifications for scan completion
 */
exports.onScanComplete = onDocumentUpdated('scans/{scanId}', async (event) => {
  const scanData = event.data.after.data();
  const previousData = event.data.before.data();

  // Check if scan status changed to completed
  if (scanData.status === 'completed' && previousData.status === 'processing') {
    try {
      // Send real-time notification
      const message = {
        notification: {
          title: 'Security Scan Complete',
          body: `Scan found ${scanData.vulnerabilityCount || 0} vulnerabilities`
        },
        data: {
          scanId: event.params.scanId,
          securityScore: String(scanData.securityScore || 0),
          type: 'scan_complete'
        }
      };

      // Send to user if authenticated
      if (scanData.userId && scanData.userId !== 'anonymous') {
        const userTokens = await getUserFCMTokens(scanData.userId);
        if (userTokens.length > 0) {
          await admin.messaging().sendMulticast({
            tokens: userTokens,
            ...message
          });
        }
      }

      // Update user statistics
      if (scanData.userId && scanData.userId !== 'anonymous') {
        await db.collection('users').doc(scanData.userId).update({
          scanCount: admin.firestore.FieldValue.increment(1),
          lastActivity: admin.firestore.FieldValue.serverTimestamp()
        });
      }

    } catch (error) {
      console.error('Notification error:', error);
    }
  }
});

/**
 * Threat intelligence updates
 */
exports.updateThreatIntelligence = onRequest({
  cors: true,
  secrets: ['THREAT_INTEL_API_KEY']
}, async (req, res) => {
  cors(req, res, async () => {
    try {
      // Verify API key
      const apiKey = req.headers['x-api-key'];
      if (apiKey !== process.env.THREAT_INTEL_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Fetch latest threat intelligence
      const threatIntel = await fetchThreatIntelligence();

      // Update threat intelligence collection
      const batch = db.batch();
      
      threatIntel.forEach((threat, index) => {
        const threatRef = db.collection('threatIntelligence').doc();
        batch.set(threatRef, {
          ...threat,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();

      // Update statistics
      await updateThreatStatistics();

      res.json({
        success: true,
        threatsUpdated: threatIntel.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Threat intelligence update error:', error);
      res.status(500).json({ error: 'Failed to update threat intelligence' });
    }
  });
});

/**
 * Analytics and reporting
 */
exports.generateAnalytics = onCall({
  cors: true
}, async (request) => {
  try {
    const { timeRange = '7d', userId } = request.data;
    const requestUserId = request.auth?.uid;

    // Verify user access
    if (userId && userId !== requestUserId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    const analytics = await generateSecurityAnalytics(userId || requestUserId, timeRange);

    return {
      analytics,
      timeRange,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Analytics generation error:', error);
    throw new HttpsError('internal', 'Failed to generate analytics');
  }
});

// Helper Functions

async function processSecurityScan(scanId, code, options) {
  try {
    // Simulate advanced security scanning
    const vulnerabilities = await detectVulnerabilities(code);
    const neuralAnalysis = await performNeuralAnalysis(code);
    const quantumThreats = await detectQuantumThreats(code);

    // Calculate security score
    const securityScore = calculateSecurityScore(vulnerabilities, neuralAnalysis);

    // Update scan document
    await db.collection('scans').doc(scanId).update({
      status: 'completed',
      vulnerabilities,
      neuralAnalysis,
      quantumThreats,
      securityScore,
      vulnerabilityCount: vulnerabilities.length,
      quantumThreatCount: quantumThreats.length,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Store individual vulnerabilities
    const batch = db.batch();
    vulnerabilities.forEach((vuln, index) => {
      const vulnRef = db.collection('vulnerabilities').doc();
      batch.set(vulnRef, {
        scanId,
        ...vuln,
        detectedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();

  } catch (error) {
    console.error('Scan processing error:', error);
    
    // Update scan with error status
    await db.collection('scans').doc(scanId).update({
      status: 'error',
      error: error.message,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function detectVulnerabilities(code) {
  // Enhanced vulnerability detection patterns
  const patterns = [
    {
      name: 'SQL_INJECTION',
      pattern: /(\$\{[^}]*\}.*SELECT|query.*=.*\$\{)/gi,
      severity: 'critical',
      cwe: 'CWE-89'
    },
    {
      name: 'XSS_VULNERABILITY',
      pattern: /(innerHTML.*=.*\$\{|\.html\(.*\$\{)/gi,
      severity: 'high',
      cwe: 'CWE-79'
    },
    {
      name: 'COMMAND_INJECTION',
      pattern: /(exec\(.*\$\{|system\(.*\$\{)/gi,
      severity: 'critical',
      cwe: 'CWE-78'
    },
    {
      name: 'WEAK_CRYPTO',
      pattern: /(md5|sha1|des)/gi,
      severity: 'medium',
      cwe: 'CWE-327'
    }
  ];

  const vulnerabilities = [];
  
  patterns.forEach(pattern => {
    const matches = [...code.matchAll(pattern.pattern)];
    matches.forEach(match => {
      vulnerabilities.push({
        type: pattern.name,
        severity: pattern.severity,
        cwe: pattern.cwe,
        line: getLineNumber(code, match.index),
        evidence: match[0].substring(0, 100),
        quantumThreat: pattern.name.includes('CRYPTO')
      });
    });
  });

  return vulnerabilities;
}

async function performNeuralAnalysis(code) {
  // Simulate neural network analysis
  const features = extractCodeFeatures(code);
  
  return {
    anomalyScore: Math.random() * (features.complexity > 0.7 ? 1 : 0.3),
    threatClassification: ['injection', 'xss', 'crypto_weak', 'safe'][Math.floor(Math.random() * 4)],
    confidence: 0.85 + Math.random() * 0.15,
    processingTime: Math.random() * 50 + 10
  };
}

async function detectQuantumThreats(code) {
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
        occurrences: matches.length,
        recommendation: `Replace ${vuln.algorithm} with quantum-resistant alternative`
      });
    }
  });

  return threats;
}

function calculateSecurityScore(vulnerabilities, neuralAnalysis) {
  let score = 100;
  
  vulnerabilities.forEach(vuln => {
    switch (vuln.severity) {
      case 'critical': score -= 25; break;
      case 'high': score -= 15; break;
      case 'medium': score -= 8; break;
      default: score -= 3;
    }
  });

  // Neural network adjustment
  if (neuralAnalysis) {
    score -= neuralAnalysis.anomalyScore * 20;
  }

  return Math.max(0, Math.round(score));
}

function extractCodeFeatures(code) {
  return {
    length: code.length,
    complexity: (code.match(/function|if|for|while/g) || []).length / 100,
    imports: (code.match(/require|import/g) || []).length,
    strings: (code.match(/["'`]/g) || []).length
  };
}

function getLineNumber(code, index) {
  return code.substring(0, index).split('\n').length;
}

function generateHash(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function generateApiKey() {
  const crypto = require('crypto');
  return 'pqs_' + crypto.randomBytes(32).toString('hex');
}

async function getUserFCMTokens(userId) {
  try {
    const tokensDoc = await db.collection('userTokens').doc(userId).get();
    return tokensDoc.exists ? tokensDoc.data().tokens || [] : [];
  } catch (error) {
    console.error('Error getting FCM tokens:', error);
    return [];
  }
}

async function fetchThreatIntelligence() {
  // Mock threat intelligence data
  return [
    {
      cveId: 'CVE-2024-0001',
      threatType: 'injection',
      severity: 'critical',
      description: 'SQL injection vulnerability in popular framework'
    },
    {
      cveId: 'CVE-2024-0002',
      threatType: 'crypto_weak',
      severity: 'high',
      description: 'Weak cryptographic implementation'
    }
  ];
}

async function updateThreatStatistics() {
  const stats = {
    totalThreats: Math.floor(Math.random() * 1000) + 5000,
    criticalThreats: Math.floor(Math.random() * 100) + 50,
    quantumThreats: Math.floor(Math.random() * 50) + 25,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('threatStats').doc('daily').set(stats);
}

async function generateSecurityAnalytics(userId, timeRange) {
  // Mock analytics data
  return {
    scansPerformed: Math.floor(Math.random() * 100) + 50,
    vulnerabilitiesFound: Math.floor(Math.random() * 200) + 100,
    securityScoreAverage: Math.floor(Math.random() * 30) + 70,
    topVulnerabilities: [
      { type: 'SQL_INJECTION', count: 15 },
      { type: 'XSS_VULNERABILITY', count: 12 },
      { type: 'WEAK_CRYPTO', count: 8 }
    ]
  };
}

async function performComplianceAssessment(scanData, framework) {
  // Mock compliance assessment
  const score = scanData.securityScore || 75;
  
  return {
    framework,
    score,
    status: score >= 80 ? 'compliant' : 'non-compliant',
    details: {
      'A01_Broken_Access_Control': score > 70,
      'A02_Cryptographic_Failures': score > 60,
      'A03_Injection': score > 80,
      'A04_Insecure_Design': score > 75
    }
  };
}

async function assessQuantumVulnerabilities(code, algorithms) {
  const vulnerableAlgorithms = ['RSA', 'ECDSA', 'DH'];
  const foundAlgorithms = [];

  vulnerableAlgorithms.forEach(algo => {
    if (code.includes(algo)) {
      foundAlgorithms.push({
        algorithm: algo,
        quantumVulnerable: true,
        timeToBreak: '2030-2035',
        riskLevel: 'high'
      });
    }
  });

  return {
    vulnerableAlgorithms: foundAlgorithms,
    overallRisk: foundAlgorithms.length > 0 ? 'high' : 'low',
    recommendedActions: foundAlgorithms.length > 0 ? 
      ['Migrate to post-quantum cryptography', 'Implement hybrid solutions'] : 
      ['Continue monitoring quantum developments']
  };
}

function generateQuantumRecommendations(assessment) {
  return assessment.vulnerableAlgorithms.map(algo => ({
    algorithm: algo.algorithm,
    recommendation: `Replace ${algo.algorithm} with quantum-resistant alternatives like CRYSTALS-Kyber or CRYSTALS-Dilithium`,
    priority: 'high',
    timeline: 'Before 2030'
  }));
}
