apply:
	npx prisma generate
	npx prisma migrate deploy
# prisma commands
generate:
	npx prisma generate

migrate:
	npx prisma migrate dev $(name)

migrate-up:
	npx prisma migrate deploy

migrate-down:
	npx prisma migrate reset

migrate-status:
	npx prisma migrate status

seed:
	npx prisma db seed

connect:
	docker exec -it vivivi-app-server bash

dev:
	npm run start:dev

log:
	docker logs -f vivivi-app-server -t --tail 10

pm2-log:
	pm2 logs --raw --name vivivi-app-server --lines 10