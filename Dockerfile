FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/simulator/package.json packages/simulator/package.json
COPY packages/investigator/package.json packages/investigator/package.json
RUN npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL=http://localhost:8080
ENV SITE_URL=$SITE_URL
RUN npm run build

FROM build AS api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "node_modules/tsx/dist/cli.mjs", "scripts/boot.ts"]

FROM nginx:1.28-alpine AS web
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
