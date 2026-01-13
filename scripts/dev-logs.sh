#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./scripts/dev-logs.sh [postgres|dynamodb|api|frontend|all]"
  exit 1
fi

case $1 in
  postgres)
    docker logs -f marketplace-sync-postgres
    ;;
  dynamodb)
    docker logs -f marketplace-sync-dynamodb
    ;;
  api)
    cd local-api && npm run dev
    ;;
  frontend)
    cd frontend && npm run dev
    ;;
  all)
    docker-compose logs -f
    ;;
  *)
    echo "Unknown service: $1"
    echo "Available: postgres, dynamodb, api, frontend, all"
    exit 1
    ;;
esac