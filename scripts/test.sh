#!/usr/bin/env bash
set -e

echo "🧪 Running Krishi Market Test Suite..."
cd "$(dirname "$0")/../backend"
npm test
echo "✅ All tests passed successfully!"
