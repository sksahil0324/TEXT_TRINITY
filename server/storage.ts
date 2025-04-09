import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { 
  User, InsertUser, RegisterUser, LoginUser,
  ProcessedFile, InsertProcessedFile, 
  TextOperation, InsertTextOperation,
  userSessions, UserSession, InsertUserSession,
  users, processedFiles, textOperations, userPreferences
} from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Create session store
const PostgresSessionStore = connectPgSimple(session);
const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<User | undefined>;
  
  // Authentication
  registerUser(data: RegisterUser): Promise<User>;
  loginUser(credentials: LoginUser): Promise<User | undefined>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  
  // Session management
  sessionStore: session.Store;
  createUserSession(data: InsertUserSession): Promise<UserSession>;
  getUserSessionByToken(token: string): Promise<UserSession | undefined>;
  removeUserSession(token: string): Promise<void>;
  
  // File operations
  createProcessedFile(file: InsertProcessedFile): Promise<ProcessedFile>;
  getProcessedFile(id: number): Promise<ProcessedFile | undefined>;
  getProcessedFilesByUserId(userId: number): Promise<ProcessedFile[]>;
  
  // Text operation history
  createTextOperation(operation: InsertTextOperation): Promise<TextOperation>;
  getTextOperation(id: number): Promise<TextOperation | undefined>;
  getRecentTextOperations(userId: number | null, limit: number): Promise<TextOperation[]>;
  getTextOperationsByType(userId: number | null, type: string): Promise<TextOperation[]>;
  getTextOperationsByUser(userId: number, limit: number): Promise<TextOperation[]>;
  starTextOperation(id: number, isStarred: boolean): Promise<void>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Setup database-backed session store for persistence
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'session', 
      createTableIfMissing: true
    });
  }

  // Password hashing and verification
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      const [hashed, salt] = hashedPassword.split('.');
      const hashedBuffer = Buffer.from(hashed, 'hex');
      const suppliedBuffer = (await scryptAsync(plainPassword, salt, 64)) as Buffer;
      return timingSafeEqual(hashedBuffer, suppliedBuffer);
    } catch (err) {
      console.error('Password verification error:', err);
      return false;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Authentication operations
  async registerUser(data: RegisterUser): Promise<User> {
    // Hash the password
    const hashedPassword = await this.hashPassword(data.password);
    
    // Create user with hashed password
    const [user] = await db.insert(users).values({
      username: data.username,
      password: hashedPassword,
      email: data.email,
      fullName: data.fullName,
      lastLogin: new Date()
    }).returning();
    
    // Create default preferences for the user
    await db.insert(userPreferences).values({
      userId: user.id,
    });
    
    return user;
  }

  async loginUser(credentials: LoginUser): Promise<User | undefined> {
    const user = await this.getUserByUsername(credentials.username);
    
    if (!user) {
      return undefined;
    }
    
    const passwordValid = await this.verifyPassword(credentials.password, user.password);
    
    if (!passwordValid) {
      return undefined;
    }
    
    // Update last login time
    return this.updateUserLastLogin(user.id);
  }

  // Session management
  async createUserSession(data: InsertUserSession): Promise<UserSession> {
    const [session] = await db.insert(userSessions).values(data).returning();
    return session;
  }

  async getUserSessionByToken(token: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.token, token));
    return session;
  }

  async removeUserSession(token: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.token, token));
  }

  // File operations
  async createProcessedFile(file: InsertProcessedFile): Promise<ProcessedFile> {
    const [processedFile] = await db.insert(processedFiles).values(file).returning();
    return processedFile;
  }

  async getProcessedFile(id: number): Promise<ProcessedFile | undefined> {
    const [file] = await db.select().from(processedFiles).where(eq(processedFiles.id, id));
    return file;
  }

  async getProcessedFilesByUserId(userId: number): Promise<ProcessedFile[]> {
    return db
      .select()
      .from(processedFiles)
      .where(eq(processedFiles.userId, userId))
      .orderBy(desc(processedFiles.createdAt));
  }

  // Text operations
  async createTextOperation(operation: InsertTextOperation): Promise<TextOperation> {
    const [textOperation] = await db
      .insert(textOperations)
      .values(operation)
      .returning();
    return textOperation;
  }

  async getTextOperation(id: number): Promise<TextOperation | undefined> {
    const [operation] = await db
      .select()
      .from(textOperations)
      .where(eq(textOperations.id, id));
    return operation;
  }

  async getRecentTextOperations(userId: number | null, limit: number): Promise<TextOperation[]> {
    if (userId === null) {
      return db
        .select()
        .from(textOperations)
        .orderBy(desc(textOperations.createdAt))
        .limit(limit);
    } else {
      return db
        .select()
        .from(textOperations)
        .where(eq(textOperations.userId, userId))
        .orderBy(desc(textOperations.createdAt))
        .limit(limit);
    }
  }

  async getTextOperationsByType(userId: number | null, type: string): Promise<TextOperation[]> {
    if (userId === null) {
      return db
        .select()
        .from(textOperations)
        .where(eq(textOperations.operationType, type))
        .orderBy(desc(textOperations.createdAt));
    } else {
      return db
        .select()
        .from(textOperations)
        .where(
          and(
            eq(textOperations.userId, userId),
            eq(textOperations.operationType, type)
          )
        )
        .orderBy(desc(textOperations.createdAt));
    }
  }

  async getTextOperationsByUser(userId: number, limit: number): Promise<TextOperation[]> {
    return db
      .select()
      .from(textOperations)
      .where(eq(textOperations.userId, userId))
      .orderBy(desc(textOperations.createdAt))
      .limit(limit);
  }

  async starTextOperation(id: number, isStarred: boolean): Promise<void> {
    await db
      .update(textOperations)
      .set({ isStarred })
      .where(eq(textOperations.id, id));
  }
}

// For backward compatibility, keep MemStorage class
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private processedFiles: Map<number, ProcessedFile>;
  private textOperations: Map<number, TextOperation>;
  private sessions: Map<string, UserSession>;
  private currentUserId: number;
  private currentFileId: number;
  private currentOperationId: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.processedFiles = new Map();
    this.textOperations = new Map();
    this.sessions = new Map();
    this.currentUserId = 1;
    this.currentFileId = 1;
    this.currentOperationId = 1;
    
    // Use memory store for sessions
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // Password hashing and verification
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      const [hashed, salt] = hashedPassword.split('.');
      const hashedBuffer = Buffer.from(hashed, 'hex');
      const suppliedBuffer = (await scryptAsync(plainPassword, salt, 64)) as Buffer;
      return timingSafeEqual(hashedBuffer, suppliedBuffer);
    } catch (err) {
      return false;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: 'user' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as User;
    
    this.users.set(id, user);
    return user;
  }

  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    user.lastLogin = new Date();
    user.updatedAt = new Date();
    this.users.set(id, user);
    
    return user;
  }

  // Authentication
  async registerUser(data: RegisterUser): Promise<User> {
    const hashedPassword = await this.hashPassword(data.password);
    
    const id = this.currentUserId++;
    const now = new Date();
    
    const user: User = {
      id,
      username: data.username,
      password: hashedPassword,
      email: data.email,
      fullName: data.fullName || '',
      role: 'user' as const,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLogin: now
    } as User;
    
    this.users.set(id, user);
    return user;
  }

  async loginUser(credentials: LoginUser): Promise<User | undefined> {
    const user = await this.getUserByUsername(credentials.username);
    
    if (!user) {
      return undefined;
    }
    
    const passwordValid = await this.verifyPassword(credentials.password, user.password);
    
    if (!passwordValid) {
      return undefined;
    }
    
    return this.updateUserLastLogin(user.id);
  }

  // Session management
  async createUserSession(data: InsertUserSession): Promise<UserSession> {
    const session: UserSession = {
      ...data,
      id: Date.now(),
      createdAt: new Date()
    };
    
    this.sessions.set(data.token, session);
    return session;
  }

  async getUserSessionByToken(token: string): Promise<UserSession | undefined> {
    return this.sessions.get(token);
  }

  async removeUserSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  // File operations
  async createProcessedFile(file: InsertProcessedFile): Promise<ProcessedFile> {
    const id = this.currentFileId++;
    const timestamp = new Date();
    const processedFile: ProcessedFile = { 
      ...file, 
      id, 
      createdAt: timestamp,
      updatedAt: timestamp,
      isPublic: false
    } as ProcessedFile;
    this.processedFiles.set(id, processedFile);
    return processedFile;
  }

  async getProcessedFile(id: number): Promise<ProcessedFile | undefined> {
    return this.processedFiles.get(id);
  }

  async getProcessedFilesByUserId(userId: number): Promise<ProcessedFile[]> {
    return Array.from(this.processedFiles.values())
      .filter(file => file.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Text operations
  async createTextOperation(operation: InsertTextOperation): Promise<TextOperation> {
    const id = this.currentOperationId++;
    const timestamp = new Date();
    const textOperation: TextOperation = { 
      ...operation, 
      id, 
      createdAt: timestamp,
      updatedAt: timestamp,
      isStarred: false
    } as TextOperation;
    this.textOperations.set(id, textOperation);
    return textOperation;
  }

  async getTextOperation(id: number): Promise<TextOperation | undefined> {
    return this.textOperations.get(id);
  }

  async getRecentTextOperations(userId: number | null, limit: number): Promise<TextOperation[]> {
    const operations = Array.from(this.textOperations.values())
      .filter(op => userId === null || op.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return operations;
  }

  async getTextOperationsByType(userId: number | null, type: string): Promise<TextOperation[]> {
    return Array.from(this.textOperations.values())
      .filter(op => (userId === null || op.userId === userId) && op.operationType === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTextOperationsByUser(userId: number, limit: number): Promise<TextOperation[]> {
    return this.getRecentTextOperations(userId, limit);
  }

  async starTextOperation(id: number, isStarred: boolean): Promise<void> {
    const operation = this.textOperations.get(id);
    if (operation) {
      operation.isStarred = isStarred;
      operation.updatedAt = new Date();
      this.textOperations.set(id, operation);
    }
  }
}

// Use the database storage
export const storage = new DatabaseStorage();
