# GitHub Actions CI/CD Guide for PQ359

## 🚀 Overview

PQ359 uses a comprehensive GitHub Actions CI/CD pipeline that provides automated testing, security monitoring, and deployment capabilities. This guide explains how to set up, configure, and use the workflows.

## 📁 Workflow Files

### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)
- **Triggers:** Push to main branches, pull requests, manual dispatch
- **Features:** Complete CI/CD with testing, deployment, and validation
- **Environments:** Staging and Production

### 2. Security Monitoring (`.github/workflows/security-monitoring.yml`)
- **Triggers:** Daily schedule, push to main, manual dispatch
- **Features:** Dependency scanning, secret detection, compliance checks
- **Reporting:** Automated security reports and alerts

## 🔧 Setup Instructions

### Step 1: Repository Secrets Configuration

Add these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

#### Required Secrets
```bash
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_TOKEN=your_firebase_token
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Application Configuration
VITE_API_URL=https://api.pq359.com
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}

# Staging Environment (Optional)
STAGING_URL=https://staging.pq359.com
STAGING_API_URL=https://api-staging.pq359.com
STAGING_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}

# Notifications (Optional)
SLACK_WEBHOOK=https://hooks.slack.com/services/...
NOTIFICATION_EMAIL=alerts@pq359.com

# Security Tools (Optional)
SNYK_TOKEN=your_snyk_token
```

### Step 2: Environment Configuration

Configure deployment environments in GitHub:

1. Go to `Settings > Environments`
2. Create environments:
   - **staging** (for staging deployments)
   - **production** (for production deployments)
3. Add environment-specific secrets and protection rules

### Step 3: Branch Protection Rules

Set up branch protection for `main`:

1. Go to `Settings > Branches`
2. Add rule for `main` branch:
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Require pull request reviews
   - ✅ Dismiss stale reviews
   - ✅ Restrict pushes

## 🎯 Workflow Triggers

### Automatic Triggers

#### CI/CD Pipeline
- **Push to main branches:** Triggers full CI/CD pipeline
- **Pull requests:** Runs validation and testing
- **Daily schedule:** Health checks at 2 AM UTC

#### Security Monitoring
- **Daily schedule:** Security scans at 3 AM UTC
- **Push to main:** Security validation on changes
- **Pull requests:** Security checks on new code

### Manual Triggers

#### CI/CD Pipeline
```bash
# Trigger via GitHub UI or API
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/89rat/pqshield-api/actions/workflows/ci-cd.yml/dispatches \
  -d '{"ref":"main","inputs":{"environment":"production","dry_run":"false"}}'
```

#### Security Monitoring
```bash
# Trigger security scan
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/89rat/pqshield-api/actions/workflows/security-monitoring.yml/dispatches \
  -d '{"ref":"main","inputs":{"scan_type":"full"}}'
```

## 🧪 Testing Pipeline

### Test Suites

#### 1. Unit Tests
- **Framework:** Jest/Vitest
- **Coverage:** Minimum 80% required
- **Files:** `src/**/*.test.js`

#### 2. Security Tests
- **npm audit:** Dependency vulnerability scanning
- **Secret scanning:** Hardcoded credentials detection
- **Security headers:** Configuration validation

#### 3. Performance Tests
- **Lighthouse:** Web performance auditing
- **Artillery:** Load testing
- **Response time:** <2s requirement

#### 4. Usability Tests
- **Puppeteer:** Automated browser testing
- **Accessibility:** WCAG compliance
- **Mobile:** Responsive design validation

### Test Configuration

Create test configuration files:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## 🚀 Deployment Pipeline

### Deployment Stages

#### 1. Staging Deployment
- **Trigger:** Push to `staging` branch
- **Environment:** staging
- **URL:** https://staging.pq359.com
- **Auto-deploy:** Yes

#### 2. Production Deployment
- **Trigger:** Push to `main` or `pq359-launch-clean`
- **Environment:** production
- **URL:** https://pq359.com
- **Protection:** Environment approval required

### Deployment Process

1. **Build Application**
   ```bash
   pnpm build
   ```

2. **Deploy to Cloudflare Pages**
   ```bash
   wrangler pages deploy dist --project-name pq359
   ```

3. **Deploy Cloudflare Workers**
   ```bash
   wrangler deploy --env production
   ```

4. **Deploy Firebase Functions**
   ```bash
   firebase deploy --only functions,firestore:rules,storage:rules
   ```

5. **Post-Deployment Validation**
   - Health checks
   - Performance validation
   - Security verification

## 🛡️ Security Monitoring

### Security Scans

#### 1. Dependency Security
- **npm audit:** Built-in vulnerability scanning
- **Snyk:** Advanced security analysis
- **Severity levels:** Critical, High, Medium, Low

#### 2. Secret Detection
- **TruffleHog:** Git history scanning
- **Custom patterns:** API keys, tokens, passwords
- **Real-time alerts:** Immediate notification

#### 3. Compliance Checks
- **GDPR:** Privacy policy, cookie consent, data processing
- **COPPA:** Age verification, parental consent
- **Security headers:** CSP, HSTS, X-Frame-Options

