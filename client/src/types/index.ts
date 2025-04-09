// Activity types
export interface ActivityItem {
  id: number;
  description: string;
  timeAgo: string;
}

// File upload types
export interface FileUploadProps {
  onFileProcessed: (extractedText: string) => void;
}

// Tab types
export type TabType = 'translation' | 'generation' | 'summarization' | 'enhanced_summarization' | 'keywords' | 'algorithm_recommendation';
