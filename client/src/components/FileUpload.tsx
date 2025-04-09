import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import useFileUpload from '@/hooks/useFileUpload';
import { FileUploadProps } from '@/types';

export default function FileUpload({ onFileProcessed }: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processOption, setProcessOption] = useState<string>('none');
  const [showOptions, setShowOptions] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('short');
  
  const {
    isLoading,
    error,
    progress,
    uploadedFile,
    handleFileUpload,
    reset
  } = useFileUpload();
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        // Prepare processing options
        const options: any = {};
        
        if (processOption !== 'none') {
          options.operation = processOption;
          
          if (processOption === 'translation') {
            options.targetLanguage = targetLanguage;
          } else if (processOption === 'summarization') {
            options.summaryLength = summaryLength;
          }
        }
        
        await handleFileUpload(e.target.files[0], options);
      } catch (error) {
        toast({
          title: 'Upload Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };
  
  // Handle file drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      try {
        // Prepare processing options
        const options: any = {};
        
        if (processOption !== 'none') {
          options.operation = processOption;
          
          if (processOption === 'translation') {
            options.targetLanguage = targetLanguage;
          } else if (processOption === 'summarization') {
            options.summaryLength = summaryLength;
          }
        }
        
        await handleFileUpload(e.dataTransfer.files[0], options);
      } catch (error) {
        toast({
          title: 'Upload Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  // Handle drag leave
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  // Click to open file dialog
  const handleAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Pass extracted text to parent component when upload completes
  if (uploadedFile && uploadedFile.extractedText) {
    // Pass the extracted text to parent component
    onFileProcessed(uploadedFile.extractedText);
    
    // If there was a processed result (summarization or translation), show a success toast
    if (uploadedFile.processedText) {
      toast({
        title: 'File Processed Successfully',
        description: `Your file was processed with ${processOption}`,
      });
    }
    
    // If there are keywords extracted, show them with special formatting
    if (uploadedFile.keywords && uploadedFile.keywords.length > 0) {
      // Get top 5 keywords for the toast message
      const topKeywords = uploadedFile.keywords
        .slice(0, 5)
        .map(k => k.keyword)
        .join(', ');
      
      toast({
        title: 'Keywords Extracted',
        description: `Top keywords: ${topKeywords}`,
        variant: 'default',
      });
    }
    
    reset(); // Reset upload state after processing
  }
  
  return (
    <div>
      <h3 className="text-md font-medium mb-3">Upload a File</h3>
      
      {/* Processing options */}
      <div className="mb-4">
        <div 
          className="flex items-center justify-between cursor-pointer text-sm text-primary hover:underline mb-2"
          onClick={() => setShowOptions(!showOptions)}
        >
          <span>Processing Options</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 transition-transform ${showOptions ? 'transform rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {showOptions && (
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-3">
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Process after upload:</label>
              <select 
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                value={processOption}
                onChange={(e) => setProcessOption(e.target.value)}
              >
                <option value="none">None (Just Extract Text)</option>
                <option value="summarization">Summarize Paper</option>
                <option value="translation">Translate Paper</option>
                <option value="keyword_extraction">Extract Keywords</option>
              </select>
            </div>
            
            {processOption === 'translation' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target Language:</label>
                <select 
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                >
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Chinese</option>
                  <option>Russian</option>
                </select>
              </div>
            )}
            
            {processOption === 'summarization' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Summary Length:</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary" 
                      name="summaryLength" 
                      checked={summaryLength === 'short'}
                      onChange={() => setSummaryLength('short')}
                    />
                    <span className="ml-1 text-xs">Short</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary" 
                      name="summaryLength" 
                      checked={summaryLength === 'medium'}
                      onChange={() => setSummaryLength('medium')}
                    />
                    <span className="ml-1 text-xs">Medium</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-primary" 
                      name="summaryLength" 
                      checked={summaryLength === 'long'}
                      onChange={() => setSummaryLength('long')}
                    />
                    <span className="ml-1 text-xs">Long</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Drag and drop area */}
      <div 
        className={`border-2 border-dashed ${isDragOver ? 'border-primary' : 'border-gray-300'} rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer`}
        onClick={handleAreaClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isLoading ? (
          <div className="py-2">
            <div className="loader mx-auto h-8 w-8 rounded-full border-4 border-gray-200"></div>
            <p className="mt-2 text-sm text-gray-600">Processing file... {Math.round(progress)}%</p>
          </div>
        ) : error ? (
          <div className="py-2 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">Drag and drop or <span className="text-primary font-medium">browse</span></p>
            <p className="mt-1 text-xs text-gray-500">Supports PDF, JPG</p>
            {processOption !== 'none' && (
              <p className="mt-1 text-xs text-purple-600">Will {processOption.replace('_', ' ')} after upload</p>
            )}
          </>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef}
          accept=".pdf,.jpg,.jpeg" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>
      
      <div className="mt-3">
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>Max file size: 10MB</span>
          <a href="#" className="text-primary hover:underline">Help</a>
        </div>
      </div>
    </div>
  );
}
