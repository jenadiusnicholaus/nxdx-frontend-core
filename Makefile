.PHONY: help build up down restart logs backend frontend deploy-backend deploy-frontend deploy

# Default target
help:
	@echo "Available commands:"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all containers"
	@echo "  make down           - Stop all containers"
	@echo "  make restart        - Restart all containers"
	@echo "  make logs           - View logs from all containers"
	@echo "  make backend        - Build and start backend only"
	@echo "  make frontend       - Build and start frontend only"
	@echo "  make deploy-backend - Deploy backend (build + start)"
	@echo "  make deploy-frontend - Deploy frontend (build + start)"
	@echo "  make deploy         - Deploy all (build + start backend + frontend)"

# Build all images
build:
	@echo "Building backend..."
	cd ../nxdx-backend-core && docker build -t nexacon-openhim-core:latest .
	@echo "Building frontend..."
	docker build -t nexacon-openhim-console:latest .

# Start all containers
up:
	@echo "Starting all containers..."
	docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml up -d

# Stop all containers
down:
	@echo "Stopping all containers..."
	docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml down

# Restart all containers
restart: down up

# View logs
logs:
	docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml logs -f

# Backend only
backend:
	@echo "Building and starting backend..."
	cd ../nxdx-backend-core && docker build -t nexacon-openhim-core:latest .
	docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml up -d mongo-db openhim-core

# Frontend only
frontend:
	@echo "Building and starting frontend..."
	docker build -t nexacon-openhim-console:latest .
	docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml up -d openhim-console

# Deploy backend (one command)
deploy-backend:
	@echo "Deploying backend..."
	cd ../nxdx-backend-core && docker build -t nexacon-openhim-core:latest .
	docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml up -d mongo-db openhim-core

# Deploy frontend (one command)
deploy-frontend:
	@echo "Deploying frontend..."
	docker build -t nexacon-openhim-console:latest .
	docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml up -d openhim-console

# Deploy all (one command)
deploy:
	@echo "Deploying all..."
	cd ../nxdx-backend-core && docker build -t nexacon-openhim-core:latest .
	docker build -t nexacon-openhim-console:latest .
	docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml up -d
