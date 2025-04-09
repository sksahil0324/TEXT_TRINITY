import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { translateText } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { TranslationRequest, TranslationResponse } from '@shared/schema';

interface TextTranslationProps {
  showProcessing: (title: string, message?: string) => void;
  hideProcessing: () => void;
  initialText?: string;
}

export default function TextTranslation({ showProcessing, hideProcessing, initialText = '' }: TextTranslationProps) {
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [formality, setFormality] = useState('Neutral');
  const [domain, setDomain] = useState('General');
  const [characterCount, setCharacterCount] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update character count when source text changes
  useEffect(() => {
    setCharacterCount(sourceText.length);
  }, [sourceText]);

  // Update source text when initialText changes
  useEffect(() => {
    if (initialText) {
      setSourceText(initialText);
    }
  }, [initialText]);

  // Translation mutation
  const translationMutation = useMutation({
    mutationFn: (request: TranslationRequest) => translateText(request),
    onMutate: () => {
      showProcessing('Translating', 'This may take a few moments depending on text length...');
    },
    onSuccess: (data: TranslationResponse) => {
      setTranslatedText(data.translatedText);
      hideProcessing();
      toast({
        title: 'Translation Complete',
        description: `Successfully translated ${characterCount} characters`,
      });
    },
    onError: (error: Error) => {
      hideProcessing();
      toast({
        title: 'Translation Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle translation
  const handleTranslate = () => {
    if (!sourceText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter text to translate',
        variant: 'destructive',
      });
      return;
    }

    translationMutation.mutate({
      text: sourceText,
      sourceLanguage,
      targetLanguage,
      formality,
      domain
    });
  };

  // Swap languages
  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    // Also swap the text if there's translated content
    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };

  // Copy translation to clipboard
  const copyTranslation = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      toast({
        title: 'Copied',
        description: 'Translation copied to clipboard',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Text Translation</h2>
      
      <div className="space-y-4">
        {/* Language selection */}
        <div className="flex flex-wrap gap-3 md:gap-4 mb-2">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Language</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Chinese</option>
              <option>Russian</option>
            </select>
          </div>
          
          <div className="flex items-end mb-1">
            <button 
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
              onClick={swapLanguages}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Language</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              <option>Spanish</option>
              <option>English</option>
              <option>French</option>
              <option>German</option>
              <option>Chinese</option>
              <option>Russian</option>
            </select>
          </div>
        </div>
        
        {/* Text input and output */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Text</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-48" 
              placeholder="Enter text to translate..." 
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
              <span>Translation</span>
              <button 
                className="text-xs text-primary hover:underline"
                onClick={copyTranslation}
                disabled={!translatedText}
              >
                Copy
              </button>
            </label>
            <div className="relative">
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-48 bg-gray-50" 
                placeholder="Translation will appear here..." 
                readOnly
                value={translatedText}
              />
            </div>
          </div>
        </div>
        
        {/* Character count and translate button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Character count: {characterCount}
          </div>
          <button 
            type="button" 
            className="bg-primary text-white px-5 py-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={handleTranslate}
            disabled={translationMutation.isPending || !sourceText.trim()}
          >
            Translate
          </button>
        </div>
        
        {/* Advanced options */}
        <div className="border-t mt-4 pt-3">
          <details className="text-sm" open={showAdvanced}>
            <summary 
              className="text-primary cursor-pointer"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              Advanced Options
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formality</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={formality}
                  onChange={(e) => setFormality(e.target.value)}
                >
                  <option>Neutral</option>
                  <option>Formal</option>
                  <option>Informal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  <option>General</option>
                  <option>Technical</option>
                  <option>Medical</option>
                  <option>Legal</option>
                  <option>Business</option>
                </select>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
