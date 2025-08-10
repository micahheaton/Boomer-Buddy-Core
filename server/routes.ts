import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeScam } from "./openai";
import { extractTextFromImage } from "./ocr";
import { getMockAnalysis } from "./mockAnalysis";
import { scamAnalysisRequestSchema, type ScamAnalysisResult } from "@shared/schema";
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

  // POST /api/analyze - Analyze content for scam patterns
  app.post("/api/analyze", upload.single("image"), async (req: Request & { file?: Express.Multer.File }, res) => {
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

      // Try OpenAI first, fallback to pattern-based analysis
      let analysisResult;
      try {
        analysisResult = await analyzeScam(requestData.text, {
          channel: requestData.channel,
          state: requestData.state,
          federalContacts,
          financialContacts,
          stateContacts,
        });
        console.log("Analysis completed with OpenAI");
      } catch (aiError: any) {
        console.log("OpenAI failed, using pattern-based analysis:", aiError.message);
        analysisResult = getMockAnalysis(requestData.text, {
          channel: requestData.channel,
          state: requestData.state,
          federalContacts,
          financialContacts,
          stateContacts,
        });
        console.log("Analysis completed with pattern matching");
      }

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

  const httpServer = createServer(app);
  return httpServer;
}
