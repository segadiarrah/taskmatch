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
	$(COMPOSE) exec -T -e ENV=development backend python -m pytest tests/ -q -p no:cacheprovider

.PHONY: test-integration
test-integration: ## Run real API lifecycle tests against an isolated test database
	$(COMPOSE) exec -T backend python -m scripts.test_integration

.PHONY: check-frontend
check-frontend: ## Typecheck, lint and check the web application
	cd frontend && npm ci && npm run check && npm run build

.PHONY: check-sdk
check-sdk: ## Test and build both SDKs
	cd sdk/js && npm ci && npm test
	$(COMPOSE) run --rm --no-deps -v "$(CURDIR)/sdk/python:/sdk/python:ro" -e PYTHONPATH=/sdk/python backend python -m pytest /sdk/python/tests -q -p no:cacheprovider

.PHONY: health
health: ## Check database and Redis readiness via the reverse proxy
	curl --fail --silent --show-error http://127.0.0.1:8091/health/ready

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