### Security Alerts

#### Automatic Issue Creation
- **Critical vulnerabilities:** Immediate GitHub issue
- **Secret detection:** High-priority security alert
- **Compliance failures:** Compliance improvement issue

#### Notification Channels
- **Slack:** Real-time team notifications
- **Email:** Detailed security reports
- **GitHub Issues:** Trackable action items

## 📊 Monitoring & Reporting

### Generated Reports

#### 1. Pipeline Reports
- **Location:** `reports/` artifacts
- **Format:** Markdown and JSON
- **Content:** Job results, metrics, recommendations

#### 2. Security Reports
- **Dependency scan results**
- **Secret detection findings**
- **Compliance assessment**
- **Overall security score**

#### 3. Test Reports
- **Unit test coverage**
- **Performance metrics**
- **Usability scores**
- **Accessibility compliance**

### Metrics Tracking

#### Success Metrics
- **Pipeline success rate:** >95%
- **Test coverage:** >80%
- **Security score:** >80%
- **Performance score:** >90%

#### Performance Metrics
- **Build time:** <10 minutes
- **Test execution:** <15 minutes
- **Deployment time:** <5 minutes
- **Response time:** <2 seconds

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
gh run view --log

# Local debugging
pnpm build
pnpm test
```

#### 2. Deployment Failures
```bash
# Check deployment status
wrangler pages deployment list
firebase functions:log

# Rollback if needed
wrangler pages deployment rollback
```

#### 3. Test Failures
```bash
# Run tests locally
pnpm test --verbose
pnpm test:coverage

# Debug specific test
pnpm test -- --testNamePattern="specific test"
```

#### 4. Security Issues
```bash
# Fix vulnerabilities
npm audit fix

# Check for secrets
git log --all --grep="password\|key\|token"

# Update dependencies
pnpm update
```

### Debug Commands

#### View Workflow Runs
```bash
# List recent runs
gh run list

# View specific run
gh run view [run-id]

# Download artifacts
gh run download [run-id]
```

#### Check Environment
```bash
# Verify secrets (don't expose values)
gh secret list

# Check environment status
gh api repos/89rat/pqshield-api/environments
```

## 🎯 Best Practices

### Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   # Create pull request
   ```

2. **Pull Request Process**
   - CI/CD pipeline runs automatically
   - All checks must pass
   - Code review required
   - Merge to main triggers deployment

3. **Hotfix Process**
   ```bash
   git checkout -b hotfix/critical-fix
   # Make urgent fix
   git commit -m "fix: critical security issue"
   git push origin hotfix/critical-fix
   # Emergency merge and deploy
   ```

### Security Best Practices

1. **Never commit secrets**
   - Use GitHub Secrets
   - Add to .gitignore
   - Regular secret scanning

2. **Keep dependencies updated**
   - Weekly dependency updates
   - Security patch priority
   - Automated vulnerability fixes

3. **Monitor compliance**
   - Regular compliance scans
   - Privacy policy updates
   - Security header configuration

### Performance Optimization

1. **Build optimization**
   - Bundle size monitoring
   - Code splitting
   - Asset optimization

2. **Test optimization**
   - Parallel test execution
   - Test result caching
   - Selective test running

3. **Deployment optimization**
   - Incremental deployments
   - Rollback strategies
   - Health check automation

## 📈 Advanced Configuration

### Custom Workflows

Create additional workflows for specific needs:

```yaml
# .github/workflows/custom-workflow.yml
name: Custom Workflow
on:
  workflow_dispatch:
    inputs:
      custom_param:
        description: 'Custom parameter'
        required: true

jobs:
  custom-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Custom Action
        run: echo "Custom workflow with ${{ inputs.custom_param }}"
```

### Matrix Builds

Test across multiple environments:

```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

### Conditional Execution

Run jobs based on conditions:

```yaml
if: |
  github.event_name == 'push' && 
  contains(github.event.head_commit.message, '[deploy]')
```

## 🎉 Success Indicators

### Pipeline Success
```
🎉 PQ359 CI/CD Pipeline Successful!
✅ All jobs completed successfully
🌐 Environment: production
📊 Success Rate: 100%
🚀 Branch: main
🌐 Live at: https://pq359.com
```

### Security Success
```
🛡️ Security Monitoring Complete
📊 Overall Security Score: 95%
✅ Dependencies: Secure
✅ Secrets: None detected
✅ Compliance: 90%
```

## 🆘 Support

### Getting Help

1. **Check workflow logs** in GitHub Actions tab
2. **Review artifacts** for detailed reports
3. **Check issues** for automated alerts
4. **Contact team** via Slack notifications

### Useful Links

- **GitHub Actions Documentation:** https://docs.github.com/en/actions
- **Cloudflare Pages:** https://developers.cloudflare.com/pages/
- **Firebase CLI:** https://firebase.google.com/docs/cli
- **Security Best Practices:** https://docs.github.com/en/code-security

---

**The CI/CD pipeline is the backbone of PQ359's development workflow. Use it wisely, monitor it closely, and keep it secure!** 🚀🛡️
