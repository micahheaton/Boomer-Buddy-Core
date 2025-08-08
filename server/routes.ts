import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeScam } from "./openai";
import { extractTextFromImage } from "./ocr";
import { scamAnalysisRequestSchema, type ScamAnalysisResult } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Load knowledge base data
  const federalContacts = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/contacts_federal.json"), "utf-8"));
  const financialContacts = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/contacts_financial.json"), "utf-8"));
  const stateContacts = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/contacts_states.json"), "utf-8"));

  // POST /api/analyze - Analyze content for scam patterns
  app.post("/api/analyze", upload.single("image"), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      let requestData;
      
      if (req.file) {
        // Handle image upload
        const imagePath = req.file.path;
        const extractedText = await extractTextFromImage(imagePath);
        
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
        requestData = scamAnalysisRequestSchema.parse(req.body);
      }

      if (!requestData.text) {
        return res.status(400).json({ error: "No text content to analyze" });
      }

      // Analyze with OpenAI
      const analysisResult = await analyzeScam(requestData.text, {
        channel: requestData.channel,
        state: requestData.state,
        federalContacts,
        financialContacts,
        stateContacts,
      });

      // Save analysis to database
      const analysis = await storage.createAnalysis({
        userId: requestData.userId || undefined,
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
    const states = Object.keys(stateContacts).map(code => ({
      code,
      name: stateContacts[code].name,
    }));
    res.json(states);
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

  const httpServer = createServer(app);
  return httpServer;
}
