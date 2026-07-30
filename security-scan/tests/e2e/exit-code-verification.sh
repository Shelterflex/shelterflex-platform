#!/bin/bash
# End-to-End Exit Code Verification Script
# 
# This script verifies the orchestrator's exit code contract by testing
# against fixtures with known states and checking the exit codes.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORCHESTRATOR="$SCRIPT_DIR/../../dist/orchestrator.js"
RESULTS_FILE="security-scan-results.json"

echo "=== Security Scanner Exit Code Verification ==="
echo ""

# Function to clean up results file
cleanup() {
  if [ -f "$RESULTS_FILE" ]; then
    rm "$RESULTS_FILE"
  fi
}

# Function to run scan and check exit code
run_scan() {
  local fixture_dir=$1
  local expected_exit_code=$2
  local description=$3
  
  echo "Test: $description"
  echo "Fixture: $fixture_dir"
  
  cd "$fixture_dir"
  cleanup
  
  # Run the orchestrator
  node "$ORCHESTRATOR" > /dev/null 2>&1
  local actual_exit_code=$?
  
  echo "Expected exit code: $expected_exit_code"
  echo "Actual exit code: $actual_exit_code"
  
  if [ "$actual_exit_code" -eq "$expected_exit_code" ]; then
    echo "✅ PASS"
  else
    echo "❌ FAIL"
  fi
  
  # Check if results file was written
  if [ -f "$RESULTS_FILE" ]; then
    echo "Results file written: ✅"
    local status=$(cat "$RESULTS_FILE" | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    echo "Status in results: $status"
    cleanup
  else
    echo "Results file written: ❌"
  fi
  
  echo ""
  cd - > /dev/null
}

# Test 1: Clean fixture should exit 0
echo "Test 1: Clean fixture (no vulnerabilities)"
run_scan "$SCRIPT_DIR/fixtures/clean" 0 "Clean scan should exit 0"

# Test 2: Test mode should always exit 0 even with vulnerabilities
echo "Test 2: Test mode with vulnerabilities"
cd "$SCRIPT_DIR/fixtures/critical"
cleanup
TEST_MODE=true node "$ORCHESTRATOR" > /dev/null 2>&1
actual_exit_code=$?
echo "Expected exit code: 0"
echo "Actual exit code: $actual_exit_code"
if [ "$actual_exit_code" -eq 0 ]; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi
cd - > /dev/null
echo ""

# Note: We cannot test the actual "critical finding → exit 1" case
# without having vulnerable dependencies that npm audit can detect.
# The unit tests verify the logic, and this script verifies the
# infrastructure works correctly.

echo "=== Verification Complete ==="
echo ""
echo "Note: Full end-to-end testing with actual vulnerabilities requires:"
echo "1. Installing scanner tools (npm, cargo-audit, gitleaks, semgrep, eslint)"
echo "2. Using fixtures with known vulnerable dependencies"
echo "3. Running in an environment where vulnerability databases are accessible"
echo ""
echo "The unit test suite (npm test) verifies the exit code contract logic."
