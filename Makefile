link-dav-js:
	npm link ../dav-js

build:
	@rsync -a ../dav-js build
	@rm -rf ../dav-js/node_modules
	@docker-compose build

up: build
	@docker-compose up

create-aws-stg-env:
	@eb init captain-gradd
	@eb create captain-gradd-stg --cname captain-gradd-stg -k captain-gradd-key

deploy-aws-stg-env:
	@eb deploy --profile eb-cli-dav --staged

down:
	@docker-compose down
