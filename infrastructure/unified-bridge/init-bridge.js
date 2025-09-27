#!/usr/bin/env node

// Universal Sentinel Bridge Initialization Script
// Sets up Firebase, Cloudflare, and Google Play integration

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n🔧 Step ${step}: ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function createFirebaseConfig() {
  const firebaseConfig = {
    "hosting": {
      "public": "dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ],
      "headers": [
        {
          "source": "/service-worker.js",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache"
            }
          ]
        }
      ]
    },
    "firestore": {
      "rules": "firestore.rules",
      "indexes": "firestore.indexes.json"
    },
    "functions": [
      {
        "source": "functions",
        "codebase": "default",
        "ignore": [
          "node_modules",
          ".git",
          "firebase-debug.log",
          "firebase-debug.*.log"
        ],
        "predeploy": [
          "npm --prefix \"$RESOURCE_DIR\" run lint",
          "npm --prefix \"$RESOURCE_DIR\" run build"
        ]
      }
    ],
    "storage": {
      "rules": "storage.rules"
    },
    "emulators": {
      "auth": {
        "port": 9099
      },
      "functions": {
        "port": 5001
      },
      "firestore": {
        "port": 8080
      },
      "hosting": {
        "port": 5000
      },
      "ui": {
        "enabled": true
      },
      "singleProjectMode": true
    }
  };

  writeFileSync('firebase.json', JSON.stringify(firebaseConfig, null, 2));
  logSuccess('Firebase configuration created');
}

function createFirestoreRules() {
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Family networks - members can read/write
    match /families/{familyId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.members;
    }
    
    // Threats - users can read their own threats
    match /threats/{threatId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Community threats - read only for authenticated users
    match /community_threats/{threatId} {
      allow read: if request.auth != null;
    }
    
    // Analytics - admin only
    match /analytics/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}`;

  writeFileSync('firestore.rules', rules);
  logSuccess('Firestore security rules created');
}

function createFirestoreIndexes() {
  const indexes = {
    "indexes": [
      {
        "collectionGroup": "threats",
        "queryScope": "COLLECTION",
        "fields": [
          {
            "fieldPath": "userId",
            "order": "ASCENDING"
          },
          {
            "fieldPath": "timestamp",
            "order": "DESCENDING"
          }
        ]
      },
      {
        "collectionGroup": "threats",
        "queryScope": "COLLECTION",
        "fields": [
          {
            "fieldPath": "type",
            "order": "ASCENDING"
          },
          {
            "fieldPath": "timestamp",
            "order": "DESCENDING"
          }
        ]
      },
      {
        "collectionGroup": "community_threats",
        "queryScope": "COLLECTION",
        "fields": [
          {
            "fieldPath": "location",
            "order": "ASCENDING"
          },
          {
            "fieldPath": "timestamp",
            "order": "DESCENDING"
          }
        ]
      }
    ],
    "fieldOverrides": []
  };

  writeFileSync('firestore.indexes.json', JSON.stringify(indexes, null, 2));
  logSuccess('Firestore indexes created');
}

function createStorageRules() {
  const rules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile images
    match /users/{userId}/profile/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Neural network models - read only for authenticated users
    match /models/{allPaths=**} {
      allow read: if request.auth != null;
    }
    
    // Threat evidence - users can upload their own
    match /threats/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  writeFileSync('storage.rules', rules);
  logSuccess('Storage security rules created');
}

function createCloudflareConfig() {
  const wranglerConfig = `name = "universal-sentinel-api"
main = "infrastructure/unified-bridge/cloudflare/workers-bridge.js"
compatibility_date = "2024-01-01"
node_compat = true

[env.production]
name = "universal-sentinel-api"

# D1 Databases
[[env.production.d1_databases]]
binding = "THREATS_DB"
database_name = "universal-sentinel-threats"
database_id = "your-threats-db-id"

[[env.production.d1_databases]]
binding = "ANALYTICS_DB"
database_name = "universal-sentinel-analytics"
database_id = "your-analytics-db-id"

# KV Namespaces
[[env.production.kv_namespaces]]
binding = "USER_SESSIONS"
id = "your-sessions-kv-id"

[[env.production.kv_namespaces]]
binding = "THREAT_CACHE"
id = "your-cache-kv-id"

# R2 Buckets
[[env.production.r2_buckets]]
binding = "NEURAL_MODELS"
bucket_name = "universal-sentinel-models"

# Environment Variables
[env.production.vars]
ENVIRONMENT = "production"
API_VERSION = "v1"
FIREBASE_PROJECT_ID = "universal-sentinel-app"

# Development Environment
[env.development]
name = "universal-sentinel-api-dev"

[[env.development.d1_databases]]
binding = "THREATS_DB"
database_name = "universal-sentinel-threats-dev"
database_id = "your-dev-threats-db-id"

[[env.development.kv_namespaces]]
binding = "USER_SESSIONS"
id = "your-dev-sessions-kv-id"

[env.development.vars]
ENVIRONMENT = "development"
API_VERSION = "v1"
FIREBASE_PROJECT_ID = "universal-sentinel-app-dev"`;

  writeFileSync('wrangler.toml', wranglerConfig);
  logSuccess('Cloudflare Wrangler configuration created');
}

function createD1Schema() {
  const schema = `-- Universal Sentinel Database Schema

-- Threats table
CREATE TABLE IF NOT EXISTS threats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    threat_type TEXT NOT NULL,
    confidence REAL NOT NULL,
    processing_time REAL NOT NULL,
    snn_processing_time REAL,
    ann_processing_time REAL,
    location TEXT,
    device_info TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    event_name TEXT NOT NULL,
    properties TEXT, -- JSON string
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT,
    device_info TEXT
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_token TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Neural network performance metrics
CREATE TABLE IF NOT EXISTS neural_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    model_type TEXT NOT NULL, -- 'snn' or 'ann'
    processing_time REAL NOT NULL,
    accuracy REAL,
    memory_usage INTEGER,
    battery_impact REAL,
    device_tier TEXT, -- 'flagship', 'midrange', 'budget'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Community threat aggregations
CREATE TABLE IF NOT EXISTS community_threats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    threat_type TEXT NOT NULL,
    location TEXT,
    count INTEGER DEFAULT 1,
    avg_confidence REAL,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    severity TEXT DEFAULT 'medium'
);

