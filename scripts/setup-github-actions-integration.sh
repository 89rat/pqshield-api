#!/bin/bash

# PQ359 GitHub Actions + Cloudflare Integration Setup Script
# 
# This script automates the setup of GitHub Actions integration with
# the Cloudflare Workers deployment system.

set -e

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

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
    esac
}

# Help function
show_help() {
    cat << EOF
PQ359 GitHub Actions + Cloudflare Integration Setup

This script sets up the complete GitHub Actions integration with Cloudflare Workers
deployment for automated CI/CD.

Usage: $0 [OPTIONS]

OPTIONS:
    -i, --interactive       Interactive setup with prompts
    -f, --force            Force overwrite existing files
    -d, --dry-run          Show what would be done without making changes
    -h, --help             Show this help message

WHAT THIS SCRIPT DOES:
    1. Creates .github/workflows directory
    2. Copies integrated CI/CD workflow
    3. Sets up environment protection rules (instructions)
    4. Generates secrets configuration template
    5. Creates integration documentation
    6. Validates GitHub repository setup

EXAMPLES:
    $0                     # Standard setup
    $0 --interactive       # Interactive setup with prompts
    $0 --dry-run          # Preview changes without applying

EOF
}

# Parse command line arguments
INTERACTIVE=false
FORCE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--interactive)
            INTERACTIVE=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
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

# Check if we're in a git repository
check_git_repository() {
    log "INFO" "Checking Git repository..."
    
    if [[ ! -d "$PROJECT_ROOT/.git" ]]; then
        log "ERROR" "Not in a Git repository. Please run from the project root."
        exit 1
    fi
    
    # Check if we have a GitHub remote
    if ! git remote -v | grep -q "github.com"; then
        log "WARN" "No GitHub remote found. Make sure this repository is hosted on GitHub."
    fi
    
    log "SUCCESS" "Git repository validated"
}

# Create GitHub Actions directory structure
setup_github_actions_directory() {
    log "INFO" "Setting up GitHub Actions directory structure..."
    
    local workflows_dir="$PROJECT_ROOT/.github/workflows"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would create directory: $workflows_dir"
        return 0
    fi
    
    if [[ -d "$workflows_dir" && "$FORCE" != true ]]; then
        log "WARN" "GitHub Actions workflows directory already exists"
        if [[ "$INTERACTIVE" == true ]]; then
            read -p "Overwrite existing workflows? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "INFO" "Skipping workflow setup"
                return 0
            fi
        else
            log "INFO" "Use --force to overwrite existing workflows"
            return 0
        fi
    fi
    
    mkdir -p "$workflows_dir"
    log "SUCCESS" "GitHub Actions directory created"
}

# Copy integrated workflow
copy_integrated_workflow() {
    log "INFO" "Copying integrated CI/CD workflow..."
    
    local source_workflow="$PROJECT_ROOT/docs/workflows/integrated-ci-cd.yml"
    local target_workflow="$PROJECT_ROOT/.github/workflows/integrated-ci-cd.yml"
    
    if [[ ! -f "$source_workflow" ]]; then
        log "ERROR" "Source workflow not found: $source_workflow"
        exit 1
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would copy workflow: $source_workflow -> $target_workflow"
        return 0
    fi
    
    cp "$source_workflow" "$target_workflow"
    log "SUCCESS" "Integrated CI/CD workflow copied"
}

# Generate secrets configuration template
generate_secrets_template() {
    log "INFO" "Generating secrets configuration template..."
    
    local secrets_file="$PROJECT_ROOT/.github/SECRETS_TEMPLATE.md"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would create secrets template: $secrets_file"
        return 0
    fi
    
    cat > "$secrets_file" << 'EOF'
# GitHub Secrets Configuration for PQ359

## Required Secrets

Go to `Settings > Secrets and variables > Actions` and add these secrets:

### 🔑 Cloudflare Configuration
```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_ZONE_ID=your_zone_id_for_custom_domains
```

### 🗄️ Cloudflare Resource IDs
These will be generated during first deployment:
```
PQ359_MAIN_DB_ID=your_d1_database_id
PQ359_ANALYTICS_DB_ID=your_analytics_db_id
PQ359_CACHE_DB_ID=your_cache_db_id
PQ359_CACHE_KV_ID=your_cache_kv_id
PQ359_SESSIONS_KV_ID=your_sessions_kv_id
PQ359_CONFIG_KV_ID=your_config_kv_id
```

### 🔧 Application Configuration
```
VITE_API_URL=https://api.pq359.com
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}
```

### 📢 Optional: Notifications
```
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

## How to Get These Values

### Cloudflare API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Add additional permissions for Pages, D1, KV, R2

### Cloudflare Account ID
1. Go to your Cloudflare dashboard
2. Select your domain
3. Copy Account ID from the right sidebar

### Cloudflare Zone ID
1. Go to your Cloudflare dashboard
2. Select your domain
3. Copy Zone ID from the right sidebar

### Firebase Configuration
1. Go to Firebase Console
2. Project Settings > General
3. Copy the config object from "Firebase SDK snippet"

## Environment Protection Setup

1. Go to `Settings > Environments`
2. Create environments: `production`, `staging`
3. For production environment:
   - Add required reviewers
   - Set deployment branches: `main`, `pq359-launch-clean`
   - Optional: Add wait timer

## First Deployment

After setting up secrets, the first deployment will:
1. Create all Cloudflare resources (D1, KV, R2)
2. Output the resource IDs
3. You'll need to add these IDs as secrets for future deployments

## Validation

Test your setup with:
```bash
# Trigger manual deployment
gh workflow run "PQ359 Integrated CI/CD with Cloudflare" \
  --field environment=staging \
  --field dry_run=true
```
EOF
    
    log "SUCCESS" "Secrets template generated: $secrets_file"
}

# Create environment protection instructions
create_environment_instructions() {
    log "INFO" "Creating environment protection instructions..."
    
    local env_file="$PROJECT_ROOT/.github/ENVIRONMENT_SETUP.md"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would create environment instructions: $env_file"
        return 0
    fi
    
    cat > "$env_file" << 'EOF'
# GitHub Environment Protection Setup

## Overview

GitHub Environments provide deployment protection and environment-specific secrets.
This setup ensures safe deployments to production while allowing automatic deployments to staging.

## Step-by-Step Setup

### 1. Access Environment Settings
1. Go to your repository on GitHub
2. Click `Settings` tab
3. Click `Environments` in the left sidebar

### 2. Create Production Environment
1. Click `New environment`
2. Name: `production`
3. Configure protection rules:

#### Protection Rules
- ✅ **Required reviewers**: Add team members who can approve production deployments
- ✅ **Wait timer**: Optional 5-minute delay for final checks
- ✅ **Deployment branches**: Restrict to `main` and `pq359-launch-clean` branches

#### Environment Secrets
Add production-specific secrets (if different from repository secrets):
```
VITE_API_URL=https://api.pq359.com
CLOUDFLARE_ZONE_ID=your_production_zone_id
```

### 3. Create Staging Environment
1. Click `New environment`
2. Name: `staging`
3. Configure protection rules:

#### Protection Rules
- ❌ **Required reviewers**: Not needed for staging
- ❌ **Wait timer**: Not needed for staging
- ✅ **Deployment branches**: Restrict to `staging` and `develop` branches

#### Environment Secrets
Add staging-specific secrets:
```
VITE_API_URL=https://api-staging.pq359.com
CLOUDFLARE_ZONE_ID=your_staging_zone_id
```

### 4. Create Development Environment (Optional)
1. Click `New environment`
2. Name: `development`
3. No protection rules needed
4. Add development-specific secrets

## Environment URLs

The workflow automatically determines URLs based on environment:

### Production
- **Web App**: https://pq359.com
- **API**: https://api.pq359.com
- **Neural Network**: https://neural.pq359.com

### Staging
- **Web App**: https://staging.pq359.com
- **API**: https://api-staging.pq359.com
- **Neural Network**: https://neural-staging.pq359.com

### Development
- **Web App**: https://dev.pq359.com
- **API**: https://api-dev.pq359.com
- **Neural Network**: https://neural-dev.pq359.com

## Deployment Flow

### Automatic Deployments
- **Push to `main`** → Production (with approval)
- **Push to `pq359-launch-clean`** → Production (with approval)
- **Push to `staging`** → Staging (automatic)
- **Push to `develop`** → Development (automatic)

### Manual Deployments
Use workflow dispatch to deploy any branch to any environment:
```bash
gh workflow run "PQ359 Integrated CI/CD with Cloudflare" \
  --field environment=production \
  --field force_deploy=true
```

## Approval Process

### Production Deployments
1. Developer pushes to `main` or creates PR
2. GitHub Actions runs CI/CD pipeline
3. Pipeline pauses at production deployment
4. Designated reviewers receive notification
5. Reviewers can approve or reject deployment
6. On approval, deployment proceeds automatically

### Emergency Deployments
For hotfixes and urgent deployments:
```bash
gh workflow run "PQ359 Integrated CI/CD with Cloudflare" \
  --field environment=production \
  --field force_deploy=true \
  --field skip_tests=true
```

## Monitoring

### Deployment Status
- Check GitHub Actions tab for real-time status
- Slack notifications (if configured)
- Email notifications for approvals

### Post-Deployment
- Automatic health checks validate deployment
- Performance metrics collected
- Security scans run automatically

## Troubleshooting

### Approval Issues
- Ensure reviewers have repository access
- Check notification settings
- Verify environment protection rules

### Deployment Failures
- Check GitHub Actions logs
- Review Cloudflare dashboard
- Validate secrets configuration

### Emergency Rollback
```bash
# Rollback using Cloudflare dashboard
# Or trigger new deployment with previous commit
gh workflow run "PQ359 Integrated CI/CD with Cloudflare" \
  --ref previous-working-commit \
  --field environment=production \
  --field force_deploy=true
```
EOF
    
    log "SUCCESS" "Environment instructions created: $env_file"
}

# Validate GitHub CLI
validate_github_cli() {
    log "INFO" "Validating GitHub CLI..."
    
    if ! command -v gh &> /dev/null; then
        log "WARN" "GitHub CLI not found. Install from: https://cli.github.com/"
        return 0
    fi
    
    if ! gh auth status &> /dev/null; then
        log "WARN" "GitHub CLI not authenticated. Run: gh auth login"
        return 0
    fi
    
    log "SUCCESS" "GitHub CLI validated"
}

# Create integration summary
create_integration_summary() {
    log "INFO" "Creating integration summary..."
    
    local summary_file="$PROJECT_ROOT/.github/INTEGRATION_SUMMARY.md"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would create integration summary: $summary_file"
        return 0
    fi
    
    cat > "$summary_file" << EOF
# PQ359 GitHub Actions + Cloudflare Integration Summary

## ✅ Setup Complete

The GitHub Actions + Cloudflare Workers integration has been successfully configured.

## 📁 Files Created

- \`.github/workflows/integrated-ci-cd.yml\` - Main CI/CD workflow
- \`.github/SECRETS_TEMPLATE.md\` - Secrets configuration guide
- \`.github/ENVIRONMENT_SETUP.md\` - Environment protection setup
- \`.github/INTEGRATION_SUMMARY.md\` - This summary

## 🚀 Next Steps

### 1. Configure Secrets
Follow the guide in \`.github/SECRETS_TEMPLATE.md\` to set up repository secrets.

### 2. Set Up Environment Protection
Follow the guide in \`.github/ENVIRONMENT_SETUP.md\` to configure environment protection.

### 3. Test Integration
```bash
# Test with dry run
gh workflow run "PQ359 Integrated CI/CD with Cloudflare" \\
  --field environment=staging \\
  --field dry_run=true

# First real deployment
git push origin staging
```

### 4. Monitor Deployment
- Check GitHub Actions tab for pipeline status
- Review Cloudflare dashboard for resource creation
- Validate deployment at staging URL

## 🎯 Deployment Triggers

### Automatic
- **Production**: Push to \`main\` or \`pq359-launch-clean\`
- **Staging**: Push to \`staging\`
- **Development**: Push to \`develop\`

### Manual
```bash
gh workflow run "PQ359 Integrated CI/CD with Cloudflare" \\
  --field environment=production \\
  --field force_deploy=true
```

## 🛡️ Security Features

- ✅ Environment protection for production
- ✅ Required approvals for production deployments
- ✅ Automatic security scanning
- ✅ Secret management through GitHub Secrets
- ✅ Comprehensive audit logging

## 📊 Monitoring

- ✅ Real-time deployment status
- ✅ Post-deployment health checks
- ✅ Performance validation
- ✅ Security monitoring
- ✅ Slack notifications (if configured)

## 🆘 Support

### Documentation
- [GitHub Actions Guide](../docs/GITHUB_ACTIONS_GUIDE.md)
- [Cloudflare Deployment Guide](../docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md)
- [Integration Guide](../docs/GITHUB_ACTIONS_CLOUDFLARE_INTEGRATION.md)

### Troubleshooting
1. Check GitHub Actions logs
2. Review Cloudflare dashboard
3. Validate secrets configuration
4. Check environment protection settings

---

**Ready for enterprise-grade CI/CD with Cloudflare Workers!** 🚀🛡️

Generated on: $(date)
EOF
    
    log "SUCCESS" "Integration summary created: $summary_file"
}

# Main setup function
main() {
    log "INFO" "🚀 Starting PQ359 GitHub Actions + Cloudflare Integration Setup"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "🔍 DRY RUN MODE - No changes will be made"
    fi
    
    # Run setup steps
    check_git_repository
    validate_github_cli
    setup_github_actions_directory
    copy_integrated_workflow
    generate_secrets_template
    create_environment_instructions
    create_integration_summary
    
    log "SUCCESS" "🎉 GitHub Actions + Cloudflare integration setup complete!"
    
    if [[ "$DRY_RUN" != true ]]; then
        echo
        log "INFO" "📋 Next Steps:"
        echo "   1. Configure secrets: .github/SECRETS_TEMPLATE.md"
        echo "   2. Set up environments: .github/ENVIRONMENT_SETUP.md"
        echo "   3. Test deployment: git push origin staging"
        echo "   4. Review summary: .github/INTEGRATION_SUMMARY.md"
        echo
        log "INFO" "🔗 Commit and push the new workflow:"
        echo "   git add .github/"
        echo "   git commit -m 'feat: Add GitHub Actions + Cloudflare integration'"
        echo "   git push origin $(git branch --show-current)"
    fi
}

# Run main function
main "$@"
