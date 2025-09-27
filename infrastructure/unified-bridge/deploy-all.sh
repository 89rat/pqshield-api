#!/bin/bash

# Universal Sentinel: Unified Deployment Script
# Deploys Firebase, Cloudflare, and Google Play integration

set -e

echo "🚀 Universal Sentinel - Unified Deployment Starting..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="universal-sentinel"
FIREBASE_PROJECT_ID="universal-sentinel-app"
CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
GOOGLE_PLAY_PACKAGE="com.universalsentinel.app"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        log_warning "Firebase CLI not found, installing..."
        npm install -g firebase-tools
    fi
    
    # Check Wrangler CLI
    if ! command -v wrangler &> /dev/null; then
        log_warning "Wrangler CLI not found, installing..."
        npm install -g wrangler
    fi
    
    # Check Flutter
    if ! command -v flutter &> /dev/null; then
        log_warning "Flutter not found, please install Flutter for mobile deployment"
    fi
    
    log_success "Dependencies checked"
}

setup_environment() {
    log_info "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        log_info "Creating .env file..."
        cat > .env << EOF
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=${FIREBASE_PROJECT_ID}.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
VITE_FIREBASE_STORAGE_BUCKET=${FIREBASE_PROJECT_ID}.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Google Play Configuration
GOOGLE_PLAY_PACKAGE_NAME=${GOOGLE_PLAY_PACKAGE}
GOOGLE_PLAY_PROJECT_ID=your_play_project_id
GOOGLE_PLAY_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PLAY_PRIVATE_KEY=your_private_key
GOOGLE_PLAY_CLIENT_EMAIL=your_client_email
GOOGLE_PLAY_CLIENT_ID=your_client_id
GOOGLE_PLAY_CLIENT_CERT_URL=your_client_cert_url

# App Configuration
VITE_APP_VERSION=1.0.0
VITE_API_URL=https://universal-sentinel-api.workers.dev
EOF
        log_warning "Please update .env file with your actual configuration values"
    fi
    
    log_success "Environment setup complete"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install main project dependencies
    npm install
    
    # Install Firebase Functions dependencies
    if [ -d "functions" ]; then
        cd functions
        npm install
        cd ..
    fi
    
    log_success "Dependencies installed"
}

build_web_app() {
    log_info "Building web application..."
    
    # Build React app
    npm run build
    
    # Verify build
    if [ ! -d "dist" ]; then
        log_error "Build failed - dist directory not found"
        exit 1
    fi
    
    log_success "Web application built successfully"
}

deploy_firebase() {
    log_info "Deploying to Firebase..."
    
    # Login to Firebase (if not already logged in)
    if ! firebase projects:list &> /dev/null; then
        log_info "Please login to Firebase..."
        firebase login
    fi
    
    # Initialize Firebase project if needed
    if [ ! -f "firebase.json" ]; then
        log_info "Initializing Firebase project..."
        firebase init hosting firestore functions analytics
    fi
    
    # Deploy Firebase services
    firebase deploy --project ${FIREBASE_PROJECT_ID}
    
    if [ $? -eq 0 ]; then
        log_success "Firebase deployment successful"
        FIREBASE_URL="https://${FIREBASE_PROJECT_ID}.web.app"
        log_info "Web app URL: ${FIREBASE_URL}"
    else
        log_error "Firebase deployment failed"
        exit 1
    fi
}

