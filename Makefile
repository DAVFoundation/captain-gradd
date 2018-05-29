FORCE:

rebuild: FORCE
	@rsync -a ../dav-js build
	@rm -rf ../dav-js/node_modules
	@docker-compose build --no-cache

build: FORCE
	@docker-compose build

up: build
	@docker-compose up

create-aws-stg-env: FORCE
	@eb init captain-gradd
	@eb create captain-gradd-stg --cname captain-gradd-stg -k captain-gradd-key

deploy-aws-stg-env: rebuild
	@eb deploy --staged

down: FORCE
	@docker-compose down
