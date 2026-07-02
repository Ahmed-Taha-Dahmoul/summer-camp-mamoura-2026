# Docker Compose Variables
DC = docker-compose
EXEC_BACKEND = $(DC) exec backend python manage.py

.PHONY: help up down build restart logs makemigrations migrate createsuperuser shell test startapp collectstatic

help: ## Show this help message
	@echo "Usage: make [command]"
	@echo ""
	@echo "Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# Docker commands
up: ## Start all containers in background
	$(DC) up -d

up-build: ## Start all containers and rebuild images
	$(DC) up --build -d

down: ## Stop and remove all containers
	$(DC) down

build: ## Build all docker images
	$(DC) build

restart: ## Restart all containers
	$(DC) restart

logs: ## View output from containers
	$(DC) logs -f

logs-backend: ## View output from backend container
	$(DC) logs -f backend

logs-frontend: ## View output from frontend container
	$(DC) logs -f frontend

# Django commands
makemigrations: ## Create new migrations based on the changes detected to your models
	$(EXEC_BACKEND) makemigrations

migrate: ## Synchronize the database state with the current set of models and migrations
	$(EXEC_BACKEND) migrate

createsuperuser: ## Create a superuser account
	$(EXEC_BACKEND) createsuperuser

shell: ## Run a Python interactive interpreter in the Django environment
	$(EXEC_BACKEND) shell

test: ## Run tests for all applications
	$(EXEC_BACKEND) test

startapp: ## Create a new Django app (usage: make startapp app=app_name)
	@if [ -z "$(app)" ]; then \
		echo "Error: You must provide an app name. Usage: make startapp app=app_name"; \
		exit 1; \
	fi
	$(DC) exec backend sh -c "python manage.py startapp $(app)"

collectstatic: ## Collect static files into STATIC_ROOT
	$(EXEC_BACKEND) collectstatic --noinput

# Frontend commands
npm-install: ## Install npm dependencies
	$(DC) exec frontend npm install

npm-build: ## Build frontend for production
	$(DC) exec frontend npm run build
