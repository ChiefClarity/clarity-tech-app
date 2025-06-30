#!/bin/bash

# Script to rebuild and restart the Expo web server

echo "🔄 Rebuilding Expo web server..."

# Step 1: Kill any existing serve processes
echo "📍 Stopping existing server..."
pkill -f "serve" || true

# Step 2: Clear the build cache
echo "🗑️  Clearing build cache..."
rm -rf web-build dist

# Step 3: Rebuild fresh
echo "🔨 Building fresh..."
npx expo export --platform web

# Step 4: Serve the correct directory
echo "🚀 Starting server on port 3000..."
npx serve dist -p 3000