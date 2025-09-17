# Builder
FROM oven/bun:slim AS builder
WORKDIR /app
COPY package.json .
COPY bun.lock .
RUN bun install

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
VOLUME /data
COPY . .
RUN bun --bun run build

# Runner
FROM oven/bun:slim
WORKDIR /app

ARG PORT=3000
ENV PORT=${PORT}
ENV NODE_ENV=production
EXPOSE $PORT

COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/build build/
COPY --from=builder /app/drizzle drizzle

CMD [ "bun", "build/index.js" ]

