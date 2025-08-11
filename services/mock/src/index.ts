import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }));
app.use(express.json());

const fixturesDir = path.join(process.cwd(), 'fixtures');

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, file), 'utf-8'));
}

// Health
app.get('/health', (_req, res) => res.json({ version: '1.0.0', commit: 'MOCK' }));

// Model
app.get('/v1/model', (_req, res) => {
  res.json(readJson('model.json'));
});

// Feeds
app.get('/v1/feeds.json', (_req, res) => {
  res.json(readJson('feeds.json'));
});

// Number list
app.get('/v1/numberlist', (_req, res) => {
  res.json(readJson('numberlist.json'));
});

// Analyze
app.post('/v1/analyze', (_req, res) => {
  res.json(readJson('analyze.json'));
});

const port = process.env.MOCK_PORT || 4001;
app.listen(port, () => console.log(`Core mock listening on ${port}`));


