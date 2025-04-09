import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import {
  translateText,
  summarizeText,
  generateContent,
  extractKeywords,
  recommendAlgorithm
} from "./nlp";
import { processFile } from "./utils/fileProcessing";
import {
  TranslationRequest,
  SummarizationRequest,
  ContentGenerationRequest,
  KeywordExtractionRequest,
  FileProcessingRequest,
  AlgorithmRecommendationRequest
} from "@shared/schema";
import { z } from "zod";

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Translation endpoint
  app.post("/api/translate", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        text: z.string().min(1, "Text is required"),
        sourceLanguage: z.string(),
        targetLanguage: z.string(),
        formality: z.string().optional(),
        domain: z.string().optional()
      });

      const validatedData = schema.parse(req.body);
      const result = await translateText(validatedData as TranslationRequest);

      // Save operation to history
      await storage.createTextOperation({
        operationType: "translation",
        inputText: validatedData.text,
        outputText: result.translatedText,
        metadata: JSON.stringify({
          sourceLanguage: validatedData.sourceLanguage,
          targetLanguage: validatedData.targetLanguage,
          characterCount: result.characterCount
        }),
        userId: null,
        fileId: null
      });

      res.json(result);
    } catch (error) {
      console.error("Translation error:", error);
      res.status(400).json({ message: error.message || "Translation failed" });
    }
  });

  // Summarization endpoint
  app.post("/api/summarize", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        text: z.string().min(1, "Text is required"),
        length: z.enum(["short", "medium", "long"]),
        style: z.enum(["informative", "bullet_points", "simplified"]).optional()
      });

      const validatedData = schema.parse(req.body);
      const result = await summarizeText(validatedData as SummarizationRequest);

      // Save operation to history
      await storage.createTextOperation({
        operationType: "summarization",
        inputText: validatedData.text,
        outputText: result.summary,
        metadata: JSON.stringify({
          length: validatedData.length,
          style: validatedData.style
        }),
        userId: null,
        fileId: null
      });

      res.json(result);
    } catch (error) {
      console.error("Summarization error:", error);
      res.status(400).json({ message: error.message || "Summarization failed" });
    }
  });

  // Content Generation endpoint
  app.post("/api/generate", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        prompt: z.string().min(1, "Prompt is required"),
        contentType: z.string(),
        tone: z.string(),
        length: z.string(),
        creativityLevel: z.number().min(0).max(100)
      });

      const validatedData = schema.parse(req.body);
      const result = await generateContent(validatedData as ContentGenerationRequest);

      // Save operation to history
      await storage.createTextOperation({
        operationType: "generation",
        inputText: validatedData.prompt,
        outputText: result.generatedContent,
        metadata: JSON.stringify({
          contentType: validatedData.contentType,
          tone: validatedData.tone,
          length: validatedData.length,
          creativityLevel: validatedData.creativityLevel
        }),
        userId: null,
        fileId: null
      });

      res.json(result);
    } catch (error) {
      console.error("Content generation error:", error);
      res.status(400).json({ message: error.message || "Content generation failed" });
    }
  });

  // Keyword Extraction endpoint
  app.post("/api/extract-keywords", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        text: z.string().min(1, "Text is required"),
        count: z.number().int().positive(),
        method: z.enum(["enhanced_tfidf", "bert_based", "standard_tfidf"])
      });

      const validatedData = schema.parse(req.body);
      const result = await extractKeywords(validatedData as KeywordExtractionRequest);

      // Save operation to history
      await storage.createTextOperation({
        operationType: "keyword_extraction",
        inputText: validatedData.text,
        outputText: JSON.stringify(result.keywords),
        metadata: JSON.stringify({
          method: validatedData.method,
          count: validatedData.count
        }),
        userId: null,
        fileId: null
      });

      res.json(result);
    } catch (error) {
      console.error("Keyword extraction error:", error);
      res.status(400).json({ message: error.message || "Keyword extraction failed" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const options: FileProcessingRequest = req.body as FileProcessingRequest;
      
      // Check file size
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size exceeds limit (10MB)" });
      }

      // Process the file to extract text
      const { extractedText, fileName, fileType, processedText } = await processFile(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        options
      );

      // Save the processed file record
      const processedFile = await storage.createProcessedFile({
        originalFilename: fileName,
        fileType,
        extractedText,
        userId: null
      });

      // Create operation record
      await storage.createTextOperation({
        operationType: "file_processing",
        inputText: fileName,
        outputText: extractedText,
        metadata: JSON.stringify({
          fileType,
          fileSize: req.file.size,
          operation: options?.operation || null
        }),
        userId: null,
        fileId: processedFile.id
      });

      // Handle additional processing based on options
      let responseData: any = {
        extractedText,
        fileId: processedFile.id,
        fileName,
        fileType
      };

      // If operation is specified, process accordingly
      if (options?.operation) {
        try {
          if (options.operation === 'summarization' && options.summaryLength) {
            // Process summarization
            const summaryResult = await summarizeText({
              text: extractedText,
              length: options.summaryLength,
              style: 'informative'
            });
            
            // Save the summarization operation
            await storage.createTextOperation({
              operationType: "summarization",
              inputText: extractedText,
              outputText: summaryResult.summary,
              metadata: JSON.stringify({
                length: options.summaryLength,
                fromFile: true,
                fileName
              }),
              userId: null,
              fileId: processedFile.id
            });
            
            responseData.processedText = summaryResult.summary;
            responseData.operation = 'summarization';
          } 
          else if (options.operation === 'translation' && options.targetLanguage) {
            // Process translation
            const translationResult = await translateText({
              text: extractedText,
              sourceLanguage: 'English', // Assuming source is English
              targetLanguage: options.targetLanguage
            });
            
            // Save the translation operation
            await storage.createTextOperation({
              operationType: "translation",
              inputText: extractedText,
              outputText: translationResult.translatedText,
              metadata: JSON.stringify({
                sourceLanguage: 'English',
                targetLanguage: options.targetLanguage,
                fromFile: true,
                fileName
              }),
              userId: null,
              fileId: processedFile.id
            });
            
            responseData.processedText = translationResult.translatedText;
            responseData.operation = 'translation';
          }
          else if (options.operation === 'keyword_extraction') {
            // Extract keywords
            const keywordResult = await extractKeywords({
              text: extractedText,
              count: 15, // Extract 15 keywords by default
              method: 'enhanced_tfidf'
            });
            
            // Save the keyword extraction operation
            await storage.createTextOperation({
              operationType: "keyword_extraction",
              inputText: extractedText,
              outputText: JSON.stringify(keywordResult.keywords),
              metadata: JSON.stringify({
                method: 'enhanced_tfidf',
                fromFile: true,
                fileName
              }),
              userId: null,
              fileId: processedFile.id
            });
            
            responseData.keywords = keywordResult.keywords;
            responseData.operation = 'keyword_extraction';
          }
        } catch (processingError) {
          console.error(`Error in ${options.operation} processing:`, processingError);
          // Don't fail the whole request, just note the error
          responseData.processingError = processingError.message;
        }
      }

      res.json(responseData);
    } catch (error) {
      console.error("File processing error:", error);
      res.status(400).json({ message: error.message || "File processing failed" });
    }
  });

  // Algorithm Recommendation endpoint
  app.post("/api/recommend-algorithm", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        taskType: z.enum(['summarization', 'translation', 'content_generation', 'keyword_extraction']),
        textLength: z.number().int().positive(),
        contentDomain: z.string().optional(),
        languageComplexity: z.enum(['simple', 'moderate', 'complex']).optional(),
        priorityFactor: z.enum(['speed', 'quality', 'balanced']),
        specialRequirements: z.array(z.string()).optional()
      });

      const validatedData = schema.parse(req.body);
      const result = await recommendAlgorithm(validatedData as AlgorithmRecommendationRequest);

      // Save operation to history
      await storage.createTextOperation({
        operationType: "algorithm_recommendation",
        inputText: JSON.stringify({
          taskType: validatedData.taskType,
          textLength: validatedData.textLength,
          priorityFactor: validatedData.priorityFactor
        }),
        outputText: result.recommendedAlgorithm,
        metadata: JSON.stringify({
          confidence: result.confidence,
          explanation: result.explanation,
          suggestedParameters: result.suggestedParameters
        }),
        userId: null,
        fileId: null
      });

      res.json(result);
    } catch (error) {
      console.error("Algorithm recommendation error:", error);
      res.status(400).json({ message: error.message || "Algorithm recommendation failed" });
    }
  });

  // Get recent activity
  app.get("/api/recent-activity", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const operations = await storage.getRecentTextOperations(null, limit);
      
      // Format the operations for display
      const activities = operations.map(op => {
        const type = op.operationType;
        const timestamp = op.createdAt || new Date(); // Fallback to current date if null
        const timeAgo = getTimeAgo(timestamp);
        
        let description = '';
        let metadata: Record<string, any> = {};
        
        // Safely parse metadata JSON
        try {
          if (op.metadata && typeof op.metadata === 'string') {
            metadata = JSON.parse(op.metadata);
          } else if (op.metadata && typeof op.metadata === 'object') {
            metadata = op.metadata as Record<string, any>;
          }
        } catch (parseError) {
          console.error('Error parsing metadata:', parseError);
          metadata = {};
        }
        
        switch (type) {
          case 'translation':
            description = `Translation${metadata && 'sourceLanguage' in metadata && 'targetLanguage' in metadata ? 
              ` - ${metadata.sourceLanguage} to ${metadata.targetLanguage}` : ''}`;
            break;
          case 'summarization':
            description = 'Summary of text';
            break;
          case 'generation':
            description = `Generated${metadata && 'contentType' in metadata ? 
              ` ${metadata.contentType}` : ' content'}`;
            break;
          case 'keyword_extraction':
            description = 'Keyword extraction';
            break;
          case 'file_processing':
            description = `Processed${metadata && 'fileType' in metadata ? 
              ` ${String(metadata.fileType).toUpperCase()} file` : ' file'}`;
            break;
          case 'algorithm_recommendation':
            try {
              let inputData = JSON.parse(op.inputText);
              description = `Algorithm recommendation for ${inputData.taskType}`;
            } catch {
              description = 'Algorithm recommendation';
            }
            break;
          default:
            description = type;
        }
        
        return {
          id: op.id,
          description,
          timeAgo
        };
      });
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to format time ago
function getTimeAgo(date: Date | null): string {
  if (!date) {
    return 'unknown time';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}
