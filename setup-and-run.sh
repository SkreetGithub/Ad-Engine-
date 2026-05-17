#!/bin/bash
# Fix npm cache permissions and install + run the app on port 3550

set -e
cd "$(dirname "$0")"

echo "=== Step 1: Fix npm cache permissions (you may be asked for your password) ==="
sudo chown -R "$(whoami)" ~/.npm

echo ""
echo "=== Step 2: Install dependencies ==="
npm install --legacy-peer-deps

echo ""
echo "=== Step 3: Starting dev server on http://localhost:3550 ==="
echo "Opening browser in 5 seconds..."
(sleep 5 && open http://localhost:3550) &
npm run dev
