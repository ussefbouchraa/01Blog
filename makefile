
# ============================================================
# The Makefile installs Micromamba locally, 
# creates a blog-env environment with Micromamba,
 # and installs PostgreSQL and Maven inside it to prepare the project. 
# ============================================================

MAMBA := $(HOME)/.local/bin/micromamba
ENV := blog-env

DB_DATA := $(CURDIR)/.01blog-db
DB_NAME := 01blog
DB_USER := postgres
DB_HOST := 127.0.0.1
DB_PORT := 5432

MAMBA_RUN := $(MAMBA) run -n $(ENV)


.PHONY: setup run db-start db-stop db-status clean


# ============================================================
# Setup
# ============================================================

setup:
	@echo "==> Checking micromamba..."
	@if [ ! -x "$(MAMBA)" ]; then \
		echo "==> Installing micromamba..."; \
		mkdir -p "$(HOME)/.local/bin"; \
		tmp=$$(mktemp -d); \
		curl -Ls https://micro.mamba.pm/api/micromamba/linux-64/latest \
			| tar -xvj -C "$$tmp" >/dev/null 2>&1; \
		mv "$$tmp/bin/micromamba" "$(MAMBA)"; \
		rm -rf "$$tmp"; \
	fi

	@echo "==> Checking environment..."
	@if ! "$(MAMBA)" env list | grep -qE '^[[:space:]]*$(ENV)[[:space:]]'; then \
		echo "==> Installing PostgreSQL and Maven..."; \
		"$(MAMBA)" create -y -q \
			-n "$(ENV)" \
			-c conda-forge \
			postgresql maven; \
	fi

	@echo "==> Checking PostgreSQL..."
	@if [ ! -f "$(DB_DATA)/PG_VERSION" ]; then \
		echo "==> Initializing PostgreSQL..."; \
		mkdir -p "$(DB_DATA)"; \
		$(MAMBA_RUN) initdb \
			-D "$(DB_DATA)" \
			--username="$(DB_USER)" \
			>/dev/null; \
	fi

	@echo "==> Checking PostgreSQL server..."
	@if ! $(MAMBA_RUN) pg_isready \
		-h "$(DB_HOST)" \
		-p "$(DB_PORT)" >/dev/null 2>&1; then \
		echo "==> Starting PostgreSQL..."; \
		$(MAMBA_RUN) pg_ctl \
			-D "$(DB_DATA)" \
			-l "$(DB_DATA)/postgres.log" \
			-o "-p $(DB_PORT)" \
			-w \
			start >/dev/null; \
	fi

	@echo "==> Waiting for PostgreSQL..."
	@until $(MAMBA_RUN) pg_isready \
		-h "$(DB_HOST)" \
		-p "$(DB_PORT)" >/dev/null 2>&1; do \
		sleep 1; \
	done

	@echo "==> Checking database '$(DB_NAME)'..."
	@if ! $(MAMBA_RUN) psql \
		-h "$(DB_HOST)" \
		-p "$(DB_PORT)" \
		-U "$(DB_USER)" \
		-d postgres \
		-tAc "SELECT 1 FROM pg_database WHERE datname='$(DB_NAME)'" \
		| grep -q 1; then \
		echo "==> Creating database '$(DB_NAME)'..."; \
		$(MAMBA_RUN) createdb \
			-h "$(DB_HOST)" \
			-p "$(DB_PORT)" \
			-U "$(DB_USER)" \
			"$(DB_NAME)"; \
	fi

	@echo "==> Setup complete."
	@echo "    PostgreSQL: $(DB_HOST):$(DB_PORT)"
	@echo "    Database:   $(DB_NAME)"
	@echo "    Run: make run"


# ============================================================
# Spring Boot
# ============================================================

run:
	@$(MAMBA_RUN) mvn spring-boot:run


# ============================================================
# PostgreSQL
# ============================================================

db-start:
	@$(MAMBA_RUN) pg_ctl \
		-D "$(DB_DATA)" \
		-l "$(DB_DATA)/postgres.log" \
		-o "-p $(DB_PORT)" \
		-w \
		start


db-stop:
	@$(MAMBA_RUN) pg_ctl \
		-D "$(DB_DATA)" \
		-w \
		stop


db-status:
	@$(MAMBA_RUN) pg_isready \
		-h "$(DB_HOST)" \
		-p "$(DB_PORT)"


# ============================================================
# Clean
# ============================================================

clean:
	@rm -rf target


# ============================================================
# Commands
# ============================================================

# make setup       → Setup everything
# make run         → Run Spring Boot
# make db-start    → Start PostgreSQL
# make db-stop     → Stop PostgreSQL
# make db-status   → Check PostgreSQL
# make clean       → Remove target/