-- Subscription tracking
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    subscription_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'active', 'cancelled', 'expired'
    platform TEXT NOT NULL, -- 'google_play', 'app_store', 'web'
    purchase_token TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Viral metrics
CREATE TABLE IF NOT EXISTS viral_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'share', 'referral', 'invite'
    platform TEXT, -- 'facebook', 'twitter', 'whatsapp', etc.
    referral_code TEXT,
    referred_user_id TEXT,
    conversion_status TEXT DEFAULT 'pending', -- 'pending', 'converted', 'failed'
    metadata TEXT, -- JSON string
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_threats_user_id ON threats(user_id);
CREATE INDEX IF NOT EXISTS idx_threats_timestamp ON threats(timestamp);
CREATE INDEX IF NOT EXISTS idx_threats_type ON threats(threat_type);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_neural_metrics_user_id ON neural_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_community_threats_location ON community_threats(location);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_viral_metrics_user_id ON viral_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_viral_metrics_referral ON viral_metrics(referral_code);`;

  if (!existsSync('infrastructure/unified-bridge/cloudflare/schema')) {
    mkdirSync('infrastructure/unified-bridge/cloudflare/schema', { recursive: true });
  }
  
  writeFileSync('infrastructure/unified-bridge/cloudflare/schema/d1-schema.sql', schema);
  logSuccess('D1 database schema created');
}

function createEnvironmentTemplate() {
  const envTemplate = `# Universal Sentinel Environment Configuration
# Copy this file to .env and fill in your actual values

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=universal-sentinel-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=universal-sentinel-app
VITE_FIREBASE_STORAGE_BUCKET=universal-sentinel-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ZONE_ID=your_zone_id

# Google Play Configuration
GOOGLE_PLAY_PACKAGE_NAME=com.universalsentinel.app
GOOGLE_PLAY_PROJECT_ID=your_play_console_project_id
GOOGLE_PLAY_PRIVATE_KEY_ID=your_service_account_private_key_id
GOOGLE_PLAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nyour_private_key_here\\n-----END PRIVATE KEY-----\\n"
GOOGLE_PLAY_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PLAY_CLIENT_ID=your_client_id
GOOGLE_PLAY_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com

# App Configuration
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Universal Sentinel
VITE_API_URL=https://universal-sentinel-api.workers.dev
VITE_WS_URL=wss://universal-sentinel-api.workers.dev

# Development Configuration
NODE_ENV=development
VITE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CRASHLYTICS=true

# Security Configuration
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
API_RATE_LIMIT=1000

# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn
DATADOG_API_KEY=your_datadog_api_key
MIXPANEL_TOKEN=your_mixpanel_token

# Email Configuration (for notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
SUPPORT_EMAIL=support@universalsentinel.com
ADMIN_EMAIL=admin@universalsentinel.com

# Social Media Configuration (for viral features)
TWITTER_API_KEY=your_twitter_api_key
FACEBOOK_APP_ID=your_facebook_app_id
LINKEDIN_CLIENT_ID=your_linkedin_client_id

