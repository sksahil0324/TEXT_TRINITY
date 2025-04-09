import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import TextTranslation from '@/components/TextTranslation';
import ContentGeneration from '@/components/ContentGeneration';
import TextSummarization from '@/components/TextSummarization';
import EnhancedSummarization from '@/components/EnhancedSummarization';
import KeywordExtraction from '@/components/KeywordExtraction';
import AlgorithmRecommendation from '@/components/AlgorithmRecommendation';
import ProcessingState from '@/components/ProcessingState';
import { TabType } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('translation');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTitle, setProcessingTitle] = useState('Processing Your Request');
  const [processingMessage, setProcessingMessage] = useState('This may take a few moments...');
  const [extractedText, setExtractedText] = useState('');

  // Handle file upload result
  const handleFileProcessed = (text: string) => {
    setExtractedText(text);
  };

  // Show processing overlay
  const showProcessing = (title: string, message?: string) => {
    setProcessingTitle(title);
    if (message) setProcessingMessage(message);
    setIsProcessing(true);
  };

  // Hide processing overlay
  const hideProcessing = () => {
    setIsProcessing(false);
  };

  // Render the active tab content
  const renderActiveTab = () => {
    switch(activeTab) {
      case 'translation':
        return (
          <TextTranslation 
            showProcessing={showProcessing} 
            hideProcessing={hideProcessing} 
            initialText={extractedText}
          />
        );
      case 'generation':
        return (
          <ContentGeneration 
            showProcessing={showProcessing} 
            hideProcessing={hideProcessing}
          />
        );
      case 'summarization':
        return (
          <TextSummarization 
            showProcessing={showProcessing} 
            hideProcessing={hideProcessing}
            initialText={extractedText}
          />
        );
      case 'enhanced_summarization':
        return (
          <EnhancedSummarization 
            showProcessing={showProcessing} 
            hideProcessing={hideProcessing}
          />
        );
      case 'keywords':
        return (
          <KeywordExtraction 
            showProcessing={showProcessing} 
            hideProcessing={hideProcessing}
            initialText={extractedText}
          />
        );
      case 'algorithm_recommendation':
        return (
          <AlgorithmRecommendation />
        );
      default:
        return <TextTranslation showProcessing={showProcessing} hideProcessing={hideProcessing} initialText={extractedText} />;
    }
  };

  // Clear extracted text when changing tabs
  useEffect(() => {
    setExtractedText('');
  }, [activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar with navigation and file upload */}
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onFileProcessed={handleFileProcessed}
          />
          
          {/* Main content area */}
          <div className="flex-1">
            {renderActiveTab()}
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Processing overlay */}
      {isProcessing && (
        <ProcessingState
          title={processingTitle}
          message={processingMessage}
        />
      )}
    </div>
  );
}