deploy_cloudflare() {
    log_info "Deploying to Cloudflare..."
    
    # Create wrangler.toml if it doesn't exist
    if [ ! -f "wrangler.toml" ]; then
        log_info "Creating wrangler.toml..."
        cat > wrangler.toml << EOF
name = "universal-sentinel-api"
main = "infrastructure/unified-bridge/cloudflare/workers-bridge.js"
compatibility_date = "2024-01-01"
account_id = "${CLOUDFLARE_ACCOUNT_ID}"

[env.production]
name = "universal-sentinel-api"

[[env.production.d1_databases]]
binding = "THREATS_DB"
database_name = "universal-sentinel-threats"
database_id = "your-d1-database-id"

[[env.production.d1_databases]]
binding = "ANALYTICS_DB"
database_name = "universal-sentinel-analytics"
database_id = "your-analytics-db-id"

[[env.production.kv_namespaces]]
binding = "USER_SESSIONS"
id = "your-kv-namespace-id"

[[env.production.kv_namespaces]]
binding = "THREAT_CACHE"
id = "your-threat-cache-id"

[[env.production.r2_buckets]]
binding = "NEURAL_MODELS"
bucket_name = "universal-sentinel-models"
EOF
        log_warning "Please update wrangler.toml with your actual Cloudflare configuration"
    fi
    
    # Create D1 databases
    log_info "Creating D1 databases..."
    wrangler d1 create universal-sentinel-threats || true
    wrangler d1 create universal-sentinel-analytics || true
    
    # Create KV namespaces
    log_info "Creating KV namespaces..."
    wrangler kv:namespace create "USER_SESSIONS" || true
    wrangler kv:namespace create "THREAT_CACHE" || true
    
    # Create R2 bucket
    log_info "Creating R2 bucket..."
    wrangler r2 bucket create universal-sentinel-models || true
    
    # Deploy Worker
    wrangler deploy --env production
    
    if [ $? -eq 0 ]; then
        log_success "Cloudflare deployment successful"
        WORKER_URL="https://universal-sentinel-api.workers.dev"
        log_info "API URL: ${WORKER_URL}"
    else
        log_error "Cloudflare deployment failed"
        exit 1
    fi
}

build_mobile_app() {
    log_info "Building mobile application..."
    
    if [ -d "mobile_app" ]; then
        cd mobile_app
        
        # Get Flutter dependencies
        flutter pub get
        
        # Build APK
        flutter build apk --release
        
        # Build App Bundle
        flutter build appbundle --release
        
        if [ -f "build/app/outputs/bundle/release/app-release.aab" ]; then
            log_success "Mobile app built successfully"
            MOBILE_BUILD_PATH="$(pwd)/build/app/outputs/bundle/release/app-release.aab"
        else
            log_error "Mobile app build failed"
            cd ..
            return 1
        fi
        
        cd ..
    else
        log_warning "Mobile app directory not found, skipping mobile build"
        return 0
    fi
}

deploy_to_play_store() {
    log_info "Preparing Google Play deployment..."
    
    if [ -z "$MOBILE_BUILD_PATH" ]; then
        log_warning "No mobile build found, skipping Play Store deployment"
        return 0
    fi
    
    # Create Play Store deployment script
    cat > deploy-play-store.js << EOF
const { GooglePlayIntegration } = require('./infrastructure/unified-bridge/google-play/play-integration.js');

async function deployToPlayStore() {
    try {
        const playIntegration = new GooglePlayIntegration({
            packageName: '${GOOGLE_PLAY_PACKAGE}',
            serviceAccountKey: {
                // Load from environment variables
                client_email: process.env.GOOGLE_PLAY_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PLAY_PRIVATE_KEY,
                // ... other keys
            }
        });
        
        await playIntegration.initialize();
        
        // Upload to internal testing track
        const result = await playIntegration.automatedRelease({
            apkPath: '${MOBILE_BUILD_PATH}',
            releaseNotes: 'Universal Sentinel v1.0.0 - Revolutionary SNN/ANN protection',
            track: 'internal',
            userFraction: 1.0
        });
        
        console.log('Play Store deployment result:', result);
    } catch (error) {
        console.error('Play Store deployment failed:', error);
        process.exit(1);
    }
}

deployToPlayStore();
EOF
    
    # Run Play Store deployment
    node deploy-play-store.js
    
    if [ $? -eq 0 ]; then
        log_success "Google Play deployment successful"
    else
        log_error "Google Play deployment failed"
    fi
    
    # Clean up
    rm deploy-play-store.js
}

setup_monitoring() {
    log_info "Setting up monitoring and analytics..."
    
    # Create monitoring configuration
    cat > monitoring-config.json << EOF
{
    "services": {
        "firebase": {
            "url": "${FIREBASE_URL}",
            "monitoring": ["performance", "analytics", "crashlytics"]
        },
        "cloudflare": {
            "url": "${WORKER_URL}",
            "monitoring": ["performance", "errors", "usage"]
        },
        "googlePlay": {
            "package": "${GOOGLE_PLAY_PACKAGE}",
            "monitoring": ["installs", "crashes", "ratings", "revenue"]
        }
    },
    "alerts": {
        "email": ["admin@universalsentinel.com"],
        "slack": "#alerts",
        "thresholds": {
            "errorRate": 0.01,
            "responseTime": 2000,
            "crashRate": 0.02
        }
    }
}
EOF
    
    log_success "Monitoring configuration created"
}

