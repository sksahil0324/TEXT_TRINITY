import { apiRequest } from '@/lib/queryClient';
import {
  TranslationRequest,
  TranslationResponse,
  SummarizationRequest,
  SummarizationResponse,
  ContentGenerationRequest,
  ContentGenerationResponse,
  KeywordExtractionRequest,
  KeywordExtractionResponse
} from '@shared/schema';

// API for text translation
export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  const response = await apiRequest('POST', '/api/translate', request);
  return response.json();
}

// API for text summarization
export async function summarizeText(request: SummarizationRequest): Promise<SummarizationResponse> {
  const response = await apiRequest('POST', '/api/summarize', request);
  return response.json();
}

// API for content generation
export async function generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
  const response = await apiRequest('POST', '/api/generate', request);
  return response.json();
}

// API for keyword extraction
export async function extractKeywords(request: KeywordExtractionRequest): Promise<KeywordExtractionResponse> {
  const response = await apiRequest('POST', '/api/extract-keywords', request);
  return response.json();
}

// API for file upload and processing
export async function uploadFile(file: File, options?: any): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options) {
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });
  }
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'File upload failed');
  }
  
  return response.json();
}

// API for fetching recent activity
export async function getRecentActivity(limit = 5): Promise<any[]> {
  const response = await fetch(`/api/recent-activity?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch recent activity');
  }
  
  return response.json();
}
