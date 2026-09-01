# Aperip Official Website

Source repository for the Aperip organization website.

## Local development

```sh
npm ci
npm run dev
```

The Vite development server prints its local URL after startup.

## Docker Compose

Build and run the production image with:

```sh
docker compose up --build -d
```

The container listens on unprivileged port `8080`. The default host port is also `8080`, so the site is available at `http://localhost:8080`. Override it with `PORT`:

```sh
PORT=4173 docker compose up --build -d
```

In PowerShell, use `$env:PORT=4173; docker compose up --build -d`.

Nginx serves the single-page application with history fallback. Its container health endpoint is `http://localhost:8080/healthz` and returns `ok` when the service is ready. Check the container state with `docker compose ps`.

Platform destinations are compiled into the Vite bundle during the image build. The Compose file accepts the supplied `PLATFORM_*` names and passes them to the `VITE_PLATFORM_*` build variables used by the frontend. Put overrides in a local `.env` file or export them before building:

```dotenv
PLATFORM_GITHUB_URL=https://github.com/TAperip-Foundation
PLATFORM_DISCORD_URL=https://discord.gg/TaNYDC6kfJ
PLATFORM_QQ_URL=https://pd.qq.com/s/clcwlblcm?b=5
PLATFORM_BILIBILI_URL=https://space.bilibili.com/1220845388
PLATFORM_X_URL=https://x.com/TeamAPEOfficial
```

After changing a destination, rebuild the image so the new value is included in the static bundle.
