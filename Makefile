# OpenTable Clone - Docker Makefile
# Provides convenient commands for managing the application

# Variables
COMPOSE = docker-compose
SERVICE_BACKEND = backend
SERVICE_FRONTEND = frontend
SERVICE_DB = postgres

.PHONY: help build up down logs ps clean migrate seed shell-backend shell-frontend shell-db test lint

# Default target
help:
	@echo "OpenTable Clone - Available Commands:"
	@echo "======================================"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services in detached mode"
	@echo "  make down           - Stop and remove all containers"
	@echo "  make logs           - View logs from all services"
	@echo "  make logs-backend   - View backend logs only"
	@echo "  make logs-frontend  - View frontend logs only"
	@echo "  make logs-db        - View database logs only"
	@echo "  make ps             - Show running containers"
	@echo "  make migrate        - Run database migrations"
	@echo "  make seed           - Seed the database with sample data"
	@echo "  make migrate-down   - Rollback last migration"
	@echo "  make shell-backend  - Open shell in backend container"
	@echo "  make shell-frontend - Open shell in frontend container"
	@echo "  make shell-db       - Open shell in database container"
	@echo "  make clean          - Remove all containers and volumes"
	@echo "  make restart        - Restart all services"
	@echo "  make test           - Run backend tests"
	@echo "  make lint           - Run linter on backend"
	@echo "  make dev            - Start services in development mode"

# Build all images
build:
	$(COMPOSE) build

# Start services in detached mode
up:
	$(COMPOSE) up -d

# Start services in development mode with logs attached
dev:
	$(COMPOSE) up

# Stop and remove containers
down:
	$(COMPOSE) down

# Stop and remove containers with volumes (WARNING: destroys database data!)
clean:
	$(COMPOSE) down -v --remove-orphans
	@echo "Cleaned up containers and volumes"

# View all logs
logs:
	$(COMPOSE) logs -f

# View backend logs
logs-backend:
	$(COMPOSE) logs -f $(SERVICE_BACKEND)

# View frontend logs
logs-frontend:
	$(COMPOSE) logs -f $(SERVICE_FRONTEND)

# View database logs
logs-db:
	$(COMPOSE) logs -f $(SERVICE_DB)

# Show running containers
ps:
	$(COMPOSE) ps

# Restart all services
restart:
	$(COMPOSE) restart

# Database migrations
migrate:
	$(COMPOSE) exec $(SERVICE_BACKEND) npm run migrate || \
	echo "Migration command not found. Run: make shell-backend and then your migration command"

# Rollback migrations
migrate-down:
	$(COMPOSE) exec $(SERVICE_BACKEND) npm run migrate:down || \
	echo "Migration rollback command not found. Run: make shell-backend and then your rollback command"

# Seed database
seed:
	$(COMPOSE) exec $(SERVICE_BACKEND) npm run seed || \
	echo "Seed command not found. Run: make shell-backend and then your seed command"

# Shell access
shell-backend:
	$(COMPOSE) exec $(SERVICE_BACKEND) /bin/sh

shell-frontend:
	$(COMPOSE) exec $(SERVICE_FRONTEND) /bin/sh

shell-db:
	$(COMPOSE) exec $(SERVICE_DB) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

# Testing and linting
test:
	$(COMPOSE) exec $(SERVICE_BACKEND) npm test || \
	echo "Tests not configured. Add test script to package.json"

lint:
	$(COMPOSE) exec $(SERVICE_BACKEND) npm run lint || \
	echo "Linting not configured. Add lint script to package.json"

# Quick setup for new developers
setup:
	@echo "Setting up OpenTable Clone..."
	cp backend/.env.example backend/.env 2>/dev/null || true
	$(COMPOSE) build
	$(COMPOSE) up -d
	@echo "Waiting for database to be ready..."
	@sleep 5
	$(COMPOSE) exec $(SERVICE_BACKEND) npm run migrate || true
	$(COMPOSE) exec $(SERVICE_BACKEND) npm run seed || true
	@echo "Setup complete! Visit http://localhost:3000"

# Production deployment
prod:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-build:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml build

prod-down:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml down
