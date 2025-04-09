import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { extractKeywords } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { KeywordExtractionRequest, KeywordExtractionResponse } from '@shared/schema';

interface KeywordExtractionProps {
  showProcessing: (title: string, message?: string) => void;
  hideProcessing: () => void;
  initialText?: string;
}

export default function KeywordExtraction({ showProcessing, hideProcessing, initialText = '' }: KeywordExtractionProps) {
  const { toast } = useToast();
  const [inputText, setInputText] = useState(initialText);
  const [keywordCount, setKeywordCount] = useState(10);
  const [method, setMethod] = useState<'enhanced_tfidf' | 'bert_based' | 'standard_tfidf'>('enhanced_tfidf');
  const [keywords, setKeywords] = useState<Array<{ keyword: string; score: number }>>([]);
  const [viewMode, setViewMode] = useState<'cloud' | 'list'>('cloud');

  // Update input text when initialText changes
  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  // Keyword extraction mutation
  const keywordMutation = useMutation({
    mutationFn: (request: KeywordExtractionRequest) => extractKeywords(request),
    onMutate: () => {
      showProcessing('Extracting Keywords', 'Analyzing text for key concepts and terms...');
    },
    onSuccess: (data: KeywordExtractionResponse) => {
      setKeywords(data.keywords);
      hideProcessing();
      toast({
        title: 'Keyword Extraction Complete',
        description: `Extracted ${data.keywords.length} keywords`,
      });
    },
    onError: (error: Error) => {
      hideProcessing();
      toast({
        title: 'Extraction Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle keyword extraction
  const handleExtractKeywords = () => {
    if (!inputText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter text for keyword extraction',
        variant: 'destructive',
      });
      return;
    }

    keywordMutation.mutate({
      text: inputText,
      count: keywordCount,
      method
    });
  };

  // Export keywords as CSV with enhanced information
  const exportKeywords = () => {
    if (!keywords.length) return;
    
    // Get current date/time for the filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    // Create enhanced CSV with more metadata
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + `# Keywords extracted using ${method.replace('_', ' ')} algorithm\n`
      + `# Date: ${now.toLocaleDateString()}\n`
      + `# Time: ${now.toLocaleTimeString()}\n`
      + `# Total keywords: ${keywords.length}\n`
      + `# Text length: ${inputText.length} characters\n`
      + '#\n'
      + 'Keyword,Score,Type,Relevance\n'
      + keywords.map(k => {
          const type = isMultiWordKeyword(k.keyword) ? 'Phrase' : 'Term';
          const relevance = k.score > 0.7 ? 'Very High' : 
                           k.score > 0.5 ? 'High' : 
                           k.score > 0.3 ? 'Medium' : 'Low';
          return `"${k.keyword}",${k.score.toFixed(4)},"${type}","${relevance}"`;
        }).join('\n');
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `keywords_${dateStr}_${timeStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Notify user
    toast({
      title: 'Export Complete',
      description: `${keywords.length} keywords exported with metadata`,
    });
  };

  // Determine font size for word cloud based on score with enhanced visualization
  const getFontSize = (score: number) => {
    if (score > 0.85) return 'text-3xl font-bold';
    if (score > 0.7) return 'text-2xl font-semibold';
    if (score > 0.5) return 'text-xl font-medium';
    if (score > 0.3) return 'text-lg';
    if (score > 0.15) return 'text-base';
    return 'text-sm';
  };

  // Determine color for word cloud based on score with enhanced color scheme
  const getColor = (score: number) => {
    // Use a more vibrant gradient of colors
    if (score > 0.85) return 'text-indigo-700';
    if (score > 0.7) return 'text-indigo-600';
    if (score > 0.5) return 'text-indigo-500';
    if (score > 0.3) return 'text-indigo-400';
    if (score > 0.15) return 'text-indigo-300';
    return 'text-gray-500';
  };
  
  // Determine if a keyword should be highlighted as multi-word phrase
  const isMultiWordKeyword = (keyword: string) => {
    return keyword.includes(' ');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Keyword Extraction</h2>
      
      <div className="space-y-4">
        {/* Input text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Input Text</label>
          <textarea 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-36" 
            placeholder="Enter or paste text for keyword extraction..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Keywords</label>
            <input 
              type="number" 
              min="5" 
              max="50" 
              value={keywordCount}
              onChange={(e) => setKeywordCount(Math.min(50, Math.max(5, Number(e.target.value))))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Extraction Method</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={method}
              onChange={(e) => setMethod(e.target.value as 'enhanced_tfidf' | 'bert_based' | 'standard_tfidf')}
            >
              <option value="enhanced_tfidf">Enhanced TF-IDF</option>
              <option value="bert_based">BERT-based</option>
              <option value="standard_tfidf">Standard TF-IDF</option>
            </select>
          </div>
          
          <div>
            <button 
              type="button" 
              className="bg-primary text-white px-5 py-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleExtractKeywords}
              disabled={keywordMutation.isPending || !inputText.trim()}
            >
              Extract Keywords
            </button>
          </div>
        </div>
        
        {/* Keywords display */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium">Extracted Keywords</h3>
            <div className="flex space-x-2">
              <button 
                className={`text-xs ${viewMode === 'cloud' ? 'text-primary border border-primary rounded-md' : 'text-gray-600'} hover:text-primary hover:underline px-2 py-1`}
                onClick={() => setViewMode('cloud')}
              >
                Cloud View
              </button>
              <button 
                className={`text-xs ${viewMode === 'list' ? 'text-primary border border-primary rounded-md' : 'text-gray-600'} hover:text-primary hover:underline px-2 py-1`}
                onClick={() => setViewMode('list')}
              >
                List View
              </button>
            </div>
          </div>
          
          {/* Word Cloud View */}
          {viewMode === 'cloud' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[200px] word-cloud text-center">
              {keywords.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2 p-4">
                  {keywords.map((keyword, index) => (
                    <span 
                      key={index} 
                      className={`
                        ${getFontSize(keyword.score)} 
                        ${getColor(keyword.score)} 
                        ${isMultiWordKeyword(keyword.keyword) ? 'border-b-2 border-indigo-400' : ''}
                        inline-block m-1 p-2 hover:bg-indigo-50 rounded-lg cursor-pointer
                        transition-all duration-200 transform hover:scale-110
                      `}
                      title={`Score: ${(keyword.score * 100).toFixed(1)}%`}
                    >
                      {keyword.keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 h-full flex items-center justify-center">
                  Keywords will appear here...
                </div>
              )}
            </div>
          )}
          
          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[200px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relevance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keywords.length > 0 ? (
                    keywords.map((keyword, index) => (
                      <tr key={index} className={`${index < 5 ? 'bg-indigo-50' : ''}`}>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <span className={`${index < 3 ? 'font-semibold' : ''}`}>
                            {keyword.keyword}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full" 
                                style={{ width: `${keyword.score * 100}%` }}
                              ></div>
                            </div>
                            <span>{(keyword.score * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {isMultiWordKeyword(keyword.keyword) ? (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md">Phrase</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md">Term</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {keyword.score > 0.7 ? 'Very High' : 
                           keyword.score > 0.5 ? 'High' : 
                           keyword.score > 0.3 ? 'Medium' : 'Low'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-sm text-gray-500 text-center">
                        No keywords extracted yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span>
              {keywords.length > 0 
                ? `Keywords extracted using ${method.replace('_', ' ').toUpperCase()}`
                : 'Extract keywords to see results'}
            </span>
            <button 
              className={`text-primary hover:underline ${!keywords.length ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={exportKeywords}
              disabled={!keywords.length}
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
