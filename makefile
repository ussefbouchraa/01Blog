# ============================================================
# Micromamba creates an isolated environment containing: PostgreSQL, Maven, Java and Node.js.
# ============================================================


# ============================================================
# Configuration
# ============================================================
SHELL 	  := /bin/bash
MAMBA     := $(HOME)/.local/bin/micromamba
ENV       := blog-env
MAMBA_RUN := $(MAMBA) run -n $(ENV)

DB_DATA := $(CURDIR)/.01blog-db
DB_NAME := 01blog
DB_USER := postgres
DB_HOST := 127.0.0.1
DB_PORT := 5432

.PHONY: setup run db-start db-stop db-status clean remove-env

# ============================================================
# Setup
# ============================================================

setup:
	@set -euo pipefail; \
	echo "==> Checking Micromamba..."; \
	if [ ! -x "$(MAMBA)" ]; then \
		echo "==> Installing Micromamba..."; \
		mkdir -p "$(HOME)/.local/bin"; \
		TMP=$$(mktemp -d); \
		curl -fLsS https://micro.mamba.pm/api/micromamba/linux-64/latest | tar -xj -C "$$TMP"; \
		mv "$$TMP/bin/micromamba" "$(MAMBA)"; \
		rm -rf "$$TMP"; \
	fi; \
	\
	echo "==> Checking environment..."; \
	if ! "$(MAMBA)" run -n "$(ENV)" true >/dev/null 2>&1; then \
		echo "==> Creating environment..."; \
		"$(MAMBA)" create -y -n "$(ENV)" -c conda-forge \
			postgresql=17 maven=3.9.9 openjdk=17 nodejs=22; \
	else \
		echo "==> Installing dependencies..."; \
		"$(MAMBA)" install -y -n "$(ENV)" -c conda-forge \
			postgresql=17 maven=3.9.9 openjdk=17 nodejs=22; \
	fi; \
	\
	echo "==> Checking Angular project..."; \
	test -f Frontend/package.json || { echo "ERROR: Frontend/package.json not found!"; exit 1; }; \
	\
	echo "==> Checking Angular dependencies..."; \
	if [ -d Frontend/node_modules ]; then \
		echo "==> Already installed, skipping."; \
	else \
		$(MAMBA_RUN) npm --prefix Frontend ci --no-audit --no-fund --loglevel=error; \
	fi; \
	\
	echo "==> Preparing PostgreSQL database..."; \
	if [ ! -f "$(DB_DATA)/PG_VERSION" ]; then \
		mkdir -p "$(DB_DATA)"; \
		$(MAMBA_RUN) initdb -D "$(DB_DATA)" --username="$(DB_USER)"; \
	fi; \
	\
	echo "==> Setup complete!"


# ============================================================
# Run everything
# ============================================================

run: db-start
	@set -e; \
	if [ -f .env ]; then set -a; . ./.env; set +a; fi; \
	echo "==> Starting Spring Boot..."; \
	$(MAMBA_RUN) mvn spring-boot:run & BACK=$$!; \
	\
	echo "==> Starting Angular..."; \
	$(MAMBA_RUN) env NG_FORCE_TTY=false npm --prefix Frontend start &
	echo ""; \
	echo "==> Backend:  http://localhost:8080"; \
	echo "==> Frontend: http://localhost:4200"; \
	echo "==> Press Ctrl+C to stop both applications."; \
	\
	trap 'kill $$BACK $$FRONT 2>/dev/null || true' EXIT INT TERM; \
	wait

# ============================================================
# PostgreSQL
# ============================================================

db-start:
	@if ! $(MAMBA_RUN) pg_isready -h "$(DB_HOST)" -p "$(DB_PORT)" >/dev/null 2>&1; then \
		echo "==> Starting PostgreSQL..."; \
		$(MAMBA_RUN) pg_ctl \
			-D "$(DB_DATA)" \
			-l "$(DB_DATA)/postgres.log" \
			-o "-p $(DB_PORT)" \
			-w start; \
	else \
		echo "==> PostgreSQL is already running."; \
	fi

	@set -a; . ./.env; set +a; \
	if ! $(MAMBA_RUN) psql \
		-h "$(DB_HOST)" \
		-p "$(DB_PORT)" \
		-U "$(DB_USER)" \
		-d postgres \
		-tAc "SELECT 1 FROM pg_database WHERE datname='$(DB_NAME)'" | grep -q 1; then \
		echo "==> Creating database $(DB_NAME)..."; \
		$(MAMBA_RUN) createdb \
			-h "$(DB_HOST)" \
			-p "$(DB_PORT)" \
			-U "$(DB_USER)" \
			"$(DB_NAME)"; \
	fi

db-stop:
	@if $(MAMBA_RUN) pg_ctl -D "$(DB_DATA)" status >/dev/null 2>&1; then \
		$(MAMBA_RUN) pg_ctl -D "$(DB_DATA)" -w stop; \
	else \
		echo "==> PostgreSQL is already stopped."; \
	fi

db-status:
	@$(MAMBA_RUN) pg_isready -h "$(DB_HOST)" -p "$(DB_PORT)"


# ============================================================
# Clean
# ============================================================

clean:
	@rm -rf target Frontend/node_modules Frontend/dist Frontend/.angular
	@echo "==> Build files removed."

# ============================================================
# Remove environment
# ============================================================

remove-env: db-stop
	@echo "==> Checking $(ENV)..."
	@if $(MAMBA) env list | awk '$$1 == "$(ENV)" { found=1 } END { exit !found }'; then \
		echo "==> Removing $(ENV)..."; \
		$(MAMBA) env remove -y -n "$(ENV)"; \
		echo "==> Environment removed."; \
	else \
		echo "==> Environment $(ENV) does not exist. Nothing to remove."; \
	fi