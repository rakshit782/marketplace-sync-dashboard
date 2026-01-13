#!/bin/bash

echo "🛑 Stopping all services..."
echo ""

# Stop Docker containers
echo "📦 Stopping Docker containers..."
docker-compose down

# Kill any running Node processes on ports
echo "🔪 Killing Node processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo ""
echo "✅ All services stopped!"
echo ""