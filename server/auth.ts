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

  // Configure Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.REPLIT_DEV_DOMAIN ? 'https://' + process.env.REPLIT_DEV_DOMAIN : 'http://localhost:5000'}/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user information from Google profile
        const googleUser = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          profileImage: profile.photos?.[0]?.value || '',
        };

        // Find or create user
        let user = await storage.getUserByGoogleId(googleUser.id);
        
        if (!user) {
          // Check if user exists by email
          const existingUser = await storage.getUserByEmail(googleUser.email);
          if (existingUser) {
            // Link Google account to existing user
            user = await storage.linkGoogleAccount(existingUser.id, googleUser.id);
          } else {
            // Create new user
            user = await storage.createUser({
              email: googleUser.email,
              name: googleUser.name,
              profileImage: googleUser.profileImage,
              googleId: googleUser.id,
            });
          }
        } else {
          // Update user information
          user = await storage.updateUser(user.id, {
            name: googleUser.name,
            profileImage: googleUser.profileImage,
            lastActiveAt: new Date(),
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('OAuth error:', error);
        return done(error, undefined);
      }
    }));
  }

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
  // Google OAuth login route
  app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // Google OAuth callback route
  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req: Request, res: Response) => {
      // Successful authentication
      res.redirect('/dashboard');
    }
  );

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