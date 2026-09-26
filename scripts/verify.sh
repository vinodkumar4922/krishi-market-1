#!/usr/bin/env bash
set -e

echo "=================================================="
echo "🔍 Krishi Market Full Build & Test Verification"
echo "=================================================="

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "1. Verifying Backend Test Suite..."
cd "$BASE_DIR/backend"
npm test

echo "2. Verifying Frontend Production Build..."
cd "$BASE_DIR/frontend"
npm run build

echo "=================================================="
echo "✅ Full System Verification Completed Successfully!"
echo "=================================================="
