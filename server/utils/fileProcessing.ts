import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { FileProcessingRequest } from '@shared/schema';

const execAsync = promisify(exec);

// Creates a temporary file and returns its path
async function createTempFile(fileBuffer: Buffer, extension: string): Promise<string> {
  const tempDir = os.tmpdir();
  const fileName = `upload_${Date.now()}${extension}`;
  const filePath = path.join(tempDir, fileName);
  
  await fs.writeFile(filePath, fileBuffer);
  return filePath;
}

// Extract text from JPG using Tesseract OCR
export async function extractTextFromImage(fileBuffer: Buffer): Promise<string> {
  try {
    const filePath = await createTempFile(fileBuffer, '.jpg');
    
    try {
      // Execute tesseract OCR
      const { stdout } = await execAsync(`tesseract ${filePath} stdout -l eng`);
      return stdout.trim();
    } finally {
      // Clean up temporary file
      await fs.unlink(filePath).catch(() => {});
    }
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
}

// Extract text from PDF
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  try {
    const filePath = await createTempFile(fileBuffer, '.pdf');
    
    try {
      // Use pdf-parse via command line (Node.js wrapper)
      const scriptPath = path.join(import.meta.dirname, '../scripts/pdf-extract.js');
      const { stdout } = await execAsync(`node ${scriptPath} ${filePath}`);
      return stdout.trim();
    } finally {
      // Clean up temporary file
      await fs.unlink(filePath).catch(() => {});
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Process file based on type and optional operations
export async function processFile(
  fileBuffer: Buffer, 
  fileType: string, 
  fileName: string,
  options?: FileProcessingRequest
): Promise<{ extractedText: string, fileName: string, fileType: string, processedText?: string }> {
  let extractedText = '';
  let processedText: string | undefined = undefined;
  
  // Extract text based on file type
  if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
    extractedText = await extractTextFromPDF(fileBuffer);
    fileType = 'pdf';
  } else if (
    fileType === 'image/jpeg' || 
    fileType === 'image/jpg' || 
    fileName.toLowerCase().endsWith('.jpg') || 
    fileName.toLowerCase().endsWith('.jpeg')
  ) {
    extractedText = await extractTextFromImage(fileBuffer);
    fileType = 'jpg';
  } else {
    throw new Error('Unsupported file type. Only PDF and JPG files are supported.');
  }
  
  // Handle additional processing operations if requested
  if (options && extractedText) {
    if (options.operation === 'summarization' && options.summaryLength) {
      // Process summarization request internally without making API call
      // This will be handled at the routes level
    }
    else if (options.operation === 'translation' && options.targetLanguage) {
      // Process translation request internally without making API call
      // This will be handled at the routes level
    }
  }
  
  return {
    extractedText,
    fileName,
    fileType,
    processedText
  };
}
