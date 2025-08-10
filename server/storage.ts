import { 
  users, 
  analyses, 
  userActivities,
  type User, 
  type Analysis, 
  type UserActivity,
  type InsertUser, 
  type InsertAnalysis,
  type InsertUserActivity,
  type UpsertUser 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  linkGoogleAccount(userId: string, googleId: string): Promise<User>;
  
  // Analysis management
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getAnalysesByUser(userId: string, limit?: number): Promise<Analysis[]>;
  
  // User activity tracking
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserActivities(userId: string, limit?: number): Promise<UserActivity[]>;
  
  // User stats and scoring
  updateUserStats(userId: string, stats: { totalAnalyses?: number; scamsDetected?: number; safetyScore?: number }): Promise<User>;
  getUserStats(userId: string): Promise<{ totalAnalyses: number; scamsDetected: number; safetyScore: number; recentActivities: UserActivity[] }>;
}

export class DatabaseStorage implements IStorage {
  // User management methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        safetyScore: 0,
        totalAnalyses: 0,
        scamsDetected: 0,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ googleId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Analysis management methods
  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db
      .insert(analyses)
      .values(insertAnalysis)
      .returning();
    
    // Update user stats if user is authenticated
    if (insertAnalysis.userId) {
      const result = insertAnalysis.resultJson as any;
      const isScam = result?.scam_score > 70;
      
      await db
        .update(users)
        .set({
          totalAnalyses: sql`${users.totalAnalyses} + 1`,
          scamsDetected: isScam ? sql`${users.scamsDetected} + 1` : users.scamsDetected,
          lastActiveAt: new Date(),
        })
        .where(eq(users.id, insertAnalysis.userId));
      
      // Create activity log
      await this.createUserActivity({
        userId: insertAnalysis.userId,
        activityType: 'analysis_completed',
        description: isScam ? 'Scam detected and avoided' : 'Content analyzed as safe',
        points: isScam ? 10 : 5,
        metadata: { analysisId: analysis.id, scamScore: result?.scam_score || 0 },
      });
    }
    
    return analysis;
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis || undefined;
  }

  async getAnalysesByUser(userId: string, limit: number = 50): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt))
      .limit(limit);
  }

  // User activity methods
  async createUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [userActivity] = await db
      .insert(userActivities)
      .values(activity)
      .returning();
    return userActivity;
  }

  async getUserActivities(userId: string, limit: number = 20): Promise<UserActivity[]> {
    return await db
      .select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.createdAt))
      .limit(limit);
  }

  // User stats methods
  async updateUserStats(userId: string, stats: { totalAnalyses?: number; scamsDetected?: number; safetyScore?: number }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserStats(userId: string): Promise<{ totalAnalyses: number; scamsDetected: number; safetyScore: number; recentActivities: UserActivity[] }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const recentActivities = await this.getUserActivities(userId, 10);
    
    // Calculate safety score based on activities and analyses
    const safetyScore = Math.min(100, user.totalAnalyses * 2 + user.scamsDetected * 5);
    
    // Update safety score if changed
    if (safetyScore !== user.safetyScore) {
      await this.updateUserStats(userId, { safetyScore });
    }

    return {
      totalAnalyses: user.totalAnalyses || 0,
      scamsDetected: user.scamsDetected || 0,
      safetyScore: safetyScore,
      recentActivities,
    };
  }
}

export const storage = new DatabaseStorage();
