# install node_modules
FROM oven/bun:1.2.22-alpine AS modules
WORKDIR /app
COPY package.json .
COPY bun.lock .
RUN bun install

# build the files
FROM oven/bun:1.2.22-alpine AS builder
WORKDIR /app
COPY --from=modules /app/node_modules node_modules/
COPY . .
RUN bun run server:build
RUN bun run client:build

# run the app
FROM oven/bun:1.2.22-alpine
WORKDIR /app

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE $PORT
COPY --from=builder /app/build build
COPY --from=builder /app/public /app/dist public
COPY --from=builder /app/drizzle drizzle
CMD ["bun", "build/index.js"]
