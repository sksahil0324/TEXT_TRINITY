import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { summarizeText } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { SummarizationRequest, SummarizationResponse } from '@shared/schema';

interface TextSummarizationProps {
  showProcessing: (title: string, message?: string) => void;
  hideProcessing: () => void;
  initialText?: string;
}

export default function TextSummarization({ showProcessing, hideProcessing, initialText = '' }: TextSummarizationProps) {
  const { toast } = useToast();
  const [inputText, setInputText] = useState(initialText);
  const [summary, setSummary] = useState('');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('short');
  const [style, setStyle] = useState<'informative' | 'bullet_points' | 'simplified'>('informative');

  // Update input text when initialText changes
  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  // Summarization mutation
  const summarizationMutation = useMutation({
    mutationFn: (request: SummarizationRequest) => summarizeText(request),
    onMutate: () => {
      showProcessing('Summarizing', 'Creating a concise summary of your text...');
    },
    onSuccess: (data: SummarizationResponse) => {
      setSummary(data.summary);
      hideProcessing();
      toast({
        title: 'Summarization Complete',
        description: 'Your text has been summarized successfully',
      });
    },
    onError: (error: Error) => {
      hideProcessing();
      toast({
        title: 'Summarization Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle summarization
  const handleSummarize = () => {
    if (!inputText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter text to summarize',
        variant: 'destructive',
      });
      return;
    }

    summarizationMutation.mutate({
      text: inputText,
      length: summaryLength,
      style
    });
  };

  // Copy summary to clipboard
  const copySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      toast({
        title: 'Copied',
        description: 'Summary copied to clipboard',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Text Summarization</h2>
      
      <div className="space-y-4">
        {/* Input text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Input Text</label>
          <textarea 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-48" 
            placeholder="Enter or paste text to summarize..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary Length</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  className="form-radio text-primary" 
                  name="summaryLength" 
                  checked={summaryLength === 'short'}
                  onChange={() => setSummaryLength('short')}
                />
                <span className="ml-2 text-sm">Short</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  className="form-radio text-primary" 
                  name="summaryLength" 
                  checked={summaryLength === 'medium'}
                  onChange={() => setSummaryLength('medium')}
                />
                <span className="ml-2 text-sm">Medium</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  className="form-radio text-primary" 
                  name="summaryLength" 
                  checked={summaryLength === 'long'}
                  onChange={() => setSummaryLength('long')}
                />
                <span className="ml-2 text-sm">Long</span>
              </label>
            </div>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={style}
              onChange={(e) => setStyle(e.target.value as 'informative' | 'bullet_points' | 'simplified')}
            >
              <option value="informative">Informative</option>
              <option value="bullet_points">Bullet Points</option>
              <option value="simplified">Simplified</option>
            </select>
          </div>
          
          <div className="self-end">
            <button 
              type="button" 
              className="bg-primary text-white px-5 py-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleSummarize}
              disabled={summarizationMutation.isPending || !inputText.trim()}
            >
              Summarize
            </button>
          </div>
        </div>
        
        {/* Summary output */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
            <span>Summary</span>
            <button 
              className="text-xs text-primary hover:underline"
              onClick={copySummary}
              disabled={!summary}
            >
              Copy
            </button>
          </label>
          <div className="bg-gray-50 border border-gray-300 rounded-md p-4 h-36 overflow-y-auto">
            {summary || 'Summary will appear here...'}
          </div>
        </div>
      </div>
    </div>
  );
}
