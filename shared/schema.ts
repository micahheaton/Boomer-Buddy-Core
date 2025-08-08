import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

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
