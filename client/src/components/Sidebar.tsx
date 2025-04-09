import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import RecentActivity from '@/components/RecentActivity';
import { TabType } from '@/types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onFileProcessed: (extractedText: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab, onFileProcessed }: SidebarProps) {
  return (
    <div className="md:w-64 bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Features</h2>
      
      {/* Navigation tabs */}
      <nav className="space-y-2">
        <a 
          href="#" 
          className={`flex items-center px-3 py-2 rounded hover:bg-gray-50 ${activeTab === 'translation' ? 'tab-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('translation');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          Translation
        </a>
        
        <a 
          href="#" 
          className={`flex items-center px-3 py-2 rounded hover:bg-gray-50 ${activeTab === 'generation' ? 'tab-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('generation');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Content Generation
        </a>
        
        <a 
          href="#" 
          className={`flex items-center px-3 py-2 rounded hover:bg-gray-50 ${activeTab === 'summarization' ? 'tab-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('summarization');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
          Summarization
        </a>
        
        <a 
          href="#" 
          className={`flex items-center px-3 py-2 rounded hover:bg-gray-50 ${activeTab === 'enhanced_summarization' ? 'tab-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('enhanced_summarization');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Advanced Summarization
        </a>
        
        <a 
          href="#" 
          className={`flex items-center px-3 py-2 rounded hover:bg-gray-50 ${activeTab === 'keywords' ? 'tab-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('keywords');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          Keyword Extraction
        </a>
        
        <a 
          href="#" 
          className={`flex items-center px-3 py-2 rounded hover:bg-gray-50 ${activeTab === 'algorithm_recommendation' ? 'tab-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('algorithm_recommendation');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Algorithm Recommendations
        </a>
      </nav>
      
      {/* File upload section */}
      <div className="mt-8 border-t pt-4">
        <FileUpload onFileProcessed={onFileProcessed} />
      </div>
      
      {/* Recent activity section */}
      <div className="mt-6">
        <RecentActivity />
      </div>
    </div>
  );
}
