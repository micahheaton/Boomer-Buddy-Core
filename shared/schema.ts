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
