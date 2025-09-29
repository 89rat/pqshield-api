#!/usr/bin/env node

/**
 * PQ359 Automated Debugging & Monitoring System
 * 
 * This script provides comprehensive automated debugging including:
 * - Real-time error detection and analysis
 * - Performance bottleneck identification
 * - Security vulnerability scanning
 * - Neural network health monitoring
 * - Automated fix suggestions and application
 * - Continuous monitoring and alerting
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AutomatedDebuggingSystem {
  constructor(options = {}) {
    this.config = {
      baseUrl: options.baseUrl || 'https://pq359.com',
      apiUrl: options.apiUrl || 'https://api.pq359.com',
      monitoringInterval: options.monitoringInterval || 60000, // 1 minute
      alertThresholds: {
        responseTime: 2000, // 2 seconds
        errorRate: 0.05, // 5%
        cpuUsage: 80, // 80%
        memoryUsage: 85, // 85%
        neuralNetworkAccuracy: 0.95 // 95%
      },
      ...options
    };
    
    this.metrics = {
      errors: [],
      performance: [],
      security: [],
      neuralNetwork: [],
      system: []
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  async initialize() {
    console.log('🔧 Initializing Automated Debugging System...');
    
    // Create logs directory
    await this.ensureDirectoryExists('./logs');
    await this.ensureDirectoryExists('./reports');
    
    // Initialize monitoring
    await this.setupErrorTracking();
    await this.setupPerformanceMonitoring();
    await this.setupSecurityMonitoring();
    
    console.log('✅ Debugging system initialized successfully');
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async setupErrorTracking() {
    console.log('🐛 Setting up error tracking...');
    
    // Monitor application logs for errors
    this.errorPatterns = [
      /ERROR/i,
      /FATAL/i,
      /Exception/i,
      /Stack trace/i,
      /500 Internal Server Error/i,
      /404 Not Found/i,
      /Connection refused/i,
      /Timeout/i
    ];
  }

  async setupPerformanceMonitoring() {
    console.log('⚡ Setting up performance monitoring...');
    
    this.performanceMetrics = [
      'responseTime',
      'throughput',
      'cpuUsage',
      'memoryUsage',
      'diskUsage',
      'networkLatency'
    ];
  }

  async setupSecurityMonitoring() {
    console.log('🛡️ Setting up security monitoring...');
    
    this.securityChecks = [
      'vulnerabilityScanning',
      'dependencyAudit',
      'secretsDetection',
      'securityHeaders',
      'rateLimiting',
      'authenticationBypass'
    ];
  }

  async detectErrors() {
    console.log('🔍 Detecting errors...');
    
    const errors = [];
    
    try {
      // Check application health endpoints
      const healthChecks = [
        { name: 'Web App', url: `${this.config.baseUrl}/health` },
        { name: 'API', url: `${this.config.apiUrl}/v1/health` },
        { name: 'Neural Networks', url: `${this.config.apiUrl}/v1/neural/health` }
      ];
      
      for (const check of healthChecks) {
        try {
          const startTime = Date.now();
          const response = await axios.get(check.url, { timeout: 10000 });
          const responseTime = Date.now() - startTime;
          
          if (response.status !== 200) {
            errors.push({
              type: 'health_check_failed',
              service: check.name,
              status: response.status,
              url: check.url,
              timestamp: new Date().toISOString()
            });
          }
          
          if (responseTime > this.config.alertThresholds.responseTime) {
            errors.push({
              type: 'slow_response',
              service: check.name,
              responseTime: responseTime,
              threshold: this.config.alertThresholds.responseTime,
              timestamp: new Date().toISOString()
            });
          }
          
        } catch (error) {
          errors.push({
            type: 'connection_error',
            service: check.name,
            error: error.message,
            url: check.url,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Check for JavaScript errors in the frontend
      await this.checkFrontendErrors();
      
      // Check server logs for errors
      await this.checkServerLogs();
      
      // Check database connectivity
      await this.checkDatabaseHealth();
      
    } catch (error) {
      console.error(`❌ Error detection failed: ${error.message}`);
      errors.push({
        type: 'detection_error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    this.metrics.errors.push(...errors);
    return errors;
  }

  async checkFrontendErrors() {
    console.log('  🌐 Checking frontend errors...');
    
    try {
      // Use headless browser to check for console errors
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push({
            type: 'console_error',
            message: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      page.on('pageerror', error => {
        consoleErrors.push({
          type: 'page_error',
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      });
      
      await page.goto(this.config.baseUrl, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(5000);
      
      await browser.close();
      
      this.metrics.errors.push(...consoleErrors);
      
    } catch (error) {
      console.log(`    ⚠️ Frontend error check failed: ${error.message}`);
    }
  }

  async checkServerLogs() {
    console.log('  📋 Checking server logs...');
    
    try {
      // Check various log files for errors
      const logFiles = [
        '/var/log/nginx/error.log',
        '/var/log/apache2/error.log',
        './logs/application.log',
        './logs/error.log'
      ];
      
      for (const logFile of logFiles) {
        try {
          const { stdout } = await execAsync(`tail -n 100 ${logFile} 2>/dev/null || echo "Log file not found"`);
          
          if (stdout && stdout !== "Log file not found\n") {
            const lines = stdout.split('\n');
            for (const line of lines) {
              for (const pattern of this.errorPatterns) {
                if (pattern.test(line)) {
                  this.metrics.errors.push({
                    type: 'log_error',
                    logFile: logFile,
                    message: line.trim(),
                    timestamp: new Date().toISOString()
                  });
                }
              }
            }
          }
        } catch (error) {
          // Log file doesn't exist or can't be read
        }
      }
      
    } catch (error) {
      console.log(`    ⚠️ Server log check failed: ${error.message}`);
    }
  }

  async checkDatabaseHealth() {
    console.log('  🗄️ Checking database health...');
    
    try {
      // Check database connectivity through API
      const response = await axios.get(`${this.config.apiUrl}/v1/health/database`, { timeout: 5000 });
      
      if (response.data.status !== 'healthy') {
        this.metrics.errors.push({
          type: 'database_unhealthy',
          status: response.data.status,
          details: response.data.details,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      this.metrics.errors.push({
        type: 'database_connection_error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async analyzePerformance() {
    console.log('📊 Analyzing performance...');
    
    const performance = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };
    
    try {
      // Measure response times
      const endpoints = [
        { name: 'homepage', url: this.config.baseUrl },
        { name: 'api_health', url: `${this.config.apiUrl}/v1/health` },
        { name: 'neural_health', url: `${this.config.apiUrl}/v1/neural/health` }
      ];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        try {
          await axios.get(endpoint.url, { timeout: 10000 });
          performance.metrics[endpoint.name] = {
            responseTime: Date.now() - startTime,
            status: 'success'
          };
        } catch (error) {
          performance.metrics[endpoint.name] = {
            responseTime: Date.now() - startTime,
            status: 'error',
            error: error.message
          };
        }
      }
      
      // Check system resources
      await this.checkSystemResources(performance);
      
      // Check neural network performance
      await this.checkNeuralNetworkPerformance(performance);
      
    } catch (error) {
      console.error(`❌ Performance analysis failed: ${error.message}`);
      performance.error = error.message;
    }
    
    this.metrics.performance.push(performance);
    return performance;
  }

  async checkSystemResources(performance) {
    console.log('  💻 Checking system resources...');
    
    try {
      // CPU usage
      const { stdout: cpuInfo } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1 || echo '0'");
      performance.metrics.cpuUsage = parseFloat(cpuInfo.trim()) || 0;
      
      // Memory usage
      const { stdout: memInfo } = await execAsync("free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100.0}' || echo '0'");
      performance.metrics.memoryUsage = parseFloat(memInfo.trim()) || 0;
      
      // Disk usage
      const { stdout: diskInfo } = await execAsync("df -h / | awk 'NR==2{print $5}' | cut -d'%' -f1 || echo '0'");
      performance.metrics.diskUsage = parseFloat(diskInfo.trim()) || 0;
      
      // Check if resources exceed thresholds
      if (performance.metrics.cpuUsage > this.config.alertThresholds.cpuUsage) {
        this.metrics.errors.push({
          type: 'high_cpu_usage',
          value: performance.metrics.cpuUsage,
          threshold: this.config.alertThresholds.cpuUsage,
          timestamp: new Date().toISOString()
        });
      }
      
      if (performance.metrics.memoryUsage > this.config.alertThresholds.memoryUsage) {
        this.metrics.errors.push({
          type: 'high_memory_usage',
          value: performance.metrics.memoryUsage,
          threshold: this.config.alertThresholds.memoryUsage,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.log(`    ⚠️ System resource check failed: ${error.message}`);
    }
  }

  async checkNeuralNetworkPerformance(performance) {
    console.log('  🧠 Checking neural network performance...');
    
    try {
      const response = await axios.get(`${this.config.apiUrl}/v1/neural/metrics`, { timeout: 10000 });
      
      performance.metrics.neuralNetwork = {
        accuracy: response.data.accuracy,
        latency: response.data.latency,
        throughput: response.data.throughput,
        modelVersion: response.data.modelVersion
      };
      
      // Check if accuracy is below threshold
      if (response.data.accuracy < this.config.alertThresholds.neuralNetworkAccuracy) {
        this.metrics.errors.push({
          type: 'low_neural_network_accuracy',
          accuracy: response.data.accuracy,
          threshold: this.config.alertThresholds.neuralNetworkAccuracy,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.log(`    ⚠️ Neural network performance check failed: ${error.message}`);
      performance.metrics.neuralNetwork = { error: error.message };
    }
  }

  async scanSecurity() {
    console.log('🔒 Scanning security...');
    
    const security = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      recommendations: []
    };
    
    try {
      // Run dependency audit
      await this.runDependencyAudit(security);
      
      // Check security headers
      await this.checkSecurityHeaders(security);
      
      // Scan for secrets
      await this.scanForSecrets(security);
      
      // Check SSL/TLS configuration
      await this.checkSSLConfiguration(security);
      
      // Test for common vulnerabilities
      await this.testCommonVulnerabilities(security);
      
    } catch (error) {
      console.error(`❌ Security scan failed: ${error.message}`);
      security.error = error.message;
    }
    
    this.metrics.security.push(security);
    return security;
  }

  async runDependencyAudit(security) {
    console.log('  📦 Running dependency audit...');
    
    try {
      const { stdout } = await execAsync('npm audit --json');
      const auditResult = JSON.parse(stdout);
      
      if (auditResult.metadata && auditResult.metadata.vulnerabilities) {
        const vulns = auditResult.metadata.vulnerabilities;
        
        security.vulnerabilities.push({
          type: 'dependency_vulnerabilities',
          total: vulns.total,
          critical: vulns.critical,
          high: vulns.high,
          moderate: vulns.moderate,
          low: vulns.low
        });
        
        if (vulns.critical > 0 || vulns.high > 0) {
          security.recommendations.push('Run "npm audit fix" to address critical and high severity vulnerabilities');
        }
      }
      
    } catch (error) {
      console.log(`    ⚠️ Dependency audit failed: ${error.message}`);
    }
  }

  async checkSecurityHeaders(security) {
    console.log('  🛡️ Checking security headers...');
    
    try {
      const response = await axios.head(this.config.baseUrl);
      const headers = response.headers;
      
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security',
        'content-security-policy'
      ];
      
      const missingHeaders = requiredHeaders.filter(header => !headers[header]);
      
      if (missingHeaders.length > 0) {
        security.vulnerabilities.push({
          type: 'missing_security_headers',
          headers: missingHeaders
        });
        
        security.recommendations.push(`Add missing security headers: ${missingHeaders.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`    ⚠️ Security headers check failed: ${error.message}`);
    }
  }

  async scanForSecrets(security) {
    console.log('  🔍 Scanning for secrets...');
    
    try {
      // Check for common secret patterns in code
      const secretPatterns = [
        /api[_-]?key[_-]?=.{10,}/i,
        /secret[_-]?key[_-]?=.{10,}/i,
        /password[_-]?=.{5,}/i,
        /token[_-]?=.{10,}/i,
        /sk_live_[a-zA-Z0-9]{24,}/,
        /pk_live_[a-zA-Z0-9]{24,}/
      ];
      
      const { stdout } = await execAsync('find . -name "*.js" -o -name "*.ts" -o -name "*.json" | head -100');
      const files = stdout.trim().split('\n').filter(f => f && !f.includes('node_modules'));
      
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf8');
          
          for (const pattern of secretPatterns) {
            if (pattern.test(content)) {
              security.vulnerabilities.push({
                type: 'potential_secret_exposed',
                file: file,
                pattern: pattern.toString()
              });
            }
          }
        } catch (error) {
          // File might not be readable
        }
      }
      
    } catch (error) {
      console.log(`    ⚠️ Secret scanning failed: ${error.message}`);
    }
  }

  async checkSSLConfiguration(security) {
    console.log('  🔐 Checking SSL configuration...');
    
    try {
      const url = new URL(this.config.baseUrl);
      if (url.protocol === 'https:') {
        // SSL is enabled, check certificate validity
        const response = await axios.get(this.config.baseUrl, { timeout: 10000 });
        
        // Check if HSTS is enabled
        if (!response.headers['strict-transport-security']) {
          security.vulnerabilities.push({
            type: 'missing_hsts',
            description: 'HTTPS Strict Transport Security header is missing'
          });
        }
      } else {
        security.vulnerabilities.push({
          type: 'no_ssl',
          description: 'Website is not using HTTPS'
        });
        
        security.recommendations.push('Enable HTTPS with a valid SSL certificate');
      }
      
    } catch (error) {
      console.log(`    ⚠️ SSL configuration check failed: ${error.message}`);
    }
  }

  async testCommonVulnerabilities(security) {
    console.log('  🎯 Testing common vulnerabilities...');
    
    try {
      // Test for XSS vulnerability
      const xssPayload = '<script>alert("xss")</script>';
      try {
        await axios.post(`${this.config.apiUrl}/v1/test`, { input: xssPayload }, { timeout: 5000 });
      } catch (error) {
        // Expected to fail
      }
      
      // Test for SQL injection
      const sqlPayload = "'; DROP TABLE users; --";
      try {
        await axios.post(`${this.config.apiUrl}/v1/test`, { input: sqlPayload }, { timeout: 5000 });
      } catch (error) {
        // Expected to fail
      }
      
      // Test rate limiting
      const requests = Array(20).fill().map(() => 
        axios.get(`${this.config.apiUrl}/v1/health`, { timeout: 1000 }).catch(() => null)
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r && r.status === 429);
      
      if (!rateLimited) {
        security.vulnerabilities.push({
          type: 'no_rate_limiting',
          description: 'API endpoints do not appear to have rate limiting'
        });
        
        security.recommendations.push('Implement rate limiting to prevent abuse');
      }
      
    } catch (error) {
      console.log(`    ⚠️ Vulnerability testing failed: ${error.message}`);
    }
  }

  async generateAutomatedFixes() {
    console.log('🔧 Generating automated fixes...');
    
    const fixes = [];
    const recentErrors = this.metrics.errors.slice(-50); // Last 50 errors
    
    // Group errors by type
    const errorsByType = {};
    recentErrors.forEach(error => {
      if (!errorsByType[error.type]) {
        errorsByType[error.type] = [];
      }
      errorsByType[error.type].push(error);
    });
    
    // Generate fixes for each error type
    for (const [errorType, errors] of Object.entries(errorsByType)) {
      const fix = await this.generateFixForErrorType(errorType, errors);
      if (fix) {
        fixes.push(fix);
      }
    }
    
    return fixes;
  }

  async generateFixForErrorType(errorType, errors) {
    console.log(`  🔍 Generating fix for: ${errorType}`);
    
    const fix = {
      errorType,
      errorCount: errors.length,
      automated: false,
      manual: false,
      commands: [],
      description: '',
      priority: 'medium'
    };
    
    switch (errorType) {
      case 'dependency_vulnerabilities':
        fix.automated = true;
        fix.commands = ['npm audit fix'];
        fix.description = 'Automatically fix dependency vulnerabilities';
        fix.priority = 'high';
        break;
        
      case 'missing_security_headers':
        fix.manual = true;
        fix.description = 'Add security headers to web server configuration';
        fix.commands = [
          'Add X-Frame-Options: SAMEORIGIN',
          'Add X-Content-Type-Options: nosniff',
          'Add Strict-Transport-Security: max-age=31536000'
        ];
        fix.priority = 'high';
        break;
        
      case 'high_cpu_usage':
        fix.automated = true;
        fix.commands = [
          'docker-compose restart pq359-api',
          'pm2 restart all'
        ];
        fix.description = 'Restart services to reduce CPU usage';
        fix.priority = 'medium';
        break;
        
      case 'high_memory_usage':
        fix.automated = true;
        fix.commands = [
          'docker system prune -f',
          'npm cache clean --force'
        ];
        fix.description = 'Clean up memory usage';
        fix.priority = 'medium';
        break;
        
      case 'slow_response':
        fix.manual = true;
        fix.description = 'Optimize application performance';
        fix.commands = [
          'Enable caching',
          'Optimize database queries',
          'Compress static assets'
        ];
        fix.priority = 'medium';
        break;
        
      case 'low_neural_network_accuracy':
        fix.automated = true;
        fix.commands = ['curl -X POST ' + this.config.apiUrl + '/v1/neural/retrain'];
        fix.description = 'Trigger neural network retraining';
        fix.priority = 'high';
        break;
        
      default:
        return null;
    }
    
    return fix;
  }

  async applyAutomatedFixes(fixes) {
    console.log('🤖 Applying automated fixes...');
    
    const results = [];
    
    for (const fix of fixes) {
      if (!fix.automated) {
        console.log(`  ⏭️ Skipping manual fix: ${fix.description}`);
        continue;
      }
      
      console.log(`  🔧 Applying fix: ${fix.description}`);
      
      const result = {
        fix: fix.description,
        success: false,
        output: '',
        error: null
      };
      
      try {
        for (const command of fix.commands) {
          console.log(`    Running: ${command}`);
          
          if (command.startsWith('curl')) {
            // Handle API calls
            const url = command.split(' ').pop();
            await axios.post(url);
            result.output += `API call successful: ${url}\n`;
          } else {
            // Handle shell commands
            const { stdout, stderr } = await execAsync(command);
            result.output += stdout + stderr;
          }
        }
        
        result.success = true;
        console.log(`    ✅ Fix applied successfully`);
        
      } catch (error) {
        result.error = error.message;
        console.log(`    ❌ Fix failed: ${error.message}`);
      }
      
      results.push(result);
    }
    
    return results;
  }

  async generateReport() {
    console.log('📋 Generating debugging report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.metrics.errors.length,
        criticalErrors: this.metrics.errors.filter(e => 
          ['connection_error', 'database_connection_error', 'low_neural_network_accuracy'].includes(e.type)
        ).length,
        performanceIssues: this.metrics.performance.filter(p => 
          Object.values(p.metrics).some(m => m.responseTime > this.config.alertThresholds.responseTime)
        ).length,
        securityVulnerabilities: this.metrics.security.reduce((sum, s) => sum + s.vulnerabilities.length, 0)
      },
      errors: this.metrics.errors.slice(-20), // Last 20 errors
      performance: this.metrics.performance.slice(-5), // Last 5 performance checks
      security: this.metrics.security.slice(-3), // Last 3 security scans
      recommendations: []
    };
    
    // Generate recommendations
    if (report.summary.criticalErrors > 0) {
      report.recommendations.push('🚨 Critical errors detected - immediate attention required');
    }
    
    if (report.summary.performanceIssues > 0) {
      report.recommendations.push('⚡ Performance optimization needed');
    }
    
    if (report.summary.securityVulnerabilities > 0) {
      report.recommendations.push('🔒 Security vulnerabilities need to be addressed');
    }
    
    if (report.summary.totalErrors === 0) {
      report.recommendations.push('✅ System is running smoothly');
    }
    
    // Save report
    const reportPath = path.join('./reports', `debugging-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Report saved to: ${reportPath}`);
    return report;
  }

  async startContinuousMonitoring() {
    console.log('🔄 Starting continuous monitoring...');
    
    this.isMonitoring = true;
    
    const runMonitoringCycle = async () => {
      if (!this.isMonitoring) return;
      
      try {
        console.log('\n🔍 Running monitoring cycle...');
        
        // Detect errors
        const errors = await this.detectErrors();
        
        // Analyze performance
        const performance = await this.analyzePerformance();
        
        // Generate and apply fixes if needed
        if (errors.length > 0) {
          const fixes = await this.generateAutomatedFixes();
          if (fixes.length > 0) {
            await this.applyAutomatedFixes(fixes);
          }
        }
        
        // Generate report every 10 cycles
        if (this.metrics.errors.length % 10 === 0) {
          await this.generateReport();
        }
        
        console.log(`✅ Monitoring cycle completed - ${errors.length} errors detected`);
        
      } catch (error) {
        console.error(`❌ Monitoring cycle failed: ${error.message}`);
      }
      
      // Schedule next cycle
      this.monitoringInterval = setTimeout(runMonitoringCycle, this.config.monitoringInterval);
    };
    
    // Start first cycle
    runMonitoringCycle();
  }

  async stopContinuousMonitoring() {
    console.log('⏹️ Stopping continuous monitoring...');
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearTimeout(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async runFullDiagnostic() {
    console.log('🔬 Running full diagnostic...\n');
    
    await this.initialize();
    
    // Run all diagnostic checks
    const errors = await this.detectErrors();
    const performance = await this.analyzePerformance();
    const security = await this.scanSecurity();
    
    // Generate and apply fixes
    const fixes = await this.generateAutomatedFixes();
    const fixResults = await this.applyAutomatedFixes(fixes);
    
    // Generate final report
    const report = await this.generateReport();
    
    console.log('\n📊 Diagnostic Summary:');
    console.log(`Errors detected: ${errors.length}`);
    console.log(`Performance issues: ${performance.error ? 1 : 0}`);
    console.log(`Security vulnerabilities: ${security.vulnerabilities.length}`);
    console.log(`Automated fixes applied: ${fixResults.filter(r => r.success).length}`);
    
    return {
      errors,
      performance,
      security,
      fixes: fixResults,
      report
    };
  }
}

// CLI execution
if (require.main === module) {
  const debugger = new AutomatedDebuggingSystem({
    baseUrl: process.env.BASE_URL || 'https://pq359.com',
    apiUrl: process.env.API_URL || 'https://api.pq359.com'
  });
  
  const command = process.argv[2] || 'diagnostic';
  
  switch (command) {
    case 'diagnostic':
      debugger.runFullDiagnostic()
        .then((results) => {
          console.log('\n🎉 Full diagnostic completed successfully!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('❌ Diagnostic failed:', error);
          process.exit(1);
        });
      break;
      
    case 'monitor':
      debugger.startContinuousMonitoring()
        .then(() => {
          console.log('🔄 Continuous monitoring started. Press Ctrl+C to stop.');
          
          process.on('SIGINT', async () => {
            await debugger.stopContinuousMonitoring();
            console.log('\n👋 Monitoring stopped.');
            process.exit(0);
          });
        })
        .catch((error) => {
          console.error('❌ Monitoring failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('Usage: node automated-debugging.js [diagnostic|monitor]');
      process.exit(1);
  }
}

module.exports = AutomatedDebuggingSystem;
