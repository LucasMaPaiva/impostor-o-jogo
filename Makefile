.PHONY: up down build restart logs ps

# Start containers
up:
	docker compose up -d

# Stop and remove containers
down:
	docker compose down

# Build or rebuild services
build:
	docker compose build

# Restart containers
restart:
	docker compose restart

# View logs
logs:
	docker compose logs -f

# List containers
ps:
	docker compose ps
