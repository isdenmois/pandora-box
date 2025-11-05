# install node_modules
FROM oven/bun:1.3.1-alpine AS modules
WORKDIR /app
COPY package.json .
COPY bun.lock .

# Mount Bun's cache directory
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile

# build the files
FROM oven/bun:1.3.1-alpine AS builder
WORKDIR /app
COPY --from=modules /app/node_modules node_modules/
COPY . .
RUN bun run server:build

# run the app
FROM oven/bun:1.3.1-alpine
WORKDIR /app

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE $PORT
COPY --from=builder /app/build build
COPY --from=builder /app/drizzle drizzle
CMD ["bun", "build/index.js"]
