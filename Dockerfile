# Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm install

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
VOLUME /data
COPY . .
RUN npm run build

# Runner
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV ORIGIN=http://localhost:3000

COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/build build/
COPY --from=builder /app/drizzle drizzle

CMD [ "node", "build/index.js" ]

