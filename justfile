[parallel]
run: run-server run-client

run-server:
    bun run ./server/index.ts &

run-client:
    bun run dev

[parallel]
test: unit pw

unit:
    vitest --run

pw:
    playwright test

test-watch:
    vitest
