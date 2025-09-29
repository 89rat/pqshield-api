#!/usr/bin/env node

/**
 * PQ359 Automated Usability Testing Suite
 * 
 * This script automates usability testing including:
 * - User journey testing
 * - Accessibility validation
 * - Performance measurement
 * - Mobile responsiveness
 * - Gamification flow testing
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs').promises;
const path = require('path');

class AutomatedUsabilityTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://pq359.com';
    this.testResults = {
      userJourneys: [],
      accessibility: {},
      performance: {},
      mobile: {},
      gamification: {},
      summary: {}
    };
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Initializing Automated Usability Testing...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport for desktop testing
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable request interception for performance monitoring
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (req) => {
      req.continue();
    });
    
    console.log('✅ Browser initialized successfully');
  }

  async testUserJourney(journeyName, steps) {
    console.log(`🧪 Testing user journey: ${journeyName}`);
    
    const startTime = Date.now();
    const journey = {
      name: journeyName,
      steps: [],
      totalTime: 0,
      success: false,
      errors: []
    };

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepStartTime = Date.now();
        
        console.log(`  📍 Step ${i + 1}: ${step.description}`);
        
        try {
          await step.action(this.page);
          
          const stepTime = Date.now() - stepStartTime;
          journey.steps.push({
            description: step.description,
            time: stepTime,
            success: true
          });
          
          console.log(`    ✅ Completed in ${stepTime}ms`);
          
        } catch (error) {
          const stepTime = Date.now() - stepStartTime;
          journey.steps.push({
            description: step.description,
            time: stepTime,
            success: false,
            error: error.message
          });
          
          journey.errors.push(`Step ${i + 1}: ${error.message}`);
          console.log(`    ❌ Failed: ${error.message}`);
        }
      }
      
      journey.totalTime = Date.now() - startTime;
      journey.success = journey.errors.length === 0;
      
      console.log(`${journey.success ? '✅' : '❌'} Journey completed in ${journey.totalTime}ms`);
      
    } catch (error) {
      journey.errors.push(`Journey failed: ${error.message}`);
      journey.totalTime = Date.now() - startTime;
      console.log(`❌ Journey failed: ${error.message}`);
    }

    this.testResults.userJourneys.push(journey);
    return journey;
  }

  async testAccessibility() {
    console.log('♿ Testing Accessibility...');
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
      
      // Inject axe-core for accessibility testing
      await this.page.addScriptTag({
        url: 'https://unpkg.com/axe-core@4.7.0/axe.min.js'
      });
      
      // Run accessibility audit
      const accessibilityResults = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          axe.run((err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });
      
      this.testResults.accessibility = {
        violations: accessibilityResults.violations.length,
        passes: accessibilityResults.passes.length,
        incomplete: accessibilityResults.incomplete.length,
        inapplicable: accessibilityResults.inapplicable.length,
        details: accessibilityResults.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length
        }))
      };
      
      console.log(`✅ Accessibility test completed: ${accessibilityResults.violations.length} violations found`);
      
    } catch (error) {
      console.log(`❌ Accessibility test failed: ${error.message}`);
      this.testResults.accessibility.error = error.message;
    }
  }

  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    try {
      // Run Lighthouse audit
      const { lhr } = await lighthouse(this.baseUrl, {
        port: new URL(this.browser.wsEndpoint()).port,
        output: 'json',
        logLevel: 'info',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      });
      
      this.testResults.performance = {
        performanceScore: Math.round(lhr.categories.performance.score * 100),
        accessibilityScore: Math.round(lhr.categories.accessibility.score * 100),
        bestPracticesScore: Math.round(lhr.categories['best-practices'].score * 100),
        seoScore: Math.round(lhr.categories.seo.score * 100),
        metrics: {
          firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
          cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
          totalBlockingTime: lhr.audits['total-blocking-time'].numericValue
        },
        opportunities: lhr.audits['unused-javascript'] ? {
          unusedJavaScript: lhr.audits['unused-javascript'].details?.overallSavingsBytes || 0,
          unusedCSS: lhr.audits['unused-css-rules'].details?.overallSavingsBytes || 0,
          unoptimizedImages: lhr.audits['uses-optimized-images'].details?.overallSavingsBytes || 0
        } : {}
      };
      
      console.log(`✅ Performance test completed: ${this.testResults.performance.performanceScore}/100`);
      
    } catch (error) {
      console.log(`❌ Performance test failed: ${error.message}`);
      this.testResults.performance.error = error.message;
    }
  }

  async testMobileResponsiveness() {
    console.log('📱 Testing Mobile Responsiveness...');
    
    const devices = [
      { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
      { name: 'iPad', viewport: { width: 768, height: 1024 } },
      { name: 'Android Phone', viewport: { width: 360, height: 640 } }
    ];
    
    this.testResults.mobile.devices = [];
    
    for (const device of devices) {
      try {
        console.log(`  📱 Testing ${device.name}...`);
        
        await this.page.setViewport(device.viewport);
        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
        
        // Test touch targets
        const touchTargets = await this.page.evaluate(() => {
          const buttons = document.querySelectorAll('button, a, input[type="submit"]');
          let tooSmall = 0;
          
          buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
              tooSmall++;
            }
          });
          
          return {
            total: buttons.length,
            tooSmall: tooSmall
          };
        });
        
        // Test horizontal scrolling
        const hasHorizontalScroll = await this.page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });
        
        // Test text readability
        const textReadability = await this.page.evaluate(() => {
          const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
          let tooSmall = 0;
          
          elements.forEach(el => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            if (fontSize < 16) {
              tooSmall++;
            }
          });
          
          return {
            total: elements.length,
            tooSmall: tooSmall
          };
        });
        
        this.testResults.mobile.devices.push({
          name: device.name,
          viewport: device.viewport,
          touchTargets: touchTargets,
          hasHorizontalScroll: hasHorizontalScroll,
          textReadability: textReadability,
          success: !hasHorizontalScroll && touchTargets.tooSmall === 0
        });
        
        console.log(`    ${hasHorizontalScroll ? '❌' : '✅'} No horizontal scroll`);
        console.log(`    ${touchTargets.tooSmall === 0 ? '✅' : '❌'} Touch targets (${touchTargets.tooSmall} too small)`);
        
      } catch (error) {
        console.log(`    ❌ Failed testing ${device.name}: ${error.message}`);
        this.testResults.mobile.devices.push({
          name: device.name,
          error: error.message,
          success: false
        });
      }
    }
    
    // Reset to desktop viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async testGamificationFlow() {
    console.log('🎮 Testing Gamification Flow...');
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
      
      // Test achievement visibility
      const achievementsVisible = await this.page.evaluate(() => {
        const achievementElements = document.querySelectorAll('[data-testid*="achievement"], .achievement, [class*="achievement"]');
        return achievementElements.length > 0;
      });
      
      // Test progress indicators
      const progressIndicators = await this.page.evaluate(() => {
        const progressElements = document.querySelectorAll('progress, [role="progressbar"], .progress-bar, [class*="progress"]');
        return {
          count: progressElements.length,
          visible: Array.from(progressElements).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }).length
        };
      });
      
      // Test leaderboard accessibility
      let leaderboardAccessible = false;
      try {
        const leaderboardLink = await this.page.$('[href*="leaderboard"], [data-testid*="leaderboard"]');
        if (leaderboardLink) {
          await leaderboardLink.click();
          await this.page.waitForTimeout(2000);
          leaderboardAccessible = true;
        }
      } catch (error) {
        console.log(`    ⚠️ Leaderboard not accessible: ${error.message}`);
      }
      
      // Test reward system visibility
      const rewardsVisible = await this.page.evaluate(() => {
        const rewardElements = document.querySelectorAll('[data-testid*="reward"], .reward, [class*="reward"], [class*="xp"], [class*="coin"]');
        return rewardElements.length > 0;
      });
      
      this.testResults.gamification = {
        achievementsVisible,
        progressIndicators,
        leaderboardAccessible,
        rewardsVisible,
        overallScore: [achievementsVisible, progressIndicators.count > 0, leaderboardAccessible, rewardsVisible].filter(Boolean).length
      };
      
      console.log(`✅ Gamification test completed: ${this.testResults.gamification.overallScore}/4 features working`);
      
    } catch (error) {
      console.log(`❌ Gamification test failed: ${error.message}`);
      this.testResults.gamification.error = error.message;
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive Usability Testing Suite...\n');
    
    await this.initialize();
    
    // Define user journeys
    const userJourneys = [
      {
        name: 'New User Registration',
        steps: [
          {
            description: 'Navigate to homepage',
            action: async (page) => {
              await page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            }
          },
          {
            description: 'Find and click signup button',
            action: async (page) => {
              const signupButton = await page.$('a[href*="signup"], button[data-testid*="signup"], .signup-btn');
              if (!signupButton) throw new Error('Signup button not found');
              await signupButton.click();
              await page.waitForTimeout(2000);
            }
          },
          {
            description: 'Fill registration form',
            action: async (page) => {
              await page.type('input[type="email"]', 'test@example.com');
              await page.type('input[type="password"]', 'TestPassword123!');
              await page.waitForTimeout(1000);
            }
          }
        ]
      },
      {
        name: 'Security Scan Flow',
        steps: [
          {
            description: 'Navigate to scan page',
            action: async (page) => {
              await page.goto(`${this.baseUrl}/scan`, { waitUntil: 'networkidle0' });
            }
          },
          {
            description: 'Initiate security scan',
            action: async (page) => {
              const scanButton = await page.$('button[data-testid*="scan"], .scan-btn, input[type="submit"]');
              if (scanButton) {
                await scanButton.click();
                await page.waitForTimeout(3000);
              }
            }
          }
        ]
      },
      {
        name: 'Achievement Viewing',
        steps: [
          {
            description: 'Navigate to achievements',
            action: async (page) => {
              await page.goto(`${this.baseUrl}/achievements`, { waitUntil: 'networkidle0' });
            }
          },
          {
            description: 'View achievement details',
            action: async (page) => {
              const achievement = await page.$('.achievement, [data-testid*="achievement"]');
              if (achievement) {
                await achievement.click();
                await page.waitForTimeout(2000);
              }
            }
          }
        ]
      }
    ];
    
    // Run all test suites
    try {
      // Test user journeys
      for (const journey of userJourneys) {
        await this.testUserJourney(journey.name, journey.steps);
      }
      
      // Test accessibility
      await this.testAccessibility();
      
      // Test performance
      await this.testPerformance();
      
      // Test mobile responsiveness
      await this.testMobileResponsiveness();
      
      // Test gamification flow
      await this.testGamificationFlow();
      
      // Generate summary
      this.generateSummary();
      
      console.log('\n🎉 All usability tests completed!');
      
    } catch (error) {
      console.error(`❌ Test suite failed: ${error.message}`);
      this.testResults.summary.error = error.message;
    } finally {
      await this.cleanup();
    }
    
    return this.testResults;
  }

  generateSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      overallScore: 0,
      categories: {}
    };
    
    // User Journey Score
    const successfulJourneys = this.testResults.userJourneys.filter(j => j.success).length;
    const totalJourneys = this.testResults.userJourneys.length;
    summary.categories.userJourneys = {
      score: totalJourneys > 0 ? Math.round((successfulJourneys / totalJourneys) * 100) : 0,
      details: `${successfulJourneys}/${totalJourneys} journeys successful`
    };
    
    // Accessibility Score
    summary.categories.accessibility = {
      score: this.testResults.accessibility.violations !== undefined ? 
        Math.max(0, 100 - (this.testResults.accessibility.violations * 10)) : 0,
      details: `${this.testResults.accessibility.violations || 0} violations found`
    };
    
    // Performance Score
    summary.categories.performance = {
      score: this.testResults.performance.performanceScore || 0,
      details: `Lighthouse performance score`
    };
    
    // Mobile Score
    const mobileDevices = this.testResults.mobile.devices || [];
    const successfulMobile = mobileDevices.filter(d => d.success).length;
    summary.categories.mobile = {
      score: mobileDevices.length > 0 ? Math.round((successfulMobile / mobileDevices.length) * 100) : 0,
      details: `${successfulMobile}/${mobileDevices.length} devices passed`
    };
    
    // Gamification Score
    summary.categories.gamification = {
      score: this.testResults.gamification.overallScore ? 
        Math.round((this.testResults.gamification.overallScore / 4) * 100) : 0,
      details: `${this.testResults.gamification.overallScore || 0}/4 features working`
    };
    
    // Calculate overall score
    const scores = Object.values(summary.categories).map(c => c.score);
    summary.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    // Determine grade
    if (summary.overallScore >= 90) summary.grade = 'A';
    else if (summary.overallScore >= 80) summary.grade = 'B';
    else if (summary.overallScore >= 70) summary.grade = 'C';
    else if (summary.overallScore >= 60) summary.grade = 'D';
    else summary.grade = 'F';
    
    this.testResults.summary = summary;
  }

  async saveResults(filename = 'usability-test-results.json') {
    const resultsPath = path.join(process.cwd(), filename);
    await fs.writeFile(resultsPath, JSON.stringify(this.testResults, null, 2));
    console.log(`📊 Results saved to: ${resultsPath}`);
    
    // Also generate a human-readable report
    const reportPath = path.join(process.cwd(), 'usability-report.md');
    const report = this.generateMarkdownReport();
    await fs.writeFile(reportPath, report);
    console.log(`📋 Report saved to: ${reportPath}`);
  }

  generateMarkdownReport() {
    const { summary } = this.testResults;
    
    return `# PQ359 Usability Test Report

**Generated:** ${summary.timestamp}
**Overall Score:** ${summary.overallScore}/100 (Grade: ${summary.grade})

## Summary

| Category | Score | Details |
|----------|-------|---------|
| User Journeys | ${summary.categories.userJourneys.score}/100 | ${summary.categories.userJourneys.details} |
| Accessibility | ${summary.categories.accessibility.score}/100 | ${summary.categories.accessibility.details} |
| Performance | ${summary.categories.performance.score}/100 | ${summary.categories.performance.details} |
| Mobile | ${summary.categories.mobile.score}/100 | ${summary.categories.mobile.details} |
| Gamification | ${summary.categories.gamification.score}/100 | ${summary.categories.gamification.details} |

## Detailed Results

### User Journeys
${this.testResults.userJourneys.map(journey => `
**${journey.name}:** ${journey.success ? '✅ Success' : '❌ Failed'} (${journey.totalTime}ms)
${journey.errors.length > 0 ? `- Errors: ${journey.errors.join(', ')}` : ''}
`).join('\n')}

### Accessibility
- Violations: ${this.testResults.accessibility.violations || 0}
- Passes: ${this.testResults.accessibility.passes || 0}
${this.testResults.accessibility.details ? this.testResults.accessibility.details.map(v => `- ${v.impact}: ${v.description}`).join('\n') : ''}

### Performance Metrics
- Performance Score: ${this.testResults.performance.performanceScore || 0}/100
- First Contentful Paint: ${this.testResults.performance.metrics?.firstContentfulPaint || 0}ms
- Largest Contentful Paint: ${this.testResults.performance.metrics?.largestContentfulPaint || 0}ms

### Mobile Responsiveness
${this.testResults.mobile.devices ? this.testResults.mobile.devices.map(device => `
**${device.name}:** ${device.success ? '✅ Pass' : '❌ Fail'}
- Touch targets: ${device.touchTargets?.tooSmall || 0} too small
- Horizontal scroll: ${device.hasHorizontalScroll ? 'Yes' : 'No'}
`).join('\n') : ''}

### Gamification Features
- Achievements visible: ${this.testResults.gamification.achievementsVisible ? '✅' : '❌'}
- Progress indicators: ${this.testResults.gamification.progressIndicators?.count || 0} found
- Leaderboard accessible: ${this.testResults.gamification.leaderboardAccessible ? '✅' : '❌'}
- Rewards visible: ${this.testResults.gamification.rewardsVisible ? '✅' : '❌'}

## Recommendations

${summary.overallScore < 80 ? `
### Priority Fixes Needed
- Improve user journey completion rates
- Address accessibility violations
- Optimize performance metrics
- Enhance mobile responsiveness
- Fix gamification features
` : ''}

${summary.overallScore >= 80 ? `
### Excellent Usability!
Your app demonstrates strong usability across all categories. Consider minor optimizations for even better user experience.
` : ''}
`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser cleanup completed');
    }
  }
}

// CLI execution
if (require.main === module) {
  const tester = new AutomatedUsabilityTester({
    baseUrl: process.env.TEST_URL || 'https://pq359.com'
  });
  
  tester.runAllTests()
    .then(async (results) => {
      await tester.saveResults();
      
      console.log('\n📊 Final Results:');
      console.log(`Overall Score: ${results.summary.overallScore}/100 (${results.summary.grade})`);
      console.log(`User Journeys: ${results.summary.categories.userJourneys.score}/100`);
      console.log(`Accessibility: ${results.summary.categories.accessibility.score}/100`);
      console.log(`Performance: ${results.summary.categories.performance.score}/100`);
      console.log(`Mobile: ${results.summary.categories.mobile.score}/100`);
      console.log(`Gamification: ${results.summary.categories.gamification.score}/100`);
      
      // Exit with appropriate code
      process.exit(results.summary.overallScore >= 70 ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Usability testing failed:', error);
      process.exit(1);
    });
}

module.exports = AutomatedUsabilityTester;
