import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, real, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enhanced user table with OAuth and personal features
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  profileImage: text("profile_image"),
  googleId: text("google_id").unique(),
  
  // Personal safety features
  safetyScore: real("safety_score").default(0), // Boomer Buddy Safety Score 0-100
  totalAnalyses: integer("total_analyses").default(0),
  scamsDetected: integer("scams_detected").default(0),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  
  // Preferences
  preferences: jsonb("preferences").default(sql`'{}'::jsonb`), // UI preferences, notification settings, etc.
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User activity log for tracking safety improvements
export const userActivities = pgTable("user_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // "analysis_completed", "scam_avoided", "trend_viewed", etc.
  description: text("description"),
  metadata: jsonb("metadata"), // Additional activity data
  points: integer("points").default(0), // Points earned for this activity
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  inputType: text("input_type").notNull(), // "image" | "text"
  text: text("text"),
  imagePath: text("image_path"),
  state: text("state"),
  phoneNumber: text("phone_number"),
  emailFrom: text("email_from"),
  channel: text("channel"), // "sms" | "email" | "phone" | "social" | "web"
  resultJson: jsonb("result_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema definitions for database operations
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  profileImage: true,
  googleId: true,
});

// Real scam trends table for verified data from government sources
export const scamTrends = pgTable("scam_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull(), // 'critical' | 'high' | 'medium' | 'low'
  reportCount: integer("report_count").default(1),
  affectedRegions: jsonb("affected_regions").default(sql`'[]'::jsonb`),
  sourceAgency: text("source_agency").notNull(), // FTC, FBI, BBB, etc.
  sourceUrl: text("source_url").notNull().unique(),
  verificationStatus: text("verification_status").default('verified'),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  firstReported: timestamp("first_reported").notNull(),
  lastReported: timestamp("last_reported").notNull(),
  isActive: boolean("is_active").default(true),
  elderVulnerabilities: jsonb("elder_vulnerabilities").default(sql`'[]'::jsonb`),
  preventionTips: jsonb("prevention_tips").default(sql`'[]'::jsonb`),
  reportingInstructions: text("reporting_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Real news items from verified sources
export const newsItems = pgTable("news_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  sourceAgency: text("source_agency").notNull(),
  sourceUrl: text("source_url").notNull().unique(),
  sourceName: text("source_name").notNull(),
  reliability: real("reliability").notNull(), // 0.0 to 1.0
  publishDate: timestamp("publish_date").notNull(),
  isVerified: boolean("is_verified").default(false),
  relatedTrends: jsonb("related_trends").default(sql`'[]'::jsonb`),
  elderRelevanceScore: real("elder_relevance_score"),
  elderVulnerabilities: jsonb("elder_vulnerabilities").default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Data source monitoring table
export const dataSources = pgTable("data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  agency: text("agency").notNull(),
  lastChecked: timestamp("last_checked"),
  status: text("status").notNull().default('active'), // 'active' | 'error' | 'inactive'
  reliability: real("reliability").notNull(),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Community reports submitted by users
export const communityReports = pgTable("community_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'phone-scam', 'email-scam', 'online-scam', etc.
  scamType: text("scam_type"), // 'phishing', 'romance', 'investment', etc.
  location: text("location"), // City, State or general location
  phoneNumber: text("phone_number"), // If phone scam
  emailAddress: text("email_address"), // If email scam
  websiteUrl: text("website_url"), // If website scam
  amountLost: integer("amount_lost"), // In cents, if money was lost
  evidence: jsonb("evidence").default(sql`'[]'::jsonb`), // Array of evidence URLs/descriptions
  isVerified: boolean("is_verified").default(false),
  verificationStatus: text("verification_status").default('pending'), // 'pending', 'verified', 'rejected', 'duplicate'
  verificationSource: text("verification_source"), // Which source verified this
  verificationDate: timestamp("verification_date"),
  moderationStatus: text("moderation_status").default('pending'), // 'approved', 'rejected', 'spam'
  moderationReason: text("moderation_reason"),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  reportCount: integer("report_count").default(0), // Number of similar reports
  relatedTrendId: varchar("related_trend_id").references(() => scamTrends.id),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User points and reputation system
export const userPoints = pgTable("user_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  pointType: text("point_type").notNull(), // 'report_submission', 'verification', 'helpful_vote', etc.
  points: integer("points").notNull(),
  description: text("description").notNull(),
  relatedId: varchar("related_id"), // ID of related report/action
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Validated data sources for auto-verification
export const validatedSources = pgTable("validated_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  baseUrl: text("base_url").notNull(),
  sourceType: text("source_type").notNull(), // 'rss', 'api', 'website'
  category: text("category").notNull(), // 'government', 'news', 'security', 'consumer-protection'
  agency: text("agency"),
  reliability: real("reliability").notNull().default(0.5), // 0.0 to 1.0
  trustScore: real("trust_score").notNull().default(0.5), // Based on validation accuracy
  lastValidated: timestamp("last_validated"),
  validationCount: integer("validation_count").default(0),
  successfulValidations: integer("successful_validations").default(0),
  isActive: boolean("is_active").default(true),
  autoDiscovered: boolean("auto_discovered").default(false),
  discoveredDate: timestamp("discovered_date"),
  verificationCriteria: jsonb("verification_criteria").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Source validation history
export const sourceValidations = pgTable("source_validations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull().references(() => validatedSources.id),
  reportId: varchar("report_id").references(() => communityReports.id),
  validationType: text("validation_type").notNull(), // 'content_match', 'url_verification', 'domain_check'
  isSuccessful: boolean("is_successful").notNull(),
  confidence: real("confidence").notNull(), // 0.0 to 1.0
  validationData: jsonb("validation_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Automated moderation logs
export const moderationLogs = pgTable("moderation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull().references(() => communityReports.id),
  action: text("action").notNull(), // 'approved', 'rejected', 'marked_spam', 'marked_duplicate'
  reason: text("reason").notNull(),
  confidence: real("confidence").notNull(),
  automatedRules: jsonb("automated_rules"), // Rules that triggered this action
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  name: true,
  profileImage: true,
  googleId: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  inputType: true,
  text: true,
  imagePath: true,
  state: true,
  phoneNumber: true,
  emailFrom: true,
  channel: true,
  resultJson: true,
}).extend({
  userId: z.string().optional(),
});

export const insertUserActivitySchema = createInsertSchema(userActivities).pick({
  userId: true,
  activityType: true,
  description: true,
  metadata: true,
  points: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivities.$inferSelect;

// Scam Analysis Types
export const scamAnalysisRequestSchema = z.object({
  userId: z.string().nullable().optional(),
  inputType: z.enum(["image", "text"]).optional(),
  text: z.string().optional(),
  imageUrl: z.string().optional(),
  state: z.string().optional(),
  phoneNumber: z.string().optional(),
  emailFrom: z.string().optional(),
  channel: z.enum(["sms", "email", "phone", "social", "web"]).optional(),
});

export const scamAnalysisResultSchema = z.object({
  scam_score: z.number().min(0).max(100),
  confidence: z.enum(["low", "medium", "high"]),
  label: z.enum(["Likely scam", "Unclear", "Likely legitimate"]),
  top_signals: z.array(z.string()),
  explanation: z.string(),
  recommended_actions: z.array(z.object({
    title: z.string(),
    steps: z.array(z.string()),
    when: z.string(),
  })),
  contacts: z.object({
    law_enforcement: z.array(z.object({
      name: z.string(),
      contact: z.string(),
      type: z.string(),
    })),
    financial: z.array(z.object({
      name: z.string(),
      contact: z.string(),
      type: z.string(),
    })),
    state_local: z.array(z.object({
      name: z.string(),
      contact: z.string(),
      state: z.string().optional(),
    })),
  }),
  legal_language: z.string(),
  version: z.string(),
});

export type ScamAnalysisRequest = z.infer<typeof scamAnalysisRequestSchema>;
export type ScamAnalysisResult = z.infer<typeof scamAnalysisResultSchema>;
