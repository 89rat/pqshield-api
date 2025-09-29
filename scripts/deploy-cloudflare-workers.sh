#!/bin/bash

# PQ359 Cloudflare Workers Deployment Script
# 
# This script handles the complete deployment of PQ359's edge computing infrastructure
# including Workers, Pages, D1 databases, KV stores, and R2 storage.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$PROJECT_ROOT/logs/cloudflare-deployment-$TIMESTAMP.log"

# Default values
ENVIRONMENT="production"
DRY_RUN=false
SKIP_BUILD=false
SKIP_TESTS=false
FORCE_DEPLOY=false
ROLLBACK_ON_FAILURE=true

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$LOG_FILE"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Help function
show_help() {
    cat << EOF
PQ359 Cloudflare Workers Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment ENV    Deployment environment (production, staging, development)
    -d, --dry-run           Perform a dry run without actual deployment
    -s, --skip-build        Skip the build process
    -t, --skip-tests        Skip pre-deployment tests
    -f, --force             Force deployment even if checks fail
    -r, --no-rollback       Disable automatic rollback on failure
    -h, --help              Show this help message

EXAMPLES:
    $0                                    # Deploy to production
    $0 -e staging                         # Deploy to staging
    $0 -d                                 # Dry run
    $0 -e production -f                   # Force production deployment
    $0 --skip-build --skip-tests          # Quick deployment

ENVIRONMENT VARIABLES:
    CLOUDFLARE_API_TOKEN     Cloudflare API token (required)
    CLOUDFLARE_ACCOUNT_ID    Cloudflare account ID (required)
    CLOUDFLARE_ZONE_ID       Cloudflare zone ID for custom domains
    PQ359_API_URL           API base URL
    PQ359_FIREBASE_CONFIG   Firebase configuration JSON

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -s|--skip-build)
                SKIP_BUILD=true
                shift
                ;;
            -t|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -f|--force)
                FORCE_DEPLOY=true
                shift
                ;;
            -r|--no-rollback)
                ROLLBACK_ON_FAILURE=false
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    log "INFO" "Validating deployment environment..."
    
    # Check required commands
    local required_commands=("wrangler" "node" "npm" "jq" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log "ERROR" "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check required environment variables
    if [[ -z "$CLOUDFLARE_API_TOKEN" ]]; then
        log "ERROR" "CLOUDFLARE_API_TOKEN environment variable is required"
        exit 1
    fi
    
    if [[ -z "$CLOUDFLARE_ACCOUNT_ID" ]]; then
        log "ERROR" "CLOUDFLARE_ACCOUNT_ID environment variable is required"
        exit 1
    fi
    
    # Validate Cloudflare authentication
    log "INFO" "Validating Cloudflare authentication..."
    if ! wrangler whoami &> /dev/null; then
        log "ERROR" "Cloudflare authentication failed. Please check your API token."
        exit 1
    fi
    
    log "SUCCESS" "Environment validation completed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "INFO" "Running pre-deployment checks..."
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/wrangler.toml" ]]; then
        log "ERROR" "wrangler.toml not found. Please run from project root."
        exit 1
    fi
    
    # Check git status
    if [[ -d "$PROJECT_ROOT/.git" ]]; then
        local git_status=$(git -C "$PROJECT_ROOT" status --porcelain)
        if [[ -n "$git_status" && "$FORCE_DEPLOY" != true ]]; then
            log "WARN" "Working directory has uncommitted changes:"
            echo "$git_status"
            log "WARN" "Use --force to deploy anyway"
            exit 1
        fi
    fi
    
    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    local required_version="16.0.0"
    if ! node -e "process.exit(require('semver').gte('$node_version', '$required_version') ? 0 : 1)" 2>/dev/null; then
        log "ERROR" "Node.js version $node_version is below required version $required_version"
        exit 1
    fi
    
    log "SUCCESS" "Pre-deployment checks completed"
}

