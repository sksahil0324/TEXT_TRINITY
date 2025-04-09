import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enum for user roles
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// Define users table with enhanced fields for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  role: userRoleEnum("role").notNull().default('user'),
  profilePicture: text("profile_picture"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define user preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  defaultLanguage: text("default_language").default('English'),
  theme: text("theme").default('light'),
  emailNotifications: boolean("email_notifications").default(true),
  aiModelPreference: text("ai_model_preference").default('enhanced_tfidf'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced processed files table
export const processedFiles = pgTable("processed_files", {
  id: serial("id").primaryKey(),
  originalFilename: text("original_filename").notNull(),
  fileType: text("file_type").notNull(), // pdf or jpg
  extractedText: text("extracted_text"),
  fileSize: integer("file_size"),
  processingTime: integer("processing_time"),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  isPublic: boolean("is_public").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced text operations table
export const textOperations = pgTable("text_operations", {
  id: serial("id").primaryKey(),
  operationType: text("operation_type").notNull(), // translation, summary, generation, keywords
  inputText: text("input_text").notNull(),
  outputText: text("output_text"),
  metadata: json("metadata"), // JSON object with operation-specific details
  processingTime: integer("processing_time"),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  fileId: integer("file_id").references(() => processedFiles.id, { onDelete: 'set null' }),
  isStarred: boolean("is_starred").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define user session table for login tracking
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define saved content table for users to save their favorite outputs
export const savedContent = pgTable("saved_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  operationId: integer("operation_id").references(() => textOperations.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define table relations
export const usersRelations = relations(users, ({ many }) => ({
  preferences: many(userPreferences),
  files: many(processedFiles),
  operations: many(textOperations),
  sessions: many(userSessions),
  savedContent: many(savedContent),
}));

export const processedFilesRelations = relations(processedFiles, ({ one, many }) => ({
  user: one(users, {
    fields: [processedFiles.userId],
    references: [users.id]
  }),
  operations: many(textOperations),
}));

export const textOperationsRelations = relations(textOperations, ({ one, many }) => ({
  user: one(users, {
    fields: [textOperations.userId],
    references: [users.id]
  }),
  file: one(processedFiles, {
    fields: [textOperations.fileId],
    references: [processedFiles.id]
  }),
  savedContents: many(savedContent),
}));

// Enhanced insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    lastLogin: true,
  });

// Define login schema
export const loginUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Define registration schema
export const registerUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().optional(),
});

export const insertProcessedFileSchema = createInsertSchema(processedFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tags: true,
});

export const insertTextOperationSchema = createInsertSchema(textOperations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferenceSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
});

// Enhanced types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProcessedFile = z.infer<typeof insertProcessedFileSchema>;
export type ProcessedFile = typeof processedFiles.$inferSelect;

export type InsertTextOperation = z.infer<typeof insertTextOperationSchema>;
export type TextOperation = typeof textOperations.$inferSelect;

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

// API request/response types
export type TranslationRequest = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  formality?: string;
  domain?: string;
};

export type TranslationResponse = {
  translatedText: string;
  characterCount: number;
};

export type SummarizationRequest = {
  text: string;
  length: 'short' | 'medium' | 'long';
  style?: 'informative' | 'bullet_points' | 'simplified';
};

export type SummarizationResponse = {
  summary: string;
};

export type ContentGenerationRequest = {
  prompt: string;
  contentType: string;
  tone: string;
  length: string;
  creativityLevel: number;
};

export type ContentGenerationResponse = {
  generatedContent: string;
};

export type KeywordExtractionRequest = {
  text: string;
  count: number;
  method: 'enhanced_tfidf' | 'bert_based' | 'standard_tfidf';
};

export type KeywordExtractionResponse = {
  keywords: Array<{
    keyword: string;
    score: number;
  }>;
  method: string;
};

export type FileProcessingRequest = {
  fileType: 'pdf' | 'jpg';
  operation?: 'translation' | 'summarization' | 'keyword_extraction';
  targetLanguage?: string;
  summaryLength?: 'short' | 'medium' | 'long';
  keywordCount?: number;
  keywordMethod?: 'enhanced_tfidf' | 'bert_based' | 'standard_tfidf';
};

export type FileProcessingResponse = {
  extractedText: string;
  processedText?: string;
  operation?: string;
  keywords?: Array<{keyword: string; score: number}>;
};

export type AlgorithmRecommendationRequest = {
  taskType: 'summarization' | 'translation' | 'content_generation' | 'keyword_extraction';
  textLength: number;
  contentDomain?: string;
  languageComplexity?: 'simple' | 'moderate' | 'complex';
  priorityFactor: 'speed' | 'quality' | 'balanced';
  specialRequirements?: string[];
};

export type AlgorithmRecommendationResponse = {
  recommendedAlgorithm: string;
  confidence: number;
  alternativeAlgorithms: Array<{
    name: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  suggestedParameters: Record<string, any>;
  explanation: string;
};
