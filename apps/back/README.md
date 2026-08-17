# Ajudge Python backend

This is a small, dependency-free Python backend for the extension login flow.

## Run

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the repository `.env` or in
`apps/back/.env`, then run:

```sh
npm run dev:back
```

The API listens on `http://localhost:3000` by default.

Register the redirect URL reported by the extension as an authorized redirect
URI in the Google OAuth client. Chromium uses a URL shaped like
`https://<extension-id>.chromiumapp.org/login/callback`.

## Routes

- `GET /health`
- `GET /auth/login/google?redirect_uri=...`
- `POST /auth/login/google/callback`
- `POST /auth/refresh`
- `GET /auth/ping`
- `GET /auth/permission`
- `GET /auth/logout`

Sessions are intentionally in memory. Restarting the backend logs everyone out;
replace `SessionStore` with persistent storage before production use.
