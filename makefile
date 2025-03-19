# Makefile para gerenciar o ambiente Docker

# Nome das imagens
BACKEND_IMAGE=backend-image:latest
FRONTEND_IMAGE=frontend-image:latest

# Comandos para Docker
DOCKER_COMPOSE=docker-compose

# Alvos
.PHONY: build up down logs clean

# Constrói as imagens do backend e frontend
build:
	$(DOCKER_COMPOSE) build

# Inicia os serviços
up:
	$(DOCKER_COMPOSE) up -d

# Para os serviços
down:
	$(DOCKER_COMPOSE) down

# Exibe os logs dos serviços
logs:
	$(DOCKER_COMPOSE) logs -f

# Limpa volumes e imagens não utilizados
clean:
	$(DOCKER_COMPOSE) down -v
	docker image prune -f
