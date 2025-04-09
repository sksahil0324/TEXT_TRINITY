import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateContent } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ContentGenerationRequest, ContentGenerationResponse } from '@shared/schema';

interface ContentGenerationProps {
  showProcessing: (title: string, message?: string) => void;
  hideProcessing: () => void;
}

export default function ContentGeneration({ showProcessing, hideProcessing }: ContentGenerationProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('Blog Post');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Short (100-200 words)');
  const [creativityLevel, setCreativityLevel] = useState(50);
  const [generatedContent, setGeneratedContent] = useState('');

  // Content generation mutation
  const generationMutation = useMutation({
    mutationFn: (request: ContentGenerationRequest) => generateContent(request),
    onMutate: () => {
      showProcessing('Generating Content', 'Creating your content with AI...');
    },
    onSuccess: (data: ContentGenerationResponse) => {
      setGeneratedContent(data.generatedContent);
      hideProcessing();
      toast({
        title: 'Content Generated',
        description: 'Your content has been generated successfully',
      });
    },
    onError: (error: Error) => {
      hideProcessing();
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle content generation
  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive',
      });
      return;
    }

    generationMutation.mutate({
      prompt,
      contentType,
      tone,
      length,
      creativityLevel
    });
  };

  // Copy generated content to clipboard
  const copyGenerated = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast({
        title: 'Copied',
        description: 'Generated content copied to clipboard',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Content Generation</h2>
      
      <div className="space-y-4">
        {/* Prompt input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic or Prompt</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
            placeholder="Enter a topic or prompt..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        
        {/* Content type and tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option>Blog Post</option>
              <option>Product Description</option>
              <option>Email</option>
              <option>Social Media Post</option>
              <option>Technical Documentation</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option>Professional</option>
              <option>Casual</option>
              <option>Enthusiastic</option>
              <option>Formal</option>
              <option>Technical</option>
            </select>
          </div>
        </div>
        
        {/* Length, creativity, and generate button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            >
              <option>Short (100-200 words)</option>
              <option>Medium (300-500 words)</option>
              <option>Long (600+ words)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Creativity Level</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={creativityLevel}
              onChange={(e) => setCreativityLevel(Number(e.target.value))}
              className="w-full" 
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Conservative</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>
          
          <div className="flex items-end">
            <button 
              type="button" 
              className="w-full bg-primary text-white px-5 py-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleGenerate}
              disabled={generationMutation.isPending || !prompt.trim()}
            >
              Generate
            </button>
          </div>
        </div>
        
        {/* Generated content output */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
            <span>Generated Content</span>
            <button 
              className="text-xs text-primary hover:underline"
              onClick={copyGenerated}
              disabled={!generatedContent}
            >
              Copy
            </button>
          </label>
          <div 
            className="bg-gray-50 border border-gray-300 rounded-md p-4 min-h-[200px] whitespace-pre-wrap"
          >
            {generatedContent || 'Generated content will appear here...'}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          <p>Content generated using AI may require review and editing before use. Always verify facts and information.</p>
        </div>
      </div>
    </div>
  );
}
