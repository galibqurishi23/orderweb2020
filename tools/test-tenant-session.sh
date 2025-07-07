#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PORT=9002  # Change this if your app runs on a different port
BASE_URL="http://localhost:$PORT"

# Function to test tenant API
test_tenant() {
    local tenant_slug=$1
    local endpoint=$2
    local description=$3
    
    echo -e "${BLUE}Testing $description: $tenant_slug$endpoint${NC}"
    echo -e "${YELLOW}Request: GET $BASE_URL/$tenant_slug$endpoint${NC}"
    
    # Make the request with curl
    response=$(curl -s "$BASE_URL/$tenant_slug$endpoint")
    
    # Check if response is valid JSON
    if echo "$response" | jq . >/dev/null 2>&1; then
        # Pretty print the JSON response
        echo -e "${GREEN}Response:${NC}"
        echo "$response" | jq .
        echo "------------------------------------"
        return 0
    else
        echo -e "${RED}Error: Invalid response received:${NC}"
        echo "$response"
        echo "------------------------------------"
        return 1
    fi
}

# Function to test debug API
test_debug() {
    echo -e "\n${BLUE}Testing Tenant Session Debug API${NC}"
    echo -e "${YELLOW}Request: GET $BASE_URL/api/debug/tenant-session${NC}"
    
    # Make the request with curl
    response=$(curl -s "$BASE_URL/api/debug/tenant-session")
    
    # Check if response is valid JSON
    if echo "$response" | jq . >/dev/null 2>&1; then
        # Pretty print the JSON response
        echo -e "${GREEN}Response:${NC}"
        echo "$response" | jq .
        echo "------------------------------------"
        return 0
    else
        echo -e "${RED}Error: Invalid response received:${NC}"
        echo "$response"
        echo "------------------------------------"
        return 1
    fi
}

# Function to test tenant session with a specific tenant slug
test_tenant_session() {
    local tenant_slug=$1
    
    echo -e "\n${BLUE}Testing Tenant Session Debug API with tenant: $tenant_slug${NC}"
    echo -e "${YELLOW}Request: GET $BASE_URL/api/debug/tenant-session?tenant=$tenant_slug${NC}"
    
    # Make the request with curl (using direct URL call to avoid middleware)
    response=$(curl -s "$BASE_URL/api/debug/tenant-session?tenant=$tenant_slug" \
        -H "x-tenant-slug: $tenant_slug" \
        -H "x-tenant-context: debug")
    
    # Check if response is valid JSON
    if echo "$response" | jq . >/dev/null 2>&1; then
        # Pretty print the JSON response
        echo -e "${GREEN}Response:${NC}"
        echo "$response" | jq .
        echo "------------------------------------"
        return 0
    else
        echo -e "${RED}Error: Invalid response received:${NC}"
        echo "$response"
        echo "------------------------------------"
        return 1
    fi
}

# Main execution

echo -e "${BLUE}======= OrderWeb Tenant Session Testing Tool =======${NC}"
echo -e "${YELLOW}Server URL: $BASE_URL${NC}"
echo

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: 'jq' command not found.${NC}"
    echo "Please install jq to format JSON output:"
    echo "  Homebrew: brew install jq"
    echo "  Apt: sudo apt-get install jq"
    exit 1
fi

# Test debug API with no tenant context
test_debug

# Test specific tenant session
if [ "$1" ]; then
    tenant_slug=$1
    test_tenant_session "$tenant_slug"
    
    # Test tenant info endpoint
    test_tenant "$tenant_slug" "/api/tenant/info?slug=$tenant_slug" "Tenant Info API"
    
    # Test tenant admin page (this won't return JSON, but good for checking headers)
    echo -e "\n${BLUE}Testing Tenant Admin Access${NC}"
    echo -e "${YELLOW}Request: GET $BASE_URL/$tenant_slug/admin${NC}"
    echo -e "${GREEN}Check browser at: $BASE_URL/$tenant_slug/admin${NC}"
    
    # Test tenant customer page
    echo -e "\n${BLUE}Testing Tenant Customer Access${NC}"
    echo -e "${YELLOW}Request: GET $BASE_URL/$tenant_slug${NC}"
    echo -e "${GREEN}Check browser at: $BASE_URL/$tenant_slug${NC}"
else
    echo -e "${YELLOW}Tip: Provide a tenant slug as argument to test specific tenant:${NC}"
    echo "./test-tenant-session.sh demo-restaurant"
fi

echo -e "\n${BLUE}============= Testing Complete =============${NC}"
