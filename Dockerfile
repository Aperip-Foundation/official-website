FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite embeds these public destinations in the static bundle at build time.
ARG VITE_PLATFORM_GITHUB_URL=https://github.com/TAperip-Foundation
ARG VITE_PLATFORM_DISCORD_URL=https://discord.gg/TaNYDC6kfJ
ARG VITE_PLATFORM_QQ_URL=https://pd.qq.com/s/clcwlblcm?b=5
ARG VITE_PLATFORM_BILIBILI_URL=https://space.bilibili.com/1220845388
ARG VITE_PLATFORM_X_URL=https://x.com/TeamAPEOfficial

ENV VITE_PLATFORM_GITHUB_URL=$VITE_PLATFORM_GITHUB_URL \
    VITE_PLATFORM_DISCORD_URL=$VITE_PLATFORM_DISCORD_URL \
    VITE_PLATFORM_QQ_URL=$VITE_PLATFORM_QQ_URL \
    VITE_PLATFORM_BILIBILI_URL=$VITE_PLATFORM_BILIBILI_URL \
    VITE_PLATFORM_X_URL=$VITE_PLATFORM_X_URL

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1
