# Mobile Contract v1 (Core)

Routes mobile depends on:

- GET `/v1/model` → `{ version, checksum, createdAt, requiredRulesVersion, downloadUrls { android, ios }, rulesUrl }`
- GET `/v1/feeds.json` → `{ lastUpdated, sources[], alerts[] }`
- GET `/v1/numberlist` → `{ version, checksum, updatedAt, numbers[] }`
- POST `/v1/analyze` → `{ label, score, confidence, top_reasons[], recommended_actions[], contacts[], legal_note }`
- GET `/health` → `{ version, commit }`

Fixtures and mock

- Mock server: `services/mock` (port 4001)
- Fixtures: `services/mock/fixtures/*.json`
- Seed: `npm run seed` (copies feeds.json into `services/feeds/feeds.json`)

Notes

- CORS allowlist via `CORS_ORIGINS` for Expo dev if needed
- No PII accepted on `/v1/analyze`; feature vectors only