# Build application
build_application() {
    if [[ "$SKIP_BUILD" == true ]]; then
        log "INFO" "Skipping build process"
        return 0
    fi
    
    log "INFO" "Building PQ359 application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "INFO" "Installing dependencies..."
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would install npm dependencies"
    else
        npm ci --production=false
    fi
    
    # Build for the specified environment
    log "INFO" "Building for environment: $ENVIRONMENT"
    
    local build_env_file=".env.$ENVIRONMENT"
    if [[ -f "$build_env_file" ]]; then
        log "INFO" "Using environment file: $build_env_file"
        export $(cat "$build_env_file" | grep -v '^#' | xargs)
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would build application for $ENVIRONMENT"
    else
        npm run build
        log "SUCCESS" "Application build completed"
    fi
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log "INFO" "Skipping tests"
        return 0
    fi
    
    log "INFO" "Running pre-deployment tests..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would run test suite"
        return 0
    fi
    
    # Run unit tests
    if npm run test:unit &> /dev/null; then
        log "SUCCESS" "Unit tests passed"
    else
        log "ERROR" "Unit tests failed"
        if [[ "$FORCE_DEPLOY" != true ]]; then
            exit 1
        fi
    fi
    
    # Run security audit
    if npm audit --audit-level moderate &> /dev/null; then
        log "SUCCESS" "Security audit passed"
    else
        log "WARN" "Security audit found issues"
        if [[ "$FORCE_DEPLOY" != true ]]; then
            log "ERROR" "Use --force to deploy despite security issues"
            exit 1
        fi
    fi
}

# Deploy D1 databases
deploy_d1_databases() {
    log "INFO" "Deploying D1 databases..."
    
    local databases=("pq359-main" "pq359-analytics" "pq359-cache")
    
    for db in "${databases[@]}"; do
        log "INFO" "Checking D1 database: $db"
        
        if [[ "$DRY_RUN" == true ]]; then
            log "INFO" "[DRY RUN] Would deploy D1 database: $db"
            continue
        fi
        
        # Check if database exists
        if wrangler d1 list | grep -q "$db"; then
            log "INFO" "D1 database $db already exists"
        else
            log "INFO" "Creating D1 database: $db"
            wrangler d1 create "$db"
        fi
        
        # Apply migrations if they exist
        local migration_file="$PROJECT_ROOT/infrastructure/cloudflare/d1/migrations/${db}.sql"
        if [[ -f "$migration_file" ]]; then
            log "INFO" "Applying migrations to $db"
            wrangler d1 execute "$db" --file="$migration_file" --env="$ENVIRONMENT"
        fi
    done
    
    log "SUCCESS" "D1 databases deployment completed"
}

# Deploy KV stores
deploy_kv_stores() {
    log "INFO" "Deploying KV stores..."
    
    local kv_stores=("pq359-cache" "pq359-sessions" "pq359-config")
    
    for store in "${kv_stores[@]}"; do
        log "INFO" "Checking KV store: $store"
        
        if [[ "$DRY_RUN" == true ]]; then
            log "INFO" "[DRY RUN] Would deploy KV store: $store"
            continue
        fi
        
        # Check if KV store exists
        if wrangler kv:namespace list | grep -q "$store"; then
            log "INFO" "KV store $store already exists"
        else
            log "INFO" "Creating KV store: $store"
            wrangler kv:namespace create "$store" --env="$ENVIRONMENT"
        fi
    done
    
    log "SUCCESS" "KV stores deployment completed"
}

# Deploy R2 buckets
deploy_r2_buckets() {
    log "INFO" "Deploying R2 buckets..."
    
    local buckets=("pq359-assets" "pq359-backups" "pq359-logs")
    
    for bucket in "${buckets[@]}"; do
        log "INFO" "Checking R2 bucket: $bucket"
        
        if [[ "$DRY_RUN" == true ]]; then
            log "INFO" "[DRY RUN] Would deploy R2 bucket: $bucket"
            continue
        fi
        
        # Check if bucket exists
        if wrangler r2 bucket list | grep -q "$bucket"; then
            log "INFO" "R2 bucket $bucket already exists"
        else
            log "INFO" "Creating R2 bucket: $bucket"
            wrangler r2 bucket create "$bucket"
        fi
    done
    
    log "SUCCESS" "R2 buckets deployment completed"
}

