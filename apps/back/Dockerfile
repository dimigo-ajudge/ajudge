FROM node:22-alpine AS node-base
FROM oven/bun:alpine AS bun-base

FROM node-base AS deps
WORKDIR /app
COPY apps/back/package-lock.json apps/back/package.json ./

FROM deps AS prod-deps
RUN --mount=type=cache,id=npm,target=/root/.npm \
  npm ci --omit=dev

FROM deps AS build
RUN --mount=type=cache,id=npm,target=/root/.npm \
  npm ci
COPY apps/back/ ./
RUN npm run build

FROM bun-base AS production
ENV NODE_ENV=prod
WORKDIR /app
RUN apk add --no-cache curl nodejs npm
COPY --chown=bun:bun --from=build /app/dist ./dist
COPY --chown=bun:bun --from=build /app/src ./src
COPY --chown=bun:bun --from=build /app/drizzle ./drizzle
COPY --chown=bun:bun --from=prod-deps /app/node_modules ./node_modules
COPY --chown=bun:bun --from=build /app/entrypoint.sh ./
COPY --chown=bun:bun --from=build /app/package.json ./
COPY --chown=bun:bun --from=build /app/tsconfig.json ./
COPY --chown=bun:bun --from=build /app/drizzle.config.ts ./
RUN chmod 700 ./entrypoint.sh

HEALTHCHECK --interval=1s --timeout=3s --start-period=60s --retries=1 \
  CMD curl -fsS http://localhost:3000/health || exit 1

USER bun
ENTRYPOINT ["./entrypoint.sh"]
