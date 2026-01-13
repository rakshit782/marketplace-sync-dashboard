#!/bin/bash

set -e

echo "🚀 Starting Marketplace Sync Dashboard (Localhost)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker first."
  exit 1
fi

# Start Docker containers
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 5

# Setup DynamoDB tables
echo "🔧 Setting up DynamoDB tables..."
cd local-api
npm install --silent
node scripts/setup-dynamodb.js
cd ..

# Start local API server
echo "🌐 Starting local API server..."
cd local-api
npm run dev &
API_PID=$!
cd ..

# Wait for API to start
sleep 3

# Start frontend dev server
echo "🎨 Starting frontend dev server..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All services started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Frontend:        http://localhost:5173"
echo "🔌 API:             http://localhost:3001"
echo "🗄️  PostgreSQL:      localhost:5432"
echo "💾 DynamoDB:        http://localhost:8000"
echo "🎨 DynamoDB Admin:  http://localhost:8001"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for interrupt
trap "echo '\n🛑 Stopping services...'; kill $API_PID $FRONTEND_PID; docker-compose down; exit 0" INT

wait