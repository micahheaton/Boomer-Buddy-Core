# Boomer Buddy Core – Repo Map (Mobile Contract v1)

## Folders and key files
- `services/api/server.ts` – Stateless/logless API with `/v1/model`, `/v1/feeds.json`, `/v1/numberlist`, `/v1/analyze`, `/health`
- `shared/contracts/openapi.yaml` – OpenAPI for mobile-used routes
- `server/` – Web app server (vite, auth, routes)

## Runtime entry
- `npm run dev` → `server/index.ts` (web). API runs where configured; endpoints above are defined in `services/api/server.ts`.

## Env vars
- `PORT` (API default 3001)
- `CORS_ORIGINS` (comma-separated allowlist for dev, e.g., `http://localhost:19006,http://127.0.0.1:19006`)

## HTTP routes used by mobile
- GET `/v1/model` → model metadata, signed URLs
- GET `/v1/feeds.json` → merged alerts
- GET `/v1/numberlist` → signed E.164 list
- POST `/v1/analyze` → feature vector only; rejects PII
- GET `/health` → `{version, commit}`

## Fixtures and seed
- Core repo relies on scheduled data collection for feeds. Deterministic fixtures and mock endpoints are maintained in the mobile repo for integration testing.

## Third-party services
- None directly in these endpoints (Twilio endpoints live in the mobile API layer)

## Build/run
- `npm run dev` (web)
- API can be started with tsx against `services/api/server.ts` during development

Mobile Contract
- Frozen as v1 per `shared/contracts/openapi.yaml`
