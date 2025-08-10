import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { 
  dataSources,
  scamTrends,
  newsItems
} from "@shared/schema";
import { eq, desc, and, sql, count, gte } from "drizzle-orm";
import { dataCollectorV2 } from "./dataCollectorV2";

export async function registerRoutesV2(app: Express): Promise<Server> {
  
  // Initialize data sources on server start
  await dataCollectorV2.initializeDataSources();
  
  // Data Sources API - Real government sources
  app.get("/api/v2/data-sources", async (req, res) => {
    try {
      const sources = await db.select({
        id: dataSources.id,
        name: dataSources.name,
        url: dataSources.url,
        status: dataSources.status,
        lastChecked: dataSources.lastChecked,
        errorCount: dataSources.errorCount,
      })
      .from(dataSources)
      .orderBy(dataSources.name);
      
      // Calculate summary statistics
      const totalSources = sources.length;
      const activeSources = sources.filter(s => s.status === 'active').length;
      const onlineSources = sources.filter(s => 
        s.status === 'active' && s.errorCount < 3
      ).length;
      const totalItems = sources.reduce((sum, s) => sum + (s.errorCount || 0), 0);
      
      res.json({
        sources,
        summary: {
          totalSources,
          activeSources,
          onlineSources,
          totalItems,
          lastUpdate: new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error("Error fetching data sources:", error);
      res.status(500).json({ error: "Failed to fetch data sources" });
    }
  });
  
  // Verified News API - Government information (not scam alerts)
  app.get("/api/v2/news", async (req, res) => {
    try {
      const news = await db.select({
        id: newsItems.id,
        title: newsItems.title,
        summary: newsItems.summary,
        url: newsItems.url,
        publishedAt: newsItems.publishedAt,
        agency: newsItems.source,
        reliability: newsItems.reliability,
      })
      .from(newsItems)
      .where(eq(newsItems.category, 'Government Update'))
      .orderBy(desc(newsItems.publishedAt))
      .limit(50);
      
      res.json({
        news,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });
  
  // Scam Trends API - Only actual scam alerts and warnings
  app.get("/api/v2/scam-trends", async (req, res) => {
    try {
      const trends = await db.select({
        id: scamTrends.id,
        title: scamTrends.title,
        description: scamTrends.description,
        category: scamTrends.category,
        riskLevel: scamTrends.riskLevel,
        affectedDemographics: scamTrends.affectedDemographics,
        geographicScope: scamTrends.geographicScope,
        reportCount: scamTrends.reportCount,
        verifiedSources: scamTrends.verifiedSources,
        lastUpdated: scamTrends.lastUpdated,
        elderTargeted: scamTrends.elderTargeted,
      })
      .from(scamTrends)
      .where(eq(scamTrends.isActive, true))
      .orderBy(desc(scamTrends.lastUpdated))
      .limit(30);
      
      res.json({
        trends,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching scam trends:", error);
      res.status(500).json({ error: "Failed to fetch scam trends" });
    }
  });
  
  // Threat Intelligence API - Aggregated threat data
  app.get("/api/v2/threat-intelligence", async (req, res) => {
    try {
      const threats = await db.select()
        .from(threatIntelligence)
        .where(eq(threatIntelligence.isActive, true))
        .orderBy(desc(threatIntelligence.currentRiskLevel), desc(threatIntelligence.reportsThisWeek));
      
      // Get summary statistics
      const criticalThreats = threats.filter(t => t.currentRiskLevel === 'critical').length;
      const highThreats = threats.filter(t => t.currentRiskLevel === 'high').length;
      const totalReports = threats.reduce((sum, t) => sum + t.totalReports, 0);
      const reportsThisWeek = threats.reduce((sum, t) => sum + t.reportsThisWeek, 0);
      
      res.json({
        threats,
        summary: {
          criticalThreats,
          highThreats,
          totalThreats: threats.length,
          totalReports,
          reportsThisWeek,
        },
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching threat intelligence:", error);
      res.status(500).json({ error: "Failed to fetch threat intelligence" });
    }
  });
  
  // Geographic Risk API - Heatmap data
  app.get("/api/v2/heatmap", async (req, res) => {
    try {
      const riskData = await db.select()
        .from(geographicRisk)
        .orderBy(desc(geographicRisk.overallRiskScore));
      
      // Calculate national statistics
      const avgRiskScore = riskData.reduce((sum, s) => sum + s.overallRiskScore, 0) / riskData.length;
      const highRiskStates = riskData.filter(s => s.overallRiskScore >= 60).length;
      const totalActiveThreats = riskData.reduce((sum, s) => sum + s.activeThreats, 0);
      const totalReports = riskData.reduce((sum, s) => sum + s.reportsLast30Days, 0);
      
      res.json({
        states: riskData,
        nationalStats: {
          averageRiskScore: Math.round(avgRiskScore),
          highRiskStates,
          totalActiveThreats,
          totalReports,
        },
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
  });
  
  // Data Collection Trigger (for testing/manual updates)
  app.post("/api/v2/collect-data", async (req, res) => {
    try {
      // Run data collection in background
      dataCollectorV2.collectAllData().catch(console.error);
      
      res.json({
        message: "Data collection started",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error starting data collection:", error);
      res.status(500).json({ error: "Failed to start data collection" });
    }
  });
  
  // Health Check
  app.get("/api/v2/health", async (req, res) => {
    try {
      // Check database connectivity
      const sourceCount = await db.select({ count: count() }).from(dataSources);
      const contentCount = await db.select({ count: count() }).from(governmentContent);
      
      // Check recent data
      const recentContent = await db.select({ count: count() })
        .from(governmentContent)
        .where(gte(governmentContent.publishedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
      
      res.json({
        status: "healthy",
        database: {
          dataSources: sourceCount[0].count,
          totalContent: contentCount[0].count,
          recentContent: recentContent[0].count,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}