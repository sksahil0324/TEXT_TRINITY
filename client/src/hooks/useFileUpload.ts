import { useState, useCallback } from 'react';
import { uploadFile } from '@/lib/api';

interface FileUploadHookResult {
  isLoading: boolean;
  error: string | null;
  progress: number;
  uploadedFile: {
    fileName: string;
    fileType: string;
    extractedText: string;
    fileId: number;
    processedText?: string;
    operation?: string;
    keywords?: Array<{keyword: string; score: number}>;
  } | null;
  handleFileUpload: (file: File, options?: any) => Promise<void>;
  reset: () => void;
}

export default function useFileUpload(): FileUploadHookResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    fileType: string;
    extractedText: string;
    fileId: number;
    processedText?: string;
    operation?: string;
    keywords?: Array<{keyword: string; score: number}>;
  } | null>(null);

  const handleFileUpload = useCallback(async (file: File, options?: any) => {
    // Reset state
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type) && 
        !file.name.toLowerCase().endsWith('.pdf') && 
        !file.name.toLowerCase().endsWith('.jpg') && 
        !file.name.toLowerCase().endsWith('.jpeg')) {
      setError('Unsupported file type. Only PDF and JPG files are supported.');
      setIsLoading(false);
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the limit (10MB).');
      setIsLoading(false);
      return;
    }
    
    try {
      // Upload the file
      setProgress(10); // Start progress
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          // Increase progress gradually up to 90%
          const newProgress = prev + Math.random() * 10;
          return newProgress < 90 ? newProgress : 90;
        });
      }, 500);
      
      // Perform the actual upload
      const result = await uploadFile(file, options);
      
      // Upload complete
      clearInterval(progressInterval);
      setProgress(100);
      
      // Set the result with all returned properties
      setUploadedFile({
        fileName: result.fileName,
        fileType: result.fileType,
        extractedText: result.extractedText,
        fileId: result.fileId,
        processedText: result.processedText,
        operation: result.operation,
        keywords: result.keywords
      });
      
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setProgress(0);
    setUploadedFile(null);
  }, []);

  return {
    isLoading,
    error,
    progress,
    uploadedFile,
    handleFileUpload,
    reset
  };
}