# Payment Configuration
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
PAYPAL_CLIENT_ID=your_paypal_client_id`;

  writeFileSync('.env.template', envTemplate);
  logSuccess('Environment template created');
}

function createGitIgnore() {
  const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
/dist
/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Firebase
.firebase/
firebase-debug.log
firebase-debug.*.log

# Cloudflare
.wrangler/

# Google Play
google-play-service-account.json
*.keystore
*.jks

# Mobile app builds
mobile_app/build/
mobile_app/.flutter-plugins
mobile_app/.flutter-plugins-dependencies
mobile_app/.dart_tool/
mobile_app/ios/Pods/
mobile_app/ios/.symlinks/
mobile_app/android/.gradle/
mobile_app/android/app/build/

# Testing
coverage/
test-results/
playwright-report/
test-results/

# Monitoring and analytics
lighthouse-report.json
bundle-analyzer-report.html

# Backup files
*.backup
*.bak

# OS generated files
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/

# Security
*.pem
*.key
*.crt
*.p12
service-account-*.json`;

  writeFileSync('.gitignore', gitignore);
  logSuccess('Git ignore file created');
}

function createDocumentation() {
  const quickStart = `# Universal Sentinel - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Firebase CLI
- Wrangler CLI
- Flutter (for mobile app)

### 1. Initialize the Bridge
\`\`\`bash
npm run bridge:init
\`\`\`

### 2. Configure Environment
1. Copy \`.env.template\` to \`.env\`
2. Fill in your Firebase, Cloudflare, and Google Play credentials
3. Update configuration files as needed

### 3. Deploy Everything
\`\`\`bash
npm run bridge:deploy
\`\`\`

## 🔧 Available Commands

### Bridge Commands
- \`npm run bridge:init\` - Initialize all services
- \`npm run bridge:deploy\` - Deploy everything
- \`npm run bridge:monitor\` - Monitor all services
- \`npm run bridge:status\` - Check service status

### Individual Service Commands
- \`npm run bridge:firebase-deploy\` - Deploy Firebase only
- \`npm run bridge:cloudflare-deploy\` - Deploy Cloudflare only
- \`npm run bridge:play-upload\` - Upload to Google Play

### Development Commands
- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests

## 📱 Mobile App Setup

### 1. Create Flutter App
\`\`\`bash
flutter create mobile_app
cd mobile_app
\`\`\`

### 2. Configure Firebase
\`\`\`bash
flutterfire configure
\`\`\`

### 3. Build and Deploy
\`\`\`bash
npm run bridge:mobile-update
\`\`\`

## 🔐 Security Setup

1. Configure Firebase security rules
2. Set up Cloudflare security headers
3. Configure Google Play app signing
4. Enable two-factor authentication

## 📊 Monitoring

- Firebase Console: Analytics and performance
- Cloudflare Dashboard: Edge performance
- Google Play Console: App metrics
- Custom monitoring dashboard

## 🆘 Troubleshooting

### Common Issues
1. **Firebase deployment fails**: Check project ID and permissions
2. **Cloudflare worker errors**: Verify account ID and API token
3. **Google Play upload fails**: Check service account permissions
4. **Mobile build errors**: Ensure Flutter is properly installed

### Getting Help
- Check the documentation in \`docs/\`
- Review logs with \`npm run bridge:logs\`
- Contact support at support@universalsentinel.com

## 🎯 Next Steps

1. Test all functionality
2. Configure monitoring alerts
3. Set up CI/CD pipeline
4. Launch marketing campaign
5. Monitor viral metrics

Happy coding! 🚀`;

  if (!existsSync('docs')) {
    mkdirSync('docs', { recursive: true });
  }
  
  writeFileSync('docs/QUICK_START.md', quickStart);
  logSuccess('Quick start documentation created');
}

async function main() {
  log('\n🌟 Universal Sentinel Bridge Initialization', 'bright');
  log('==========================================', 'bright');
  
  try {
    logStep(1, 'Creating Firebase configuration');
    createFirebaseConfig();
    createFirestoreRules();
    createFirestoreIndexes();
    createStorageRules();
    
    logStep(2, 'Creating Cloudflare configuration');
    createCloudflareConfig();
    createD1Schema();
    
    logStep(3, 'Creating environment template');
    createEnvironmentTemplate();
    
    logStep(4, 'Creating Git ignore file');
    createGitIgnore();
    
    logStep(5, 'Creating documentation');
    createDocumentation();
    
    log('\n🎉 Bridge Initialization Complete!', 'green');
    log('==================================', 'green');
    
    log('\n📋 Next Steps:', 'cyan');
    log('1. Copy .env.template to .env and fill in your credentials', 'yellow');
    log('2. Run: npm run bridge:deploy', 'yellow');
    log('3. Check docs/QUICK_START.md for detailed instructions', 'yellow');
    log('4. Monitor deployment with: npm run bridge:monitor', 'yellow');
    
    log('\n🚀 Ready to go viral! 🌟', 'magenta');
    
  } catch (error) {
    logError(`Initialization failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
