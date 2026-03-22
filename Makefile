# =============================================================================
# TaskMatch.ai — Makefile
# =============================================================================
.DEFAULT_GOAL := help
COMPOSE := docker compose

# -----------------------------------------------------------------------------
# Development
# -----------------------------------------------------------------------------

.PHONY: dev
dev: ## Start all services (build if needed)
	$(COMPOSE) up --build

.PHONY: down
down: ## Stop and remove all containers
	$(COMPOSE) down

.PHONY: logs
logs: ## Tail logs from all services (ctrl-c to quit)
	$(COMPOSE) logs -f

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------

.PHONY: migrate
migrate: ## Run Alembic migrations head
	$(COMPOSE) exec backend alembic upgrade head

.PHONY: seed
seed: ## Seed the database with sample data
	$(COMPOSE) exec backend python -m scripts.seed

.PHONY: reset-db
reset-db: ## Drop, recreate, migrate, and seed the database
	$(COMPOSE) down -v
	$(COMPOSE) up -d postgres redis
	@echo "Waiting for postgres to be healthy…"
	@until $(COMPOSE) exec postgres pg_isready -U taskmatch -d taskmatch > /dev/null 2>&1; do sleep 1; done
	$(COMPOSE) up -d backend
	@echo "Waiting for backend to be healthy…"
	@sleep 5
	$(COMPOSE) exec backend alembic upgrade head
	$(COMPOSE) exec backend python -m scripts.seed
	@echo "Database reset complete."

# -----------------------------------------------------------------------------
# Testing
# -----------------------------------------------------------------------------

.PHONY: test
test: ## Run the backend test suite
	$(COMPOSE) exec backend python -m pytest tests/ -v --tb=short

# -----------------------------------------------------------------------------
# Shells
# -----------------------------------------------------------------------------

.PHONY: shell-backend
shell-backend: ## Open a bash shell in the backend container
	$(COMPOSE) exec backend bash

.PHONY: shell-frontend
shell-frontend: ## Open a sh shell in the frontend container
	$(COMPOSE) exec frontend sh

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

.PHONY: help
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
