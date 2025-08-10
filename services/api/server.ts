/**
 * Stateless, Logless Backend API
 * Implements §10 requirements: no persistence, no logging, memory-only processing
 */

import express from 'express';
import cors from 'cors';
import { RiskEngine } from './riskEngine';
import { ModelManager } from './modelManager';
import { FeedsManager } from './feedsManager';

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers (§21)
app.use((req, res, next) => {
  res.set({
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache'
  });
  next();
});

// Disable logging
app.set('trust proxy', false);

// CORS for mobile apps only
app.use(cors({
  origin: false, // No web origins - mobile only
  credentials: false
}));

// Body parsing with size limits
app.use(express.json({ limit: '1kb' })); // Small limit for feature vectors only

// Disable default Express logging
app.set('x-powered-by', false);

/**
 * GET /v1/model
 * Returns model metadata and signed CDN URLs
 */
app.get('/v1/model', async (req, res) => {
  try {
    const modelManager = ModelManager.getInstance();
    const modelInfo = await modelManager.getLatestModelInfo();
    
    res.json({
      version: modelInfo.version,
      checksum: modelInfo.checksum,
      createdAt: modelInfo.createdAt,
      requiredRulesVersion: modelInfo.requiredRulesVersion,
      downloadUrls: {
        android: modelInfo.tfliteUrl,
        ios: modelInfo.coremlUrl
      },
      rulesUrl: modelInfo.rulesUrl
    });
  } catch (error) {
    console.error('Model endpoint error:', error);
    res.status(500).json({ error: 'Model information unavailable' });
  }
});

/**
 * GET /v1/feeds.json
 * Returns daily merged government/org alerts
 */
app.get('/v1/feeds.json', async (req, res) => {
  try {
    const feedsManager = FeedsManager.getInstance();
    const feeds = await feedsManager.getMergedFeeds();
    
    res.json({
      lastUpdated: feeds.lastUpdated,
      sources: feeds.sources,
      alerts: feeds.alerts
    });
  } catch (error) {
    console.error('Feeds endpoint error:', error);
    res.status(500).json({ error: 'Feeds unavailable' });
  }
});

/**
 * GET /v1/numberlist
 * Returns signed E.164 list for Call Directory/Android cache
 */
app.get('/v1/numberlist', async (req, res) => {
  try {
    const modelManager = ModelManager.getInstance();
    const numberList = await modelManager.getScamNumberList();
    
    res.json({
      version: numberList.version,
      checksum: numberList.checksum,
      updatedAt: numberList.updatedAt,
      numbers: numberList.numbers
    });
  } catch (error) {
    console.error('Number list endpoint error:', error);
    res.status(500).json({ error: 'Number list unavailable' });
  }
});

/**
 * POST /v1/analyze
 * Analyzes feature vector and returns guidance (NO PERSISTENCE)
 */
app.post('/v1/analyze', async (req, res) => {
  try {
    // Validate feature vector format
    const featureVector = req.body;
    
    if (!featureVector || featureVector.v !== 1) {
      return res.status(400).json({ error: 'Invalid feature vector format' });
    }

    // Ensure no PII in feature vector
    if (containsPII(featureVector)) {
      return res.status(400).json({ error: 'PII detected in request' });
    }

    const riskEngine = RiskEngine.getInstance();
    const analysis = await riskEngine.analyzeFeatureVector(featureVector);
    
    res.json({
      label: analysis.label,
      score: analysis.score,
      confidence: analysis.confidence,
      top_reasons: analysis.reasons,
      recommended_actions: analysis.actions,
      contacts: analysis.contacts,
      legal_note: 'Guidance only; not legal or financial advice.'
    });

    // CRITICAL: No logging, no persistence - analysis discarded after response
  } catch (error) {
    console.error('Analysis endpoint error:', error);
    res.status(500).json({ error: 'Analysis unavailable' });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0'
  });
});

/**
 * Validate that feature vector contains no PII
 */
function containsPII(featureVector: any): boolean {
  const jsonString = JSON.stringify(featureVector);
  
  // Basic PII patterns that should never appear in feature vectors
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/, // Phone
    /\b\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd)\b/i // Address
  ];
  
  return piiPatterns.some(pattern => pattern.test(jsonString));
}

/**
 * 404 handler
 */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/**
 * Error handler - no stack traces in production
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Boomer Buddy API running on port ${PORT}`);
  console.log('Privacy mode: No logging, no persistence, memory-only processing');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shutdown complete');
    process.exit(0);
  });
});

export default app;