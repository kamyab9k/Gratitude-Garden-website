# Gratitude-Garden-website

Waitlist website for Gratitude Garden, an app for couples.

## Run locally

```
npm start
# http://localhost:3000
```

## Deploy on Railway

1. In Railway: **New Project → Deploy from GitHub repo** and pick this repo.
2. Railway detects Node and runs `npm start` (a tiny static server in `server.js`, no dependencies).
3. Open **Settings → Networking → Generate Domain** for the public URL, or add a custom domain there.

The server listens on Railway's `PORT` and exposes `/health` for health checks.
