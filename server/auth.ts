import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Augment the Express Request type to include the user property
declare global {
  namespace Express {
    // Define the User interface for the Express session
    interface User {
      id: number;
      username: string;
      email: string;
      fullName?: string;
      role: 'user' | 'admin';
      profilePicture?: string;
      isActive: boolean;
      lastLogin?: Date;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

// Helper functions for password hashing
const scryptAsync = promisify(scrypt);

/**
 * Hash a password with a random salt
 */
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compare a plaintext password against a hashed password
 */
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Configure and setup authentication for the Express app
 */
export function setupAuth(app: Express) {
  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: "lax",
    },
  };

  // Set up session handling
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(async (username: string, password: string, done: any) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        const isPasswordValid = await storage.verifyPassword(password, user.password);
        
        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Update last login time
        const updatedUser = await storage.updateUserLastLogin(user.id);
        return done(null, updatedUser || user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user for sessions
  passport.serializeUser((user: Express.User, done: (err: any, id?: number) => void) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done: (err: any, user?: Express.User | false) => void) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      // Don't expose password hash
      const userWithoutPassword = { ...user } as any;
      if (userWithoutPassword.password) {
        delete userWithoutPassword.password;
      }
      
      done(null, userWithoutPassword as Express.User);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  // Register new user
  app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if username or email already exists
      const existingByUsername = await storage.getUserByUsername(req.body.username);
      if (existingByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingByEmail = await storage.getUserByEmail(req.body.email);
      if (existingByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Register the new user
      const userData = {
        ...req.body,
        password: await hashPassword(req.body.password)
      };
      
      const user = await storage.registerUser(userData);
      
      // Log the user in
      req.login(user as any, (err: any) => {
        if (err) {
          return next(err);
        }
        
        // Don't expose password hash in response
        const userWithoutPassword = { ...user };
        if ('password' in userWithoutPassword) {
          delete (userWithoutPassword as any).password;
        }
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login
  app.post('/api/auth/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: any, user: any, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err: any) => {
        if (err) {
          return next(err);
        }
        
        // Don't expose password hash in response
        const userWithoutPassword = { ...user };
        if ('password' in userWithoutPassword) {
          delete (userWithoutPassword as any).password;
        }
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err: any) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get('/api/auth/user', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.status(200).json(req.user);
  });

  // Middleware for protected routes
  app.use('/api/protected', (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Check if user has admin role for admin-only routes
    if (req.path.startsWith('/admin') && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  });
}

/**
 * Middleware to check if a user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Authentication required" });
}

/**
 * Middleware to check if a user is an admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  
  res.status(403).json({ message: "Admin access required" });
}