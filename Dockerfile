FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS build
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

FROM base AS release
ENV NODE_ENV=production
COPY --from=build /usr/src/app/build build
COPY public public
COPY ./package.json ./package.json

USER bun
EXPOSE 3000
CMD ["bun", "run", "prod"]