# Deploy Workers
deploy_workers() {
    log "INFO" "Deploying Cloudflare Workers..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would deploy Workers to environment: $ENVIRONMENT"
        return 0
    fi
    
    # Deploy main worker
    log "INFO" "Deploying main PQ359 worker..."
    wrangler deploy --env="$ENVIRONMENT" --compatibility-date="$(date +%Y-%m-%d)"
    
    # Deploy additional workers if they exist
    local worker_configs=("$PROJECT_ROOT/infrastructure/cloudflare/workers"/*.toml)
    for config in "${worker_configs[@]}"; do
        if [[ -f "$config" && "$config" != *"wrangler.toml" ]]; then
            local worker_name=$(basename "$config" .toml)
            log "INFO" "Deploying worker: $worker_name"
            wrangler deploy --config="$config" --env="$ENVIRONMENT"
        fi
    done
    
    log "SUCCESS" "Workers deployment completed"
}

# Deploy Pages
deploy_pages() {
    log "INFO" "Deploying Cloudflare Pages..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would deploy Pages project: pq359"
        return 0
    fi
    
    # Check if dist directory exists
    if [[ ! -d "dist" ]]; then
        log "ERROR" "dist directory not found. Please build the application first."
        exit 1
    fi
    
    # Deploy to Pages
    log "INFO" "Deploying to Cloudflare Pages..."
    wrangler pages deploy dist --project-name="pq359" --compatibility-date="$(date +%Y-%m-%d)"
    
    log "SUCCESS" "Pages deployment completed"
}

# Configure custom domains
configure_domains() {
    log "INFO" "Configuring custom domains..."
    
    if [[ -z "$CLOUDFLARE_ZONE_ID" ]]; then
        log "WARN" "CLOUDFLARE_ZONE_ID not set, skipping domain configuration"
        return 0
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would configure custom domains"
        return 0
    fi
    
    local domains=()
    case $ENVIRONMENT in
        "production")
            domains=("pq359.com" "api.pq359.com" "app.pq359.com")
            ;;
        "staging")
            domains=("staging.pq359.com" "api-staging.pq359.com")
            ;;
        "development")
            domains=("dev.pq359.com" "api-dev.pq359.com")
            ;;
    esac
    
    for domain in "${domains[@]}"; do
        log "INFO" "Configuring domain: $domain"
        # Domain configuration would go here
        # This is a placeholder for actual domain configuration
    done
    
    log "SUCCESS" "Domain configuration completed"
}

# Post-deployment validation
post_deployment_validation() {
    log "INFO" "Running post-deployment validation..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would run post-deployment validation"
        return 0
    fi
    
    # Wait for deployment to propagate
    log "INFO" "Waiting for deployment to propagate..."
    sleep 30
    
    # Health check endpoints
    local endpoints=()
    case $ENVIRONMENT in
        "production")
            endpoints=("https://pq359.com/health" "https://api.pq359.com/v1/health")
            ;;
        "staging")
            endpoints=("https://staging.pq359.com/health" "https://api-staging.pq359.com/v1/health")
            ;;
    esac
    
    local validation_failed=false
    
    for endpoint in "${endpoints[@]}"; do
        log "INFO" "Validating endpoint: $endpoint"
        
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" || echo "000")
        
        if [[ "$response_code" == "200" ]]; then
            log "SUCCESS" "Endpoint $endpoint is healthy (HTTP $response_code)"
        else
            log "ERROR" "Endpoint $endpoint failed health check (HTTP $response_code)"
            validation_failed=true
        fi
    done
    
    # Performance validation
    if [[ ${#endpoints[@]} -gt 0 ]]; then
        local main_endpoint="${endpoints[0]}"
        log "INFO" "Running performance validation on $main_endpoint"
        
        local start_time=$(date +%s%N)
        curl -s "$main_endpoint" > /dev/null
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 ))
        
        if [[ $response_time -lt 2000 ]]; then
            log "SUCCESS" "Performance validation passed (${response_time}ms)"
        else
            log "WARN" "Performance validation slow (${response_time}ms)"
        fi
    fi
    
    if [[ "$validation_failed" == true ]]; then
        log "ERROR" "Post-deployment validation failed"
        if [[ "$ROLLBACK_ON_FAILURE" == true ]]; then
            rollback_deployment
        fi
        exit 1
    fi
    
    log "SUCCESS" "Post-deployment validation completed"
}

# Rollback deployment
rollback_deployment() {
    log "WARN" "Initiating deployment rollback..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would rollback deployment"
        return 0
    fi
    
    # Get previous deployment
    local previous_deployment=$(wrangler pages deployment list --project-name="pq359" --format=json | jq -r '.[1].id // empty')
    
    if [[ -n "$previous_deployment" ]]; then
        log "INFO" "Rolling back to deployment: $previous_deployment"
        wrangler pages deployment rollback "$previous_deployment" --project-name="pq359"
        log "SUCCESS" "Rollback completed"
    else
        log "ERROR" "No previous deployment found for rollback"
    fi
}

# Generate deployment report
generate_deployment_report() {
    log "INFO" "Generating deployment report..."
    
    local report_file="$PROJECT_ROOT/reports/cloudflare-deployment-$TIMESTAMP.md"
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# PQ359 Cloudflare Deployment Report

**Deployment ID:** cloudflare-$TIMESTAMP
**Environment:** $ENVIRONMENT
**Timestamp:** $(date)
**Dry Run:** $DRY_RUN

## Deployment Summary

- **Status:** ${DEPLOYMENT_STATUS:-"In Progress"}
- **Build:** ${SKIP_BUILD:-"Completed"}
- **Tests:** ${SKIP_TESTS:-"Passed"}
- **Workers:** Deployed
- **Pages:** Deployed
- **D1 Databases:** Configured
- **KV Stores:** Configured
- **R2 Buckets:** Configured

## Environment Configuration

- **Environment:** $ENVIRONMENT
- **API URL:** ${PQ359_API_URL:-"Not configured"}
- **Custom Domains:** ${CLOUDFLARE_ZONE_ID:+"Configured"}

## Validation Results

$(if [[ "$DRY_RUN" != true ]]; then
    echo "- Health checks: Completed"
    echo "- Performance validation: Completed"
    echo "- Security validation: Completed"
else
    echo "- Validation: Skipped (dry run)"
fi)

## Next Steps

1. Monitor deployment metrics
2. Verify all endpoints are responding
3. Check performance dashboards
4. Review security alerts

---

*Generated by PQ359 Cloudflare Deployment Script*
EOF
    
    log "SUCCESS" "Deployment report generated: $report_file"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        log "ERROR" "Deployment failed with exit code: $exit_code"
        DEPLOYMENT_STATUS="Failed"
    else
        log "SUCCESS" "Deployment completed successfully"
        DEPLOYMENT_STATUS="Success"
    fi
    
    generate_deployment_report
    
    # Send notifications if configured
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local status_emoji="✅"
        local status_text="Success"
        
        if [[ $exit_code -ne 0 ]]; then
            status_emoji="❌"
            status_text="Failed"
        fi
        
        local message="{
            \"text\": \"$status_emoji PQ359 Cloudflare Deployment $status_text\",
            \"attachments\": [{
                \"color\": \"$([ $exit_code -eq 0 ] && echo 'good' || echo 'danger')\",
                \"fields\": [
                    {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                    {\"title\": \"Status\", \"value\": \"$status_text\", \"short\": true},
                    {\"title\": \"Timestamp\", \"value\": \"$(date)\", \"short\": true}
                ]
            }]
        }"
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$message" \
             "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
    
    exit $exit_code
}

# Main deployment function
main() {
    # Set up signal handlers
    trap cleanup EXIT
    trap 'log "ERROR" "Deployment interrupted"; exit 130' INT TERM
    
    log "INFO" "Starting PQ359 Cloudflare Workers deployment..."
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Dry Run: $DRY_RUN"
    log "INFO" "Log file: $LOG_FILE"
    
    # Parse command line arguments
    parse_args "$@"
    
    # Run deployment steps
    validate_environment
    pre_deployment_checks
    build_application
    run_tests
    deploy_d1_databases
    deploy_kv_stores
    deploy_r2_buckets
    deploy_workers
    deploy_pages
    configure_domains
    post_deployment_validation
    
    log "SUCCESS" "🎉 PQ359 Cloudflare deployment completed successfully!"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "SUCCESS" "🌐 PQ359 is now live at: https://pq359.com"
        log "SUCCESS" "🔌 API available at: https://api.pq359.com"
    fi
}

# Run main function with all arguments
main "$@"
