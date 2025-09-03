# Variables personnalisables (peuvent être surchargées: make mongo-start MONGO_PORT=27018)
MONGO_CONTAINER_NAME ?= mongo-rs
MONGO_IMAGE ?= mongo:7
MONGO_PORT ?= 27017
MONGO_REPLSET ?= rs0

setup:
	node scripts/setup-db.cjs

mongo-start:
	MONGO_CONTAINER_NAME=$(MONGO_CONTAINER_NAME) \
	MONGO_IMAGE=$(MONGO_IMAGE) \
	MONGO_PORT=$(MONGO_PORT) \
	MONGO_REPLSET=$(MONGO_REPLSET) \
	node scripts/docker-mongo.cjs start

mongo-stop:
	MONGO_CONTAINER_NAME=$(MONGO_CONTAINER_NAME) node scripts/docker-mongo.cjs stop

mongo-status:
	MONGO_CONTAINER_NAME=$(MONGO_CONTAINER_NAME) node scripts/docker-mongo.cjs status

mongo-logs:
	MONGO_CONTAINER_NAME=$(MONGO_CONTAINER_NAME) node scripts/docker-mongo.cjs logs

mongo-rm:
	MONGO_CONTAINER_NAME=$(MONGO_CONTAINER_NAME) node scripts/docker-mongo.cjs rm