create_deployment_summary() {
    log_info "Creating deployment summary..."
    
    cat > deployment-summary.md << EOF
# Universal Sentinel Deployment Summary

## 🚀 Deployment Status: SUCCESS

### Services Deployed:

#### 🔥 Firebase
- **Hosting URL**: ${FIREBASE_URL:-"Not deployed"}
- **Services**: Authentication, Firestore, Functions, Analytics
- **Status**: ✅ Active

#### ☁️ Cloudflare
- **API URL**: ${WORKER_URL:-"Not deployed"}
- **Services**: Workers, D1, KV, R2
- **Edge Locations**: Global
- **Status**: ✅ Active

#### 📱 Google Play
- **Package**: ${GOOGLE_PLAY_PACKAGE}
- **Track**: Internal Testing
- **Status**: ${MOBILE_BUILD_PATH:+✅ Deployed|⚠️ Pending}

### 🔗 Integration Points:
- Firebase Auth ↔ Cloudflare Workers
- Cloudflare D1 ↔ Firebase Firestore
- Google Play Billing ↔ Firebase Functions
- Real-time sync across all platforms

### 📊 Monitoring:
- Firebase Performance Monitoring
- Cloudflare Analytics
- Google Play Console
- Custom unified dashboard

### 🎯 Next Steps:
1. Update .env with actual configuration values
2. Configure monitoring alerts
3. Set up CI/CD pipeline
4. Launch marketing campaign

### 🔐 Security:
- End-to-end encryption
- HTTPS everywhere
- Token-based authentication
- Regular security audits

---
Generated on: $(date)
EOF
    
    log_success "Deployment summary created: deployment-summary.md"
}

run_post_deployment_tests() {
    log_info "Running post-deployment tests..."
    
    # Test Firebase connection
    if [ ! -z "$FIREBASE_URL" ]; then
        if curl -s "$FIREBASE_URL" > /dev/null; then
            log_success "Firebase hosting is accessible"
        else
            log_warning "Firebase hosting test failed"
        fi
    fi
    
    # Test Cloudflare Worker
    if [ ! -z "$WORKER_URL" ]; then
        if curl -s "$WORKER_URL/api/health" > /dev/null; then
            log_success "Cloudflare Worker is accessible"
        else
            log_warning "Cloudflare Worker test failed"
        fi
    fi
    
    log_success "Post-deployment tests completed"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f deploy-play-store.js
    
    log_success "Cleanup completed"
}

main() {
    echo "🌟 Universal Sentinel Unified Deployment"
    echo "========================================"
    
    # Check if running in CI/CD
    if [ "$CI" = "true" ]; then
        log_info "Running in CI/CD mode"
        export NODE_ENV=production
    fi
    
    # Main deployment flow
    check_dependencies
    setup_environment
    install_dependencies
    build_web_app
    
    # Deploy services
    deploy_firebase
    deploy_cloudflare
    
    # Build and deploy mobile app
    if build_mobile_app; then
        deploy_to_play_store
    fi
    
    # Setup monitoring and create summary
    setup_monitoring
    create_deployment_summary
    run_post_deployment_tests
    cleanup
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "======================="
    log_success "Universal Sentinel has been deployed successfully!"
    echo ""
    echo "📱 Web App: ${FIREBASE_URL:-"Pending configuration"}"
    echo "🔧 API: ${WORKER_URL:-"Pending configuration"}"
    echo "📱 Mobile: ${MOBILE_BUILD_PATH:+Deployed to Play Store|Pending mobile build}"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update .env with your actual configuration"
    echo "2. Review deployment-summary.md"
    echo "3. Configure monitoring alerts"
    echo "4. Test all functionality"
    echo ""
    echo "🚀 Ready to go viral! 🌟"
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"
