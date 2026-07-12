.PHONY: help build up down restart logs backend frontend

# Default target
help:
	@echo "Available commands:"
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all containers"
	@echo "  make down       - Stop all containers"
	@echo "  make restart    - Restart all containers"
	@echo "  make logs       - View logs from all containers"
	@echo "  make backend    - Build and start backend only"
	@echo "  make frontend   - Build and start frontend only"

# Build all images
build:
	@echo "Building backend..."
	cd nxdx-backend-core && docker build -t nexacon-openhim-core:latest .
	@echo "Building frontend..."
	cd nxdx-frontend-core && docker build -t nexacon-openhim-console:latest .

# Start all containers
up:
	@echo "Starting all containers..."
	cd nxdx-frontend-core && docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml up -d

# Stop all containers
down:
	@echo "Stopping all containers..."
	cd nxdx-frontend-core && docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml down

# Restart all containers
restart: down up

# View logs
logs:
	cd nxdx-frontend-core && docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml logs -f

# Backend only
backend:
	@echo "Building and starting backend..."
	cd nxdx-backend-core && docker build -t nexacon-openhim-core:latest .
	cd nxdx-frontend-core && docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml up -d mongo-db openhim-core

# Frontend only
frontend:
	@echo "Building and starting frontend..."
	cd nxdx-frontend-core && docker build -t nexacon-openhim-console:latest .
	cd nxdx-frontend-core && docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml up -d openhim-console
