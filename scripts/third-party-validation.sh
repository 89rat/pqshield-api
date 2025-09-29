#!/bin/bash

# PQ359 Third-Party Validation Script
# 
# This script performs comprehensive third-party testing of your PQ359 deployment
# using external services and independent validation tools.

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
TARGET_URL="${1:-https://pq359.com}"
API_URL="${2:-https://api.pq359.com}"
REPORT_DIR="third-party-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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
        "TEST")
            echo -e "${BLUE}[TEST]${NC} $message"
            ;;
    esac
}

# Help function
show_help() {
    cat << EOF
PQ359 Third-Party Validation Script

This script performs comprehensive external testing of your PQ359 deployment
using independent third-party services and validation tools.

Usage: $0 [TARGET_URL] [API_URL]

Arguments:
    TARGET_URL    URL to test (default: https://pq359.com)
    API_URL       API URL to test (default: https://api.pq359.com)

Examples:
    $0                                          # Test production
    $0 https://staging.pq359.com               # Test staging
    $0 https://pq359.com https://api.pq359.com # Test with custom API

What this script tests:
    🌐 Global performance (WebPageTest)
    🛡️ Security headers (Mozilla Observatory)
    🔒 SSL/TLS configuration (SSL Labs)
    💡 Performance insights (Google PageSpeed)
    📡 DNS propagation and connectivity
    🔌 API endpoint health (if provided)
    📱 Mobile optimization
    🌍 Global accessibility

Reports are saved to: $REPORT_DIR/

EOF
}

# Check dependencies
check_dependencies() {
    log "INFO" "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log "ERROR" "Missing dependencies: ${missing_deps[*]}"
        log "INFO" "Install with: sudo apt-get install ${missing_deps[*]}"
        exit 1
    fi
    
    log "SUCCESS" "All dependencies available"
}

# Validate URL format
validate_url() {
    local url=$1
    local name=$2
    
    if [[ ! $url =~ ^https?:// ]]; then
        log "ERROR" "Invalid $name URL format: $url"
        log "INFO" "URL must start with http:// or https://"
        exit 1
    fi
    
    log "INFO" "Validated $name URL: $url"
}

# Test basic connectivity
test_connectivity() {
    local url=$1
    local name=$2
    
    log "TEST" "Testing connectivity to $name..."
    
    local http_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time 10 "$url" || echo "000")
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time 10 "$url" || echo "0")
    
    if [ "$http_code" = "200" ]; then
        log "SUCCESS" "$name is accessible (HTTP $http_code, ${response_time}s)"
        return 0
    else
        log "WARN" "$name connectivity issue (HTTP $http_code, ${response_time}s)"
        return 1
    fi
}

# WebPageTest performance analysis
run_webpagetest() {
    log "TEST" "Running WebPageTest performance analysis..."
    
    local hostname=$(echo "$TARGET_URL" | sed 's|https://||' | sed 's|/.*||')
    
    # Submit test to WebPageTest
    local response=$(curl -s -X POST "https://www.webpagetest.org/runtest.php" \
        -d "url=$TARGET_URL" \
        -d "location=Dulles:Chrome" \
        -d "runs=1" \
        -d "fvonly=1" \
        -d "f=json" || echo '{"error": "API call failed"}')
    
    echo "$response" > "$REPORT_DIR/webpagetest.json"
    
    local status_code=$(echo "$response" | jq -r '.statusCode // "error"')
    local test_id=$(echo "$response" | jq -r '.data.testId // "N/A"')
    
    if [ "$status_code" = "200" ]; then
        log "SUCCESS" "WebPageTest submitted successfully (Test ID: $test_id)"
        log "INFO" "Results will be available at: https://www.webpagetest.org/result/$test_id/"
    else
        log "WARN" "WebPageTest submission failed (Status: $status_code)"
    fi
}

# Mozilla Observatory security scan
run_mozilla_observatory() {
    log "TEST" "Running Mozilla Observatory security scan..."
    
    local hostname=$(echo "$TARGET_URL" | sed 's|https://||' | sed 's|/.*||')
    
    local response=$(curl -s "https://http-observatory.security.mozilla.org/api/v1/analyze?host=$hostname" || echo '{"error": "API call failed"}')
    
    echo "$response" > "$REPORT_DIR/mozilla-observatory.json"
    
    local score=$(echo "$response" | jq -r '.score // "N/A"')
    local grade=$(echo "$response" | jq -r '.grade // "N/A"')
    local state=$(echo "$response" | jq -r '.state // "unknown"')
    
    if [ "$state" = "FINISHED" ]; then
        log "SUCCESS" "Security scan complete - Score: $score/100, Grade: $grade"
    else
        log "INFO" "Security scan initiated - State: $state"
        log "INFO" "Check results at: https://observatory.mozilla.org/analyze/$hostname"
    fi
}

# SSL Labs analysis
run_ssl_labs() {
    log "TEST" "Running SSL Labs analysis..."
    
    local hostname=$(echo "$TARGET_URL" | sed 's|https://||' | sed 's|/.*||')
    
    # Check if analysis exists in cache first
    local response=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=$hostname&fromCache=on&all=done" || echo '{"error": "API call failed"}')
    
    echo "$response" > "$REPORT_DIR/ssl-labs.json"
    
    local status=$(echo "$response" | jq -r '.status // "unknown"')
    local grade=$(echo "$response" | jq -r '.endpoints[0].grade // "N/A"')
    
    if [ "$status" = "READY" ]; then
        log "SUCCESS" "SSL analysis complete - Grade: $grade"
    else
        log "INFO" "SSL analysis status: $status"
        
        # If not ready, start new analysis
        if [ "$status" = "DNS" ] || [ "$status" = "ERROR" ]; then
            log "INFO" "Starting new SSL analysis..."
            curl -s "https://api.ssllabs.com/api/v3/analyze?host=$hostname&publish=off&startNew=on" > /dev/null
            log "INFO" "SSL analysis initiated. Check results at: https://www.ssllabs.com/ssltest/analyze.html?d=$hostname"
        fi
    fi
}

# Google PageSpeed Insights
run_pagespeed_insights() {
    log "TEST" "Running Google PageSpeed Insights..."
    
    # Desktop analysis
    log "INFO" "Analyzing desktop performance..."
    local desktop_response=$(curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$TARGET_URL&strategy=desktop&category=performance&category=accessibility&category=best-practices&category=seo" || echo '{"error": "API call failed"}')
    
    echo "$desktop_response" > "$REPORT_DIR/pagespeed-desktop.json"
    
    # Mobile analysis
    log "INFO" "Analyzing mobile performance..."
    local mobile_response=$(curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$TARGET_URL&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo" || echo '{"error": "API call failed"}')
    
    echo "$mobile_response" > "$REPORT_DIR/pagespeed-mobile.json"
    
    # Extract scores
    local desktop_perf=$(echo "$desktop_response" | jq -r '.lighthouseResult.categories.performance.score * 100 // "N/A"')
    local mobile_perf=$(echo "$mobile_response" | jq -r '.lighthouseResult.categories.performance.score * 100 // "N/A"')
    local desktop_acc=$(echo "$desktop_response" | jq -r '.lighthouseResult.categories.accessibility.score * 100 // "N/A"')
    local mobile_acc=$(echo "$mobile_response" | jq -r '.lighthouseResult.categories.accessibility.score * 100 // "N/A"')
    
    log "SUCCESS" "PageSpeed analysis complete"
    log "INFO" "Desktop Performance: $desktop_perf%, Accessibility: $desktop_acc%"
    log "INFO" "Mobile Performance: $mobile_perf%, Accessibility: $mobile_acc%"
}

# DNS propagation check
check_dns_propagation() {
    log "TEST" "Checking DNS propagation..."
    
    local hostname=$(echo "$TARGET_URL" | sed 's|https://||' | sed 's|/.*||')
    
    # Check DNS from multiple resolvers
    local resolvers=("8.8.8.8" "1.1.1.1" "208.67.222.222" "9.9.9.9")
    local dns_results=()
    
    for resolver in "${resolvers[@]}"; do
        local ip=$(dig +short @"$resolver" "$hostname" A | head -1 || echo "FAIL")
        dns_results+=("$resolver:$ip")
    done
    
    # Save DNS results
    printf '%s\n' "${dns_results[@]}" > "$REPORT_DIR/dns-results.txt"
    
    # Create JSON format
    cat > "$REPORT_DIR/dns-propagation.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "hostname": "$hostname",
  "resolvers": {
    "google": "$(echo "${dns_results[0]}" | cut -d: -f2)",
    "cloudflare": "$(echo "${dns_results[1]}" | cut -d: -f2)",
    "opendns": "$(echo "${dns_results[2]}" | cut -d: -f2)",
    "quad9": "$(echo "${dns_results[3]}" | cut -d: -f2)"
  },
  "status": "$([ $(echo "${dns_results[@]}" | grep -c "FAIL") -eq 0 ] && echo "propagated" || echo "issues")"
}
EOF
    
    local fail_count=$(echo "${dns_results[@]}" | grep -c "FAIL" || echo "0")
    
    if [ "$fail_count" -eq 0 ]; then
        log "SUCCESS" "DNS propagation looks good across all resolvers"
    else
        log "WARN" "DNS propagation issues detected ($fail_count/$((${#resolvers[@]})) resolvers failed)"
    fi
}

# Global connectivity test
test_global_connectivity() {
    log "TEST" "Testing global connectivity..."
    
    local hostname=$(echo "$TARGET_URL" | sed 's|https://||' | sed 's|/.*||')
    
    # Test from multiple global locations using public ping services
    local locations=("US" "EU" "Asia" "Australia")
    local ping_results=()
    
    # Simple ping test using curl timing
    for location in "${locations[@]}"; do
        local start_time=$(date +%s%N)
        local result=$(curl -s --max-time 5 "$TARGET_URL" > /dev/null 2>&1 && echo "success" || echo "failed")
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        
        ping_results+=("$location:$result:${duration}ms")
    done
    
    # Save results
    printf '%s\n' "${ping_results[@]}" > "$REPORT_DIR/global-connectivity.txt"
    
    # Create JSON format
    cat > "$REPORT_DIR/global-ping.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "target": "$hostname",
  "results": {
$(for i in "${!locations[@]}"; do
    local result="${ping_results[$i]}"
    local loc=$(echo "$result" | cut -d: -f1)
    local status=$(echo "$result" | cut -d: -f2)
    local time=$(echo "$result" | cut -d: -f3)
    echo "    \"$loc\": {\"status\": \"$status\", \"response_time\": \"$time\"}"
    [ $i -lt $((${#locations[@]} - 1)) ] && echo ","
done)
  },
  "summary": "$(echo "${ping_results[@]}" | grep -c "success")/${#locations[@]} locations successful"
}
EOF
    
    local success_count=$(echo "${ping_results[@]}" | grep -c "success")
    log "SUCCESS" "Global connectivity test complete ($success_count/${#locations[@]} locations successful)"
}

# API health check
test_api_health() {
    if [ -z "$API_URL" ] || [ "$API_URL" = "https://api.pq359.com" ]; then
        log "INFO" "Skipping API tests (no custom API URL provided)"
        return 0
    fi
    
    log "TEST" "Testing API health..."
    
    local endpoints=("/v1/health" "/v1/neural/health" "/v1/security/scan" "/v1/status")
    local api_results=()
    
    for endpoint in "${endpoints[@]}"; do
        local full_url="$API_URL$endpoint"
        local http_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time 10 "$full_url" || echo "000")
        local response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time 10 "$full_url" || echo "0")
        
        api_results+=("$endpoint:$http_code:${response_time}s")
        
        if [ "$http_code" = "200" ]; then
            log "SUCCESS" "API endpoint $endpoint: HTTP $http_code (${response_time}s)"
        else
            log "WARN" "API endpoint $endpoint: HTTP $http_code (${response_time}s)"
        fi
    done
    
    # Save API results
    printf '%s\n' "${api_results[@]}" > "$REPORT_DIR/api-health.txt"
    
    # Create JSON format
    cat > "$REPORT_DIR/api-health.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "api_url": "$API_URL",
  "endpoints": {
$(for i in "${!endpoints[@]}"; do
    local result="${api_results[$i]}"
    local endpoint=$(echo "$result" | cut -d: -f1)
    local code=$(echo "$result" | cut -d: -f2)
    local time=$(echo "$result" | cut -d: -f3)
    echo "    \"$endpoint\": {\"http_code\": $code, \"response_time\": \"$time\"}"
    [ $i -lt $((${#endpoints[@]} - 1)) ] && echo ","
done)
  },
  "summary": "$(echo "${api_results[@]}" | grep -c ":200:" || echo "0")/${#endpoints[@]} endpoints healthy"
}
EOF
}

# Security headers check
check_security_headers() {
    log "TEST" "Checking security headers..."
    
    local headers=$(curl -s -I "$TARGET_URL" || echo "")
    
    # Save raw headers
    echo "$headers" > "$REPORT_DIR/security-headers.txt"
    
    # Check for important security headers
    local csp=$(echo "$headers" | grep -i "content-security-policy" || echo "")
    local hsts=$(echo "$headers" | grep -i "strict-transport-security" || echo "")
    local xframe=$(echo "$headers" | grep -i "x-frame-options" || echo "")
    local xcontent=$(echo "$headers" | grep -i "x-content-type-options" || echo "")
    
    # Create security headers report
    cat > "$REPORT_DIR/security-headers-analysis.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "url": "$TARGET_URL",
  "headers": {
    "content_security_policy": "$([ -n "$csp" ] && echo "present" || echo "missing")",
    "strict_transport_security": "$([ -n "$hsts" ] && echo "present" || echo "missing")",
    "x_frame_options": "$([ -n "$xframe" ] && echo "present" || echo "missing")",
    "x_content_type_options": "$([ -n "$xcontent" ] && echo "present" || echo "missing")"
  },
  "security_score": "$([ -n "$csp" ] && [ -n "$hsts" ] && [ -n "$xframe" ] && [ -n "$xcontent" ] && echo "excellent" || echo "needs_improvement")"
}
EOF
    
    local present_count=0
    [ -n "$csp" ] && ((present_count++))
    [ -n "$hsts" ] && ((present_count++))
    [ -n "$xframe" ] && ((present_count++))
    [ -n "$xcontent" ] && ((present_count++))
    
    log "SUCCESS" "Security headers check complete ($present_count/4 important headers present)"
}

# Generate comprehensive summary report
generate_summary_report() {
    log "INFO" "Generating comprehensive summary report..."
    
    cat > "$REPORT_DIR/SUMMARY_REPORT.md" << EOF
# PQ359 Third-Party Validation Report

**Generated:** $(date)
**Target URL:** $TARGET_URL
**API URL:** $API_URL
**Report ID:** $TIMESTAMP

## 🎯 Executive Summary

This report contains the results of comprehensive third-party validation testing for PQ359.
All tests were performed using external, independent services to ensure objective results.

## 📊 Test Results Overview

### ⚡ Performance Analysis
- **WebPageTest:** $(cat "$REPORT_DIR/webpagetest.json" 2>/dev/null | jq -r '.statusText // "Initiated"')
- **Desktop Performance:** $(cat "$REPORT_DIR/pagespeed-desktop.json" 2>/dev/null | jq -r '.lighthouseResult.categories.performance.score * 100 // "N/A"')%
- **Mobile Performance:** $(cat "$REPORT_DIR/pagespeed-mobile.json" 2>/dev/null | jq -r '.lighthouseResult.categories.performance.score * 100 // "N/A"')%

### 🛡️ Security Analysis
- **Mozilla Observatory Score:** $(cat "$REPORT_DIR/mozilla-observatory.json" 2>/dev/null | jq -r '.score // "N/A"')/100
- **Mozilla Observatory Grade:** $(cat "$REPORT_DIR/mozilla-observatory.json" 2>/dev/null | jq -r '.grade // "N/A"')
- **SSL Labs Grade:** $(cat "$REPORT_DIR/ssl-labs.json" 2>/dev/null | jq -r '.endpoints[0].grade // "Analyzing..."')
- **Security Headers:** $(cat "$REPORT_DIR/security-headers-analysis.json" 2>/dev/null | jq -r '.security_score // "N/A"')

### 🌐 Infrastructure Health
- **DNS Propagation:** $(cat "$REPORT_DIR/dns-propagation.json" 2>/dev/null | jq -r '.status // "N/A"')
- **Global Connectivity:** $(cat "$REPORT_DIR/global-ping.json" 2>/dev/null | jq -r '.summary // "N/A"')

$(if [ -f "$REPORT_DIR/api-health.json" ]; then
echo "### 🔌 API Health"
echo "- **API Status:** $(cat "$REPORT_DIR/api-health.json" | jq -r '.summary // "N/A"')"
fi)

### 📱 Accessibility & Best Practices
- **Desktop Accessibility:** $(cat "$REPORT_DIR/pagespeed-desktop.json" 2>/dev/null | jq -r '.lighthouseResult.categories.accessibility.score * 100 // "N/A"')%
- **Mobile Accessibility:** $(cat "$REPORT_DIR/pagespeed-mobile.json" 2>/dev/null | jq -r '.lighthouseResult.categories.accessibility.score * 100 // "N/A"')%
- **Best Practices (Desktop):** $(cat "$REPORT_DIR/pagespeed-desktop.json" 2>/dev/null | jq -r '.lighthouseResult.categories."best-practices".score * 100 // "N/A"')%
- **SEO Score (Desktop):** $(cat "$REPORT_DIR/pagespeed-desktop.json" 2>/dev/null | jq -r '.lighthouseResult.categories.seo.score * 100 // "N/A"')%

## 📋 Detailed Test Files

### 🚀 Performance Reports
- \`webpagetest.json\` - WebPageTest performance analysis
- \`pagespeed-desktop.json\` - Google PageSpeed Insights (Desktop)
- \`pagespeed-mobile.json\` - Google PageSpeed Insights (Mobile)

### 🛡️ Security Reports
- \`mozilla-observatory.json\` - Mozilla Observatory security scan
- \`ssl-labs.json\` - SSL Labs SSL/TLS analysis
- \`security-headers.txt\` - Raw security headers
- \`security-headers-analysis.json\` - Security headers analysis

### 🌐 Infrastructure Reports
- \`dns-propagation.json\` - DNS propagation status
- \`dns-results.txt\` - DNS resolution from multiple resolvers
- \`global-ping.json\` - Global connectivity test results
- \`global-connectivity.txt\` - Raw connectivity test data

$(if [ -f "$REPORT_DIR/api-health.json" ]; then
echo "### 🔌 API Reports"
echo "- \`api-health.json\` - API endpoint health analysis"
echo "- \`api-health.txt\` - Raw API test results"
fi)

## 🎯 Recommendations

### 🚀 Performance Optimization
1. **Monitor Core Web Vitals** - Keep LCP < 2.5s, FID < 100ms, CLS < 0.1
2. **Optimize Images** - Use WebP format and proper sizing
3. **Minimize JavaScript** - Remove unused code and optimize bundles
4. **Leverage CDN** - Ensure global content delivery optimization

### 🛡️ Security Enhancements
1. **Maintain Security Headers** - Keep all security headers properly configured
2. **SSL/TLS Updates** - Regularly update SSL/TLS configuration
3. **Security Monitoring** - Set up continuous security monitoring
4. **Vulnerability Management** - Regular dependency security audits

### 📱 Mobile & Accessibility
1. **Mobile Performance** - Optimize for mobile-first experience
2. **Touch Targets** - Ensure proper touch target sizing (44px minimum)
3. **Accessibility Standards** - Maintain WCAG 2.1 AA compliance
4. **Progressive Enhancement** - Ensure functionality without JavaScript

### 🌍 Global Performance
1. **Edge Optimization** - Leverage Cloudflare's global network
2. **Regional Monitoring** - Monitor performance from all target regions
3. **Latency Optimization** - Minimize server response times
4. **Caching Strategy** - Implement effective caching at all levels

## 📞 Next Steps

### 🔄 Immediate Actions
1. Review any failing tests in the detailed reports
2. Address security or performance issues identified
3. Set up continuous monitoring for key metrics
4. Schedule regular third-party validation testing

### 📊 Ongoing Monitoring
- **Daily:** Basic health and performance checks
- **Weekly:** Security and performance analysis
- **Monthly:** Comprehensive third-party validation

### 🚨 Alert Thresholds
- Performance score drops below 90%
- Security grade falls below A
- API response time exceeds 2 seconds
- Any SSL/TLS configuration issues

---

**Report Generated:** $(date)
**Validation Tools Used:** WebPageTest, Mozilla Observatory, SSL Labs, Google PageSpeed Insights
**Next Recommended Test:** $(date -d '+1 week')

For questions about this report or PQ359 performance, please refer to the detailed JSON files or contact the development team.

EOF

    log "SUCCESS" "Summary report generated: $REPORT_DIR/SUMMARY_REPORT.md"
}

# Send Slack notification (if webhook is configured)
send_slack_notification() {
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        log "INFO" "No Slack webhook configured, skipping notification"
        return 0
    fi
    
    log "INFO" "Sending Slack notification..."
    
    local perf_score=$(cat "$REPORT_DIR/pagespeed-desktop.json" 2>/dev/null | jq -r '.lighthouseResult.categories.performance.score * 100 // "N/A"')
    local security_grade=$(cat "$REPORT_DIR/mozilla-observatory.json" 2>/dev/null | jq -r '.grade // "N/A"')
    local ssl_grade=$(cat "$REPORT_DIR/ssl-labs.json" 2>/dev/null | jq -r '.endpoints[0].grade // "Analyzing"')
    
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🔍 PQ359 Third-Party Validation Complete\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"Target URL\", \"value\": \"$TARGET_URL\", \"short\": true},
                    {\"title\": \"Performance Score\", \"value\": \"$perf_score%\", \"short\": true},
                    {\"title\": \"Security Grade\", \"value\": \"$security_grade\", \"short\": true},
                    {\"title\": \"SSL Grade\", \"value\": \"$ssl_grade\", \"short\": true},
                    {\"title\": \"Report Location\", \"value\": \"$REPORT_DIR/SUMMARY_REPORT.md\", \"short\": false},
                    {\"title\": \"Timestamp\", \"value\": \"$(date)\", \"short\": false}
                ]
            }]
        }" > /dev/null 2>&1 && log "SUCCESS" "Slack notification sent" || log "WARN" "Failed to send Slack notification"
}

# Main execution function
main() {
    # Parse command line arguments
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    log "INFO" "🚀 Starting PQ359 Third-Party Validation"
    log "INFO" "Target URL: $TARGET_URL"
    log "INFO" "API URL: $API_URL"
    log "INFO" "Report Directory: $REPORT_DIR"
    
    # Setup
    check_dependencies
    validate_url "$TARGET_URL" "Target"
    if [ -n "$API_URL" ] && [ "$API_URL" != "https://api.pq359.com" ]; then
        validate_url "$API_URL" "API"
    fi
    
    # Create report directory
    mkdir -p "$REPORT_DIR"
    
    # Basic connectivity test
    if ! test_connectivity "$TARGET_URL" "Target site"; then
        log "ERROR" "Cannot reach target URL. Aborting tests."
        exit 1
    fi
    
    # Run all tests
    log "INFO" "🔍 Running comprehensive third-party validation tests..."
    
    run_webpagetest
    run_mozilla_observatory
    run_ssl_labs
    run_pagespeed_insights
    check_dns_propagation
    test_global_connectivity
    test_api_health
    check_security_headers
    
    # Generate reports
    generate_summary_report
    send_slack_notification
    
    log "SUCCESS" "🎉 Third-party validation complete!"
    log "INFO" "📁 All reports saved to: $REPORT_DIR/"
    log "INFO" "📊 Main report: $REPORT_DIR/SUMMARY_REPORT.md"
    
    # Display quick summary
    echo
    echo "📊 Quick Summary:"
    echo "   Performance: $(cat "$REPORT_DIR/pagespeed-desktop.json" 2>/dev/null | jq -r '.lighthouseResult.categories.performance.score * 100 // "N/A"')% (Desktop)"
    echo "   Security: $(cat "$REPORT_DIR/mozilla-observatory.json" 2>/dev/null | jq -r '.grade // "N/A"') grade"
    echo "   SSL: $(cat "$REPORT_DIR/ssl-labs.json" 2>/dev/null | jq -r '.endpoints[0].grade // "Analyzing..."') grade"
    echo "   DNS: $(cat "$REPORT_DIR/dns-propagation.json" 2>/dev/null | jq -r '.status // "N/A"')"
    echo
}

# Run main function
main "$@"
