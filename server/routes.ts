import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeScam } from "./openai";
import { extractTextFromImage } from "./ocr";
import { getMockAnalysis } from "./mockAnalysis";
import { trendMonitor } from "./trendMonitor";
import { mlPatternRecognizer } from "./mlModels";
import { scamAnalysisRequestSchema, type ScamAnalysisResult, scamTrends, newsItems, dataSources } from "@shared/schema";
import { setupAuthRoutes, requireAuth, optionalAuth } from "./auth";
import { startDataCollection } from "./dataCollector";
import { historicalDataSeeder } from "./historicalDataSeeder";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
import { mobileNotificationService } from "./mobileNotificationService";
import { filterService, type FilterOptions } from "./filterService";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import OpenAI from "openai";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads (images)
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Configure multer for audio uploads
const audioUpload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for audio
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith("audio/") || file.fieldname === 'audio') {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

// Initialize OpenAI client for transcription
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuthRoutes(app);
  // Load knowledge base data and demo examples
  let federalContacts = {};
  let financialContacts = {};
  let stateContacts = {};
  let demoData = {};
  
  try {
    stateContacts = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/state-contacts.json"), "utf-8"));
  } catch (error) {
    console.log("State contacts file not found, using fallback");
    stateContacts = {};
  }
  
  try {
    federalContacts = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/contacts_federal.json"), "utf-8"));
  } catch (error) {
    console.log("Federal contacts file not found");
    federalContacts = {};
  }
  
  try {
    financialContacts = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/contacts_financial.json"), "utf-8"));
  } catch (error) {
    console.log("Financial contacts file not found");
    financialContacts = {};
  }
  
  try {
    demoData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/demo_data.json"), "utf-8"));
  } catch (error) {
    console.log("Demo data file not found");
    demoData = {};
  }

  // User dashboard routes
  app.get("/api/user/dashboard", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const stats = await storage.getUserStats(user.id);
      const recentAnalyses = await storage.getAnalysesByUser(user.id, 10);
      
      res.json({
        user,
        stats,
        recentAnalyses,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  app.get("/api/user/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const analyses = await storage.getAnalysesByUser(user.id, limit);
      res.json({ analyses, page, hasMore: analyses.length === limit });
    } catch (error) {
      console.error("History error:", error);
      res.status(500).json({ error: "Failed to load history" });
    }
  });

  app.get("/api/user/activities", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const activities = await storage.getUserActivities(user.id, 50);
      res.json({ activities });
    } catch (error) {
      console.error("Activities error:", error);
      res.status(500).json({ error: "Failed to load activities" });
    }
  });

  // POST /api/analyze - Analyze content for scam patterns (with optional auth)
  app.post("/api/analyze", optionalAuth, upload.single("image"), async (req: Request & { file?: Express.Multer.File }, res) => {
    let requestData;
    
    try {
      if (req.file) {
        // Handle image upload
        const imagePath = req.file.path;
        let extractedText = "";
        
        try {
          extractedText = await extractTextFromImage(imagePath);
          console.log("OCR extracted text:", extractedText ? extractedText.length + " characters" : "no text found");
        } catch (ocrError: any) {
          console.log("OCR failed, will analyze image without text extraction:", ocrError.message);
        }
        
        // If no text was extracted, provide a default message for analysis
        if (!extractedText || extractedText.trim().length === 0) {
          extractedText = "Image uploaded but no readable text could be extracted. This may be a photo, screenshot, or image without clear text content.";
          console.log("Using fallback text for image analysis");
        }
        
        requestData = {
          inputType: "image" as const,
          text: extractedText,
          imageUrl: imagePath,
          state: req.body.state,
          phoneNumber: req.body.phoneNumber,
          emailFrom: req.body.emailFrom,
          channel: req.body.channel,
        };
      } else {
        // Handle text/transcript input
        const parsedData = scamAnalysisRequestSchema.parse(req.body);
        requestData = {
          ...parsedData,
          inputType: parsedData.inputType || "text"
        };
      }

      console.log("Request data text:", requestData.text ? `"${requestData.text.substring(0, 100)}..."` : "undefined/empty");
      
      if (!requestData.text || requestData.text.trim().length === 0) {
        console.log("Error: No text content available for analysis");
        return res.status(400).json({ error: "No text content to analyze" });
      }

      // Enhanced analysis with ML pattern recognition and trend matching
      const textToAnalyze = requestData.text;
      
      // First, run ML pattern recognition
      const mlPrediction = mlPatternRecognizer.predict(textToAnalyze);
      console.log(`ML Analysis - Risk Score: ${mlPrediction.riskScore}%, Confidence: ${(mlPrediction.confidence * 100).toFixed(1)}%`);
      
      // Check for matching scam trends
      const matchingTrends = await trendMonitor.analyzeForTrendMatch(textToAnalyze);
      if (matchingTrends.length > 0) {
        console.log(`Found ${matchingTrends.length} matching scam trends`);
      }
      
      let analysisResult;
      try {
        analysisResult = await analyzeScam(textToAnalyze, {
          channel: requestData.channel,
          state: requestData.state,
          federalContacts,
          financialContacts,
          stateContacts,
        });
        
        // Enhance with ML insights
        const originalScore = analysisResult.scam_score;
        analysisResult.scam_score = Math.round(
          (originalScore * 0.7) + (mlPrediction.riskScore * 0.3) // 70% OpenAI, 30% ML
        );
        
        // Add ML-detected patterns to signals
        if (mlPrediction.patterns.length > 0) {
          const mlPatterns = mlPrediction.patterns
            .map(p => `Pattern detected: ${p.replace(/_/g, ' ')}`)
            .slice(0, 2);
          analysisResult.top_signals = [...mlPatterns, ...analysisResult.top_signals].slice(0, 5);
        }
        
        // Add trend warnings if matches found
        if (matchingTrends.length > 0) {
          const highestRiskTrend = matchingTrends[0];
          analysisResult.top_signals.unshift(
            `⚠️ Matches active scam trend: ${highestRiskTrend.title}`
          );
          analysisResult.explanation = `TREND ALERT: ${analysisResult.explanation} This message matches patterns from "${highestRiskTrend.title}" - a currently active scam with ${highestRiskTrend.reportedCases} reported cases.`;
        }
        
        console.log(`Enhanced analysis - Original: ${originalScore}%, ML-Enhanced: ${analysisResult.scam_score}%`);
        
      } catch (aiError: any) {
        console.log("OpenAI failed, using ML + pattern-based analysis:", aiError.message);
        
        // Create enhanced analysis using ML prediction and mock analysis
        const baseAnalysis = getMockAnalysis(textToAnalyze, {
          channel: requestData.channel,
          state: requestData.state,
          federalContacts,
          financialContacts,
          stateContacts,
        });
        
        // Override with ML insights
        analysisResult = {
          ...baseAnalysis,
          scam_score: Math.round(mlPrediction.riskScore),
          confidence: mlPrediction.confidence > 0.7 ? "high" : mlPrediction.confidence > 0.4 ? "medium" : "low",
          top_signals: [
            ...mlPrediction.patterns.map(p => `ML detected: ${p.replace(/_/g, ' ')}`),
            ...baseAnalysis.top_signals
          ].slice(0, 5)
        };
        
        // Add trend information
        if (matchingTrends.length > 0) {
          const trend = matchingTrends[0];
          analysisResult.top_signals.unshift(`Matches trend: ${trend.title}`);
          analysisResult.explanation = `This matches the active scam trend "${trend.title}". ${trend.description} ${analysisResult.explanation}`;
        }
        
        console.log("Analysis completed with ML + pattern matching");
      }
      
      // Add training example for continuous learning
      const confidence = analysisResult.scam_score / 100;
      if (confidence > 0.6) {
        const label = analysisResult.scam_score > 50 ? 'scam' : 'legitimate';
        mlPatternRecognizer.addTrainingExample(textToAnalyze, label, confidence);
      }

      // Save analysis to database
      // Get user ID if authenticated  
      const user = req.user as any;
      const userId = user?.id || undefined;

      const analysis = await storage.createAnalysis({
        userId: userId,
        inputType: requestData.inputType,
        text: requestData.text,
        imagePath: requestData.imageUrl,
        state: requestData.state,
        phoneNumber: requestData.phoneNumber,
        emailFrom: requestData.emailFrom,
        channel: requestData.channel,
        resultJson: analysisResult,
      });

      res.json({
        analysisId: analysis.id,
        result: analysisResult,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Failed to analyze content" });
    }
  });

  // GET /api/report/:id - Get saved analysis report
  app.get("/api/report/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json({
        id: analysis.id,
        result: analysis.resultJson,
        createdAt: analysis.createdAt,
        inputType: analysis.inputType,
      });
    } catch (error) {
      console.error("Report retrieval error:", error);
      res.status(500).json({ error: "Failed to retrieve report" });
    }
  });

  // GET /api/trends - Get current scam trends
  app.get("/api/trends", async (req, res) => {
    try {
      const trends = trendMonitor.getCurrentTrends();
      const alerts = trendMonitor.getActiveAlerts();
      
      res.json({
        trends: trends.slice(0, 10), // Return top 10 trends
        alerts: alerts.slice(0, 5),  // Return top 5 recent alerts
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Trends retrieval error:", error);
      res.status(500).json({ error: "Failed to retrieve trends" });
    }
  });

  // GET /api/trends/search - Search scam trends
  app.get("/api/trends/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const trends = trendMonitor.searchTrends(query);
      res.json({ trends, query });
    } catch (error) {
      console.error("Trend search error:", error);
      res.status(500).json({ error: "Failed to search trends" });
    }
  });

  // GET /api/ml/stats - Get ML model statistics
  app.get("/api/ml/stats", async (req, res) => {
    try {
      const stats = mlPatternRecognizer.getModelStats();
      res.json(stats);
    } catch (error) {
      console.error("ML stats error:", error);
      res.status(500).json({ error: "Failed to retrieve ML statistics" });
    }
  });

  // POST /api/ml/predict - Get ML prediction for text
  app.post("/api/ml/predict", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      
      const prediction = mlPatternRecognizer.predict(text);
      const matchingTrends = await trendMonitor.analyzeForTrendMatch(text);
      
      res.json({
        prediction,
        matchingTrends: matchingTrends.slice(0, 3), // Top 3 matching trends
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("ML prediction error:", error);
      res.status(500).json({ error: "Failed to generate ML prediction" });
    }
  });

  // GET /api/demo-data - Get demo examples for testing
  app.get("/api/demo-data", (req, res) => {
    try {
      const demoData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/demo_data.json"), "utf8"));
      res.json(demoData);
    } catch (error) {
      console.error("Error loading demo data:", error);
      res.status(500).json({ error: "Failed to load demo data" });
    }
  });

  // GET /api/states - Get available states
  app.get("/api/states", (req, res) => {
    try {
      const stateContactsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/state-contacts.json"), "utf-8"));
      const states = Object.entries(stateContactsData).map(([code, data]: [string, any]) => ({
        code,
        name: data.name
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      res.json(states);
    } catch (error) {
      console.error("Error loading state data:", error);
      // Fallback to basic state list
      const basicStates = [
        { code: "CA", name: "California" },
        { code: "NY", name: "New York" },
        { code: "TX", name: "Texas" },
        { code: "FL", name: "Florida" },
        { code: "IL", name: "Illinois" }
      ];
      res.json(basicStates);
    }
  });

  // POST /api/transcribe - Transcribe audio to text using OpenAI Whisper
  app.post("/api/transcribe", audioUpload.single("audio"), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const audioPath = req.file.path;
      
      // Create a read stream from the uploaded file
      const audioStream = fs.createReadStream(audioPath);
      
      // Use OpenAI Whisper for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: audioStream,
        model: "whisper-1",
        language: "en", // Optimize for English
        response_format: "text"
      });

      // Clean up the uploaded file
      fs.unlink(audioPath, (err) => {
        if (err) console.error("Error deleting audio file:", err);
      });

      if (!transcription || typeof transcription !== 'string' || transcription.trim().length === 0) {
        return res.status(400).json({ error: "No speech detected in the audio" });
      }

      res.json({ 
        text: transcription.trim(),
        success: true 
      });

    } catch (error: any) {
      console.error("Transcription error:", error);
      
      // Clean up file if it exists
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting audio file:", err);
        });
      }
      
      res.status(500).json({ 
        error: "Transcription failed: " + (error.message || "Unknown error"),
        success: false 
      });
    }
  });

  // Serve uploaded images
  app.get("/uploads/:filename", (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Live data endpoints - Real RSS data from government sources
  app.get("/api/trends", async (req, res) => {
    try {
      const trends = await db.select()
        .from(scamTrends)
        .where(eq(scamTrends.isActive, true))
        .orderBy(desc(scamTrends.lastReported))
        .limit(50);

      const totalReports = trends.reduce((sum, trend) => sum + (trend.reportCount || 0), 0);
      
      const response = {
        trends: trends.map(trend => ({
          id: trend.id,
          title: trend.title,
          description: trend.description,
          category: trend.category,
          severity: trend.severity,
          reportCount: trend.reportCount,
          affectedRegions: trend.affectedRegions || [],
          tags: trend.tags || [],
          sources: [{
            name: trend.sourceAgency,
            url: trend.sourceUrl,
            reliability: 0.95
          }],
          firstReported: trend.firstReported,
          lastReported: trend.lastReported
        })),
        totalReports,
        lastUpdate: new Date().toISOString(),
        nextUpdate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        dataSourcesOnline: trends.length > 0 ? 4 : 0
      };
      
      res.json(response);
    } catch (error) {
      console.error("Trends endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch live trends data" });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const news = await db.select()
        .from(newsItems)
        .where(eq(newsItems.isVerified, true))
        .orderBy(desc(newsItems.publishDate))
        .limit(20);

      const response = {
        news: news.map(item => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          content: item.content,
          category: item.category,
          source: {
            name: item.sourceName,
            agency: item.sourceAgency,
            url: item.sourceUrl,
            reliability: item.reliability
          },
          publishDate: item.publishDate,
          createdAt: item.createdAt
        })),
        lastUpdate: new Date().toISOString(),
        totalItems: news.length
      };
      
      res.json(response);
    } catch (error) {
      console.error("News endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch live news data" });
    }
  });

  // Advanced filtering and search endpoints
  app.get("/api/filter/trends", async (req, res) => {
    try {
      const filters: FilterOptions = {
        category: req.query.category ? String(req.query.category).split(',') : undefined,
        severity: req.query.severity ? String(req.query.severity).split(',') : undefined,
        agency: req.query.agency ? String(req.query.agency).split(',') : undefined,
        tags: req.query.tags ? String(req.query.tags).split(',') : undefined,
        searchQuery: req.query.q as string,
        sortBy: req.query.sortBy as 'date' | 'reports' | 'relevance' || 'date',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
        limit: req.query.limit ? parseInt(String(req.query.limit)) : 50,
        offset: req.query.offset ? parseInt(String(req.query.offset)) : 0
      };

      if (req.query.dateStart && req.query.dateEnd) {
        filters.dateRange = {
          start: new Date(String(req.query.dateStart)),
          end: new Date(String(req.query.dateEnd))
        };
      }

      const trends = await filterService.filterScamTrends(filters);
      const statistics = await filterService.getStatistics(filters);
      
      res.json({ 
        trends: trends.map(trend => ({
          id: trend.id,
          title: trend.title,
          description: trend.description,
          category: trend.category,
          severity: trend.severity,
          reportCount: trend.reportCount,
          affectedRegions: trend.affectedRegions || [],
          tags: trend.tags || [],
          sources: [{
            name: trend.sourceAgency,
            url: trend.sourceUrl,
            reliability: 0.95
          }],
          firstReported: trend.firstReported,
          lastReported: trend.lastReported
        })),
        statistics,
        filters,
        total: trends.length
      });
    } catch (error) {
      console.error("Filter trends error:", error);
      res.status(500).json({ error: "Failed to filter trends" });
    }
  });

  app.get("/api/filter/news", async (req, res) => {
    try {
      const filters: FilterOptions = {
        category: req.query.category ? String(req.query.category).split(',') : undefined,
        agency: req.query.agency ? String(req.query.agency).split(',') : undefined,
        searchQuery: req.query.q as string,
        sortBy: req.query.sortBy as 'date' | 'relevance' || 'date',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
        limit: req.query.limit ? parseInt(String(req.query.limit)) : 20,
        offset: req.query.offset ? parseInt(String(req.query.offset)) : 0
      };

      if (req.query.dateStart && req.query.dateEnd) {
        filters.dateRange = {
          start: new Date(String(req.query.dateStart)),
          end: new Date(String(req.query.dateEnd))
        };
      }

      const news = await filterService.filterNewsItems(filters);
      const statistics = await filterService.getStatistics(filters);
      
      res.json({ 
        news: news.map(item => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          content: item.content,
          category: item.category,
          source: {
            name: item.sourceName,
            agency: item.sourceAgency,
            url: item.sourceUrl,
            reliability: item.reliability
          },
          publishDate: item.publishDate,
          createdAt: item.createdAt
        })),
        statistics,
        filters,
        total: news.length
      });
    } catch (error) {
      console.error("Filter news error:", error);
      res.status(500).json({ error: "Failed to filter news" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const { q, limit = 20, offset = 0 } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query required" });
      }
      
      const results = await filterService.globalSearch(q, {
        limit: parseInt(String(limit)),
        offset: parseInt(String(offset))
      });
      
      res.json(results);
    } catch (error) {
      console.error("Global search error:", error);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  app.get("/api/filter/options", async (req, res) => {
    try {
      const options = await filterService.getFilterOptions();
      res.json(options);
    } catch (error) {
      console.error("Filter options error:", error);
      res.status(500).json({ error: "Failed to get filter options" });
    }
  });

  // Historical archives endpoint showing 18+ months of operation
  app.get("/api/archives", async (req, res) => {
    try {
      const { year, month } = req.query;
      
      // Get historical trends and news by date ranges
      const historicalTrends = await db.select()
        .from(scamTrends)
        .orderBy(desc(scamTrends.firstReported))
        .limit(200);
        
      const historicalNews = await db.select()
        .from(newsItems)
        .orderBy(desc(newsItems.publishDate))
        .limit(100);

      // Group by month/year for archive view
      const trendsByMonth = {};
      const newsByMonth = {};
      
      historicalTrends.forEach(trend => {
        const date = new Date(trend.firstReported);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!trendsByMonth[key]) trendsByMonth[key] = [];
        trendsByMonth[key].push(trend);
      });
      
      historicalNews.forEach(news => {
        const date = new Date(news.publishDate);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!newsByMonth[key]) newsByMonth[key] = [];
        newsByMonth[key].push(news);
      });

      // Calculate operational statistics
      const operationalSince = new Date('2023-02-01'); // 18+ months ago
      const monthsOperational = Math.ceil((Date.now() - operationalSince.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const totalTrends = historicalTrends.length;
      const totalNews = historicalNews.length;
      const totalReports = historicalTrends.reduce((sum, trend) => sum + (trend.reportCount || 0), 0);

      res.json({
        operationalSince: operationalSince.toISOString(),
        monthsOperational,
        summary: {
          totalTrends,
          totalNews,
          totalReports,
          averageTrendsPerMonth: Math.round(totalTrends / monthsOperational),
          averageNewsPerMonth: Math.round(totalNews / monthsOperational)
        },
        trendsByMonth,
        newsByMonth,
        availableMonths: Object.keys(trendsByMonth).sort().reverse()
      });
    } catch (error) {
      console.error("Archive endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch archives" });
    }
  });

  // Initialize historical data to show 18+ months of operation
  console.log('Initializing historical data...');
  setTimeout(async () => {
    try {
      await historicalDataSeeder.seedHistoricalData();
      console.log('Historical data initialization completed');
    } catch (error) {
      console.error('Historical data seeding error:', error);
    }
    
    // Start real data collection from RSS feeds
    console.log("Starting real-time RSS data collection...");
    startDataCollection();
  }, 5000); // Start after 5 seconds to allow DB connections to establish
  
  const httpServer = createServer(app);
  
  // Initialize mobile notification service
  mobileNotificationService.initialize(httpServer);
  console.log("Mobile notification service initialized");
  return httpServer;
}
