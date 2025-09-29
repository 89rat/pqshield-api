#!/bin/bash

# PQ359 Production Deployment Script
# This script handles the complete production deployment process

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
BRANCH=${2:-main}
PROJECT_NAME="pq359"
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ENABLED=true

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check required tools
    local tools=("git" "docker" "docker-compose" "curl" "jq" "wrangler" "firebase")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    
    # Check environment variables
    local required_vars=(
        "CLOUDFLARE_API_TOKEN"
        "CLOUDFLARE_ACCOUNT_ID" 
        "FIREBASE_TOKEN"
        "FIREBASE_PROJECT_ID"
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "STRIPE_SECRET_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    success "Prerequisites check passed"
}

# Pre-deployment tests
run_pre_deployment_tests() {
    log "Running pre-deployment tests..."
    
    # Security audit
    log "Running security audit..."
    pnpm audit --audit-level moderate || {
        error "Security audit failed"
        exit 1
    }
    
    # Unit tests
    log "Running unit tests..."
    pnpm run test || {
        error "Unit tests failed"
        exit 1
    }
    
    # Build test
    log "Testing production build..."
    pnpm run build || {
        error "Production build failed"
        exit 1
    }
    
    # Load test (basic)
    log "Running basic load test..."
    if command -v ab &> /dev/null; then
        ab -n 100 -c 10 http://localhost:5173/ || warning "Load test failed (non-critical)"
    fi
    
    success "Pre-deployment tests passed"
}

# Backup current deployment
backup_current_deployment() {
    if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
        log "Creating deployment backup..."
        
        local backup_tag="backup-$(date +%Y%m%d-%H%M%S)"
        
        # Tag current deployment
        git tag "$backup_tag" || warning "Failed to create backup tag"
        
        # Backup database (if applicable)
        if [[ -n "${DATABASE_URL:-}" ]]; then
            log "Backing up database..."
            # Add database backup logic here
        fi
        
        success "Backup created with tag: $backup_tag"
    fi
}

# Deploy to Cloudflare
deploy_cloudflare() {
    log "Deploying to Cloudflare..."
    
    # Deploy Pages
    log "Deploying to Cloudflare Pages..."
    wrangler pages deploy dist --project-name="$PROJECT_NAME" --env="$DEPLOY_ENV" || {
        error "Cloudflare Pages deployment failed"
        return 1
    }
    
    # Deploy Workers
    log "Deploying Cloudflare Workers..."
    wrangler deploy --env="$DEPLOY_ENV" || {
        error "Cloudflare Workers deployment failed"
        return 1
    }
    
    success "Cloudflare deployment completed"
}

# Deploy to Firebase
deploy_firebase() {
    log "Deploying to Firebase..."
    
    # Deploy Functions
    firebase deploy --only functions --project="$FIREBASE_PROJECT_ID" --token="$FIREBASE_TOKEN" || {
        error "Firebase Functions deployment failed"
        return 1
    }
    
    # Deploy Firestore rules
    firebase deploy --only firestore:rules --project="$FIREBASE_PROJECT_ID" --token="$FIREBASE_TOKEN" || {
        error "Firebase Firestore rules deployment failed"
        return 1
    }
    
    # Deploy Storage rules
    firebase deploy --only storage:rules --project="$FIREBASE_PROJECT_ID" --token="$FIREBASE_TOKEN" || {
        error "Firebase Storage rules deployment failed"
        return 1
    }
    
    success "Firebase deployment completed"
}

# Health checks
run_health_checks() {
    log "Running post-deployment health checks..."
    
    local endpoints=(
        "https://pq359.com/health"
        "https://api.pq359.com/v1/health"
        "https://pq359.com/api/neural/health"
    )
    
    local start_time=$(date +%s)
    local timeout=$HEALTH_CHECK_TIMEOUT
    
    for endpoint in "${endpoints[@]}"; do
        log "Checking $endpoint..."
        
        local retries=0
        local max_retries=10
        
        while [[ $retries -lt $max_retries ]]; do
            local current_time=$(date +%s)
            local elapsed=$((current_time - start_time))
            
            if [[ $elapsed -gt $timeout ]]; then
                error "Health check timeout exceeded"
                return 1
            fi
            
            if curl -f -s "$endpoint" > /dev/null; then
                success "$endpoint is healthy"
                break
            else
                warning "$endpoint not ready, retrying in 10s... ($((retries + 1))/$max_retries)"
                sleep 10
                ((retries++))
            fi
            
            if [[ $retries -eq $max_retries ]]; then
                error "$endpoint failed health check"
                return 1
            fi
        done
    done
    
    success "All health checks passed"
}

# Performance validation
validate_performance() {
    log "Validating performance metrics..."
    
    # Check response times
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' https://pq359.com/)
    local response_time_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time_ms > 2000" | bc -l) )); then
        warning "Response time is high: ${response_time_ms}ms"
    else
        success "Response time is good: ${response_time_ms}ms"
    fi
    
    # Check security headers
    log "Validating security headers..."
    local security_headers=(
        "X-Frame-Options"
        "X-Content-Type-Options"
        "Strict-Transport-Security"
    )
    
    for header in "${security_headers[@]}"; do
        if curl -I -s https://pq359.com/ | grep -q "$header"; then
            success "$header is present"
        else
            warning "$header is missing"
        fi
    done
}

# Rollback function
rollback_deployment() {
    if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
        error "Deployment failed, initiating rollback..."
        
        # Get the latest backup tag
        local backup_tag=$(git tag -l "backup-*" | sort -V | tail -n1)
        
        if [[ -n "$backup_tag" ]]; then
            log "Rolling back to $backup_tag..."
            git checkout "$backup_tag"
            
            # Redeploy previous version
            pnpm run build
            deploy_cloudflare
            deploy_firebase
            
            success "Rollback completed"
        else
            error "No backup found for rollback"
        fi
    fi
}

# Notification function
send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "${DISCORD_WEBHOOK:-}" ]]; then
        local color
        case $status in
            "success") color="3066993" ;;  # Green
            "error") color="15158332" ;;   # Red
            "warning") color="15105570" ;; # Orange
            *) color="3447003" ;;          # Blue
        esac
        
        curl -H "Content-Type: application/json" \
             -X POST \
             -d "{\"embeds\": [{\"title\": \"PQ359 Deployment\", \"description\": \"$message\", \"color\": $color, \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}]}" \
             "$DISCORD_WEBHOOK" || warning "Failed to send Discord notification"
    fi
    
    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        local emoji
        case $status in
            "success") emoji=":white_check_mark:" ;;
            "error") emoji=":x:" ;;
            "warning") emoji=":warning:" ;;
            *) emoji=":information_source:" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"$emoji PQ359 Deployment: $message\"}" \
             "$SLACK_WEBHOOK" || warning "Failed to send Slack notification"
    fi
}

# Main deployment function
main() {
    log "Starting PQ359 production deployment..."
    log "Environment: $DEPLOY_ENV"
    log "Branch: $BRANCH"
    
    # Trap errors for rollback
    trap 'rollback_deployment; send_notification "error" "Deployment failed and rollback initiated"' ERR
    
    # Deployment steps
    check_prerequisites
    
    # Checkout correct branch
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
    # Install dependencies
    log "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    run_pre_deployment_tests
    backup_current_deployment
    
    # Build for production
    log "Building for production..."
    pnpm run build
    
    # Deploy services
    deploy_cloudflare
    deploy_firebase
    
    # Validation
    run_health_checks
    validate_performance
    
    # Success notification
    send_notification "success" "Deployment completed successfully! 🚀 https://pq359.com"
    
    success "🎉 PQ359 deployment completed successfully!"
    success "🌐 Web App: https://pq359.com"
    success "🔌 API: https://api.pq359.com"
    success "📊 Dashboard: https://dashboard.pq359.com"
    
    # Clean up
    log "Cleaning up temporary files..."
    rm -rf node_modules/.cache || true
    
    log "Deployment completed at $(date)"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
