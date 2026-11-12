# syntax=docker/dockerfile:1.7

FROM node@sha256:233761595746769ebfdb6090f44fc7cdf818ae0ce62d2b37e0367723b9823e36 AS base
# ^ node:26.5.1-alpine (alpine 3.24) — resolved via `docker buildx imagetools inspect node:26-alpine`
ENV CI=true
RUN npm install --global pnpm@11.17.0
WORKDIR /app

# Every dependency comes from the public npm registry: no registry credential
# is needed to build this image.
FROM base AS dependencies-env
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies-env AS production-dependencies-env
RUN pnpm install --frozen-lockfile --prod

FROM dependencies-env AS build-env
COPY . .
RUN pnpm build

FROM base
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=production-dependencies-env /app/node_modules ./node_modules
COPY --chown=node:node --from=build-env /app/build ./build
USER node
CMD ["node_modules/.bin/react-router-serve", "build/server/index.js"]
