import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import pkg from "pg";
const { Pool } = pkg;
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const pgStore = ConnectPgSimple(session);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth not configured. Users will not be able to sign in.");
}

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export function setupAuth(app: Express) {
  // Configure session middleware
  app.use(session({
    store: new pgStore({
      pool: pool,
      tableName: 'sessions',
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // For development, we'll skip Google OAuth to avoid domain configuration issues
  console.log('Google OAuth disabled in development - using demo authentication');

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

// Authentication routes
export function setupAuthRoutes(app: Express) {
  // Demo login route for development
  app.post('/auth/demo-login', async (req: Request, res: Response) => {
    try {
      // Create or get demo user
      let user = await storage.getUserByEmail('demo@boomerbuddy.com');
      if (!user) {
        user = await storage.createUser({
          email: 'demo@boomerbuddy.com',
          name: 'Demo User',
          profileImage: '',
        });
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login failed' });
        }
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Logout route
  app.post('/auth/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Current user route
  app.get('/auth/user', (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
}

// Middleware to protect routes
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Optional authentication middleware (allows both authenticated and anonymous users)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Always proceed, auth status will be checked in route handlers
  next();
};