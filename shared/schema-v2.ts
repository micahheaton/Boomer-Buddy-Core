import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums for better data integrity
export const contentTypeEnum = pgEnum('content_type', ['scam_alert', 'news_update', 'advisory', 'warning']);
export const riskLevelEnum = pgEnum('risk_level', ['info', 'low', 'medium', 'high', 'critical']);
export const sourceTypeEnum = pgEnum('source_type', ['federal', 'state', 'nonprofit']);
export const contentStatusEnum = pgEnum('content_status', ['active', 'archived', 'superseded']);

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (required for auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Government Data Sources - Real RSS feeds
export const dataSources = pgTable("data_sources_v2", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull().unique(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  agency: varchar("agency", { length: 255 }).notNull(), // FTC, FBI, SSA, etc.
  isActive: boolean("is_active").default(true),
  lastChecked: timestamp("last_checked"),
  lastSuccessful: timestamp("last_successful"),
  itemCount: integer("item_count").default(0),
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Government Content - All items from RSS feeds
export const governmentContent = pgTable("government_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull().references(() => dataSources.id),
  
  // Core content
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  content: text("content"),
  url: varchar("url", { length: 500 }).notNull(),
  
  // Classification
  contentType: contentTypeEnum("content_type").notNull(),
  riskLevel: riskLevelEnum("risk_level").default('info'),
  
  // Metadata
  publishedAt: timestamp("published_at").notNull(),
  scrapedAt: timestamp("scraped_at").defaultNow(),
  status: contentStatusEnum("status").default('active'),
  
  // Scam-specific fields (null for regular news)
  scamTypes: jsonb("scam_types").$type<string[]>(), // ["phone", "email", "medicare"]
  targetDemographics: jsonb("target_demographics").$type<string[]>(), // ["seniors", "veterans"]
  reportedLosses: integer("reported_losses"), // in cents
  affectedStates: jsonb("affected_states").$type<string[]>(), // state codes
  
  // Analytics
  similarityScore: integer("similarity_score").default(0), // for deduplication
  elderRelevanceScore: integer("elder_relevance_score").default(0), // 0-100
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Threat Intelligence - Aggregated scam trends
export const threatIntelligence = pgTable("threat_intelligence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Threat identification
  threatName: varchar("threat_name", { length: 255 }).notNull(),
  threatType: varchar("threat_type", { length: 100 }).notNull(), // "phone_scam", "email_fraud", etc.
  
  // Risk assessment
  currentRiskLevel: riskLevelEnum("current_risk_level").notNull(),
  trendDirection: varchar("trend_direction", { length: 20 }).notNull(), // "increasing", "stable", "decreasing"
  
  // Geographic data
  affectedStates: jsonb("affected_states").$type<string[]>(),
  hotspotStates: jsonb("hotspot_states").$type<string[]>(),
  
  // Statistics
  totalReports: integer("total_reports").default(0),
  reportsThisWeek: integer("reports_this_week").default(0),
  estimatedLosses: integer("estimated_losses").default(0), // in cents
  
  // Content references
  sourceContentIds: jsonb("source_content_ids").$type<string[]>(),
  lastUpdatedFromSource: timestamp("last_updated_from_source"),
  
  // Metadata
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Geographic Risk Data for Heatmap
export const geographicRisk = pgTable("geographic_risk", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  stateName: varchar("state_name", { length: 50 }).notNull(),
  
  // Risk metrics
  overallRiskScore: integer("overall_risk_score").notNull(), // 0-100
  activeThreats: integer("active_threats").default(0),
  reportsLast30Days: integer("reports_last_30_days").default(0),
  
  // Demographics
  seniorPopulation: integer("senior_population"), // percentage
  vulnerabilityIndex: integer("vulnerability_index"), // 0-100
  
  // Top threats for this state
  topThreats: jsonb("top_threats").$type<Array<{
    threatType: string;
    reportCount: number;
    riskLevel: string;
  }>>(),
  
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Export types
export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = typeof dataSources.$inferInsert;

export type GovernmentContent = typeof governmentContent.$inferSelect;
export type InsertGovernmentContent = typeof governmentContent.$inferInsert;

export type ThreatIntelligence = typeof threatIntelligence.$inferSelect;
export type InsertThreatIntelligence = typeof threatIntelligence.$inferInsert;

export type GeographicRisk = typeof geographicRisk.$inferSelect;
export type InsertGeographicRisk = typeof geographicRisk.$inferInsert;

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Zod schemas for validation
export const insertDataSourceSchema = createInsertSchema(dataSources);
export const insertGovernmentContentSchema = createInsertSchema(governmentContent);
export const insertThreatIntelligenceSchema = createInsertSchema(threatIntelligence);
export const insertGeographicRiskSchema = createInsertSchema(geographicRisk);