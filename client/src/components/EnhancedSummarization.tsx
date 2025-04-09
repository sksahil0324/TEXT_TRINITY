import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMutation } from '@tanstack/react-query';
import { SummarizationRequest, SummarizationResponse } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedSummarizationProps {
  showProcessing: (title: string, message?: string) => void;
  hideProcessing: () => void;
}

async function summarizeText(request: SummarizationRequest): Promise<SummarizationResponse> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new Error('Failed to summarize text');
  }
  
  return response.json();
}

export default function EnhancedSummarization({ showProcessing, hideProcessing }: EnhancedSummarizationProps) {
  const [inputText, setInputText] = useState('');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [summaryStyle, setSummaryStyle] = useState<'informative' | 'bullet_points' | 'simplified'>('informative');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const { toast } = useToast();

  const summarizeMutation = useMutation({
    mutationFn: (request: SummarizationRequest) => summarizeText(request),
    onMutate: () => {
      showProcessing('Summarizing Text', 'Applying advanced TF-IDF techniques...');
    },
    onSuccess: (data: SummarizationResponse) => {
      hideProcessing();
    },
    onError: (error: Error) => {
      hideProcessing();
      toast({
        title: 'Summarization failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      toast({
        title: 'Empty input',
        description: 'Please enter some text to summarize',
        variant: 'destructive'
      });
      return;
    }

    summarizeMutation.mutate({
      text: inputText,
      length: summaryLength,
      style: summaryStyle
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Advanced Text Summarization</CardTitle>
        <CardDescription>
          Summarize text using enhanced TF-IDF techniques with BM25+ weighting, semantic clustering, and copyright-friendly paraphrasing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-text">Text to Summarize</Label>
              <Textarea
                id="input-text"
                placeholder="Enter or paste your text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced-options"
                checked={showAdvancedOptions}
                onCheckedChange={setShowAdvancedOptions}
              />
              <Label htmlFor="advanced-options">Show Advanced Options</Label>
            </div>
            
            {showAdvancedOptions && (
              <Tabs defaultValue="length" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="length">Summary Length</TabsTrigger>
                  <TabsTrigger value="style">Summary Style</TabsTrigger>
                </TabsList>
                <TabsContent value="length" className="space-y-2">
                  <RadioGroup 
                    defaultValue="medium" 
                    value={summaryLength}
                    onValueChange={(value) => setSummaryLength(value as 'short' | 'medium' | 'long')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="short" id="short" />
                      <Label htmlFor="short">Short (concise overview)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium (balanced summary)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="long" id="long" />
                      <Label htmlFor="long">Long (detailed summary)</Label>
                    </div>
                  </RadioGroup>
                </TabsContent>
                <TabsContent value="style" className="space-y-2">
                  <RadioGroup 
                    defaultValue="informative" 
                    value={summaryStyle}
                    onValueChange={(value) => setSummaryStyle(value as 'informative' | 'bullet_points' | 'simplified')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="informative" id="informative" />
                      <Label htmlFor="informative">Informative (standard)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bullet_points" id="bullet_points" />
                      <Label htmlFor="bullet_points">Bullet Points (scannable)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="simplified" id="simplified" />
                      <Label htmlFor="simplified">Simplified (easier reading)</Label>
                    </div>
                  </RadioGroup>
                </TabsContent>
              </Tabs>
            )}
          </div>
          
          <div className="mt-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={summarizeMutation.isPending || !inputText.trim()}
            >
              {summarizeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Summarizing...
                </>
              ) : (
                'Summarize Text'
              )}
            </Button>
          </div>
        </form>
        
        {summarizeMutation.isSuccess && (
          <div className="mt-6 space-y-2">
            <Label>Summary Result</Label>
            <Card>
              <CardContent className="pt-4">
                <div className="whitespace-pre-wrap">
                  {summarizeMutation.data.summary}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <div>
          Enhanced TF-IDF with BM25+ weighting, semantic clustering, and copyright-friendly paraphrasing by Sahil Basheer Shaikh
        </div>
      </CardFooter>
    </Card>
  );
}