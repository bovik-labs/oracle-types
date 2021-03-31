DOCKER-COMPOSE := docker-compose -f docker-compose.yml

ifeq ($(VOLUMES), 1)
  DOCKER-COMPOSE := ${DOCKER-COMPOSE} -f docker-compose-volumes.yml
endif

ifneq ($(TWILIO_JSON),)
  DOCKER-COMPOSE := ${DOCKER-COMPOSE} -f docker-compose-twilio.yml
endif

# These targets meant to be used from host:
TypeScript/built/local/tsc.js:
	git submodule init
	git submodule update --depth 10
	cd TypeScript && npm install -y
	cd TypeScript && npx gulp local

get_schema/node_modules:
	cd get_schema && npm install -y

get_schema/out/get_schema.js: get_schema/src/get_schema.ts get_schema/node_modules
	cd get_schema && npx tsc

get_schema/out/index.js: get_schema/src/index.ts get_schema/node_modules
	cd get_schema && npx tsc

twilio_client/node_modules:
	cd twilio_client && npm install -y

twilio_client/out/index.js: twilio_client/src/index.ts twilio_client/node_modules
	cd twilio_client && npx tsc

docker-build-up: TypeScript/built/local/tsc.js get_schema/out/index.js get_schema/out/get_schema.js twilio_client/out/index.js
	$(DOCKER-COMPOSE) up --build -d app

docker-up: TypeScript/built/local/tsc.js get_schema/out/index.js get_schema/out/get_schema.js twilio_client/out/index.js
	$(DOCKER-COMPOSE) up -d app

docker-down:
	$(DOCKER-COMPOSE) down

docker-ssh:
	$(DOCKER-COMPOSE) run app bash

demo-emacs:
	$(DOCKER-COMPOSE) run --name tapeworm_demo app /tapeworm/scripts/demo.sh
	docker rm tapeworm_demo

demo-ssh:
	docker exec -it tapeworm_demo bash

talk/node_modules:
	cd talk && npm install -y

run-talk: talk/node_modules
	cd talk && npx reveal-md slides.md -w --theme sky

clean:
	docker system prune
