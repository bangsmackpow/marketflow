FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS deps
RUN npm ci --only=production

FROM base AS build-deps
RUN npm ci

FROM build-deps AS build
COPY . .
RUN npm run build

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/dist/client ./dist/client
COPY --from=build /app/package.json ./

RUN mkdir -p /app/data && chown -R appuser:nodejs /app/data
USER appuser

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "backend/dist/index.js"]
