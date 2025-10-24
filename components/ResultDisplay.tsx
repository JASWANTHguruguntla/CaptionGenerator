import React, { useState } from 'react';
import { CaptionResult } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import ShareButtons from './ShareButtons';

interface ResultDisplayProps {
  result: CaptionResult | null;
  isLoading: boolean;
}

type CaptionType = 'title' | 'medium' | 'large';

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-0 right-0 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-slate-300 transition-all duration-200"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <CopyIcon className="w-5 h-5" />
      )}
    </button>
  );
};

const getCategoryColor = (category: string) => {
    switch(category.toLowerCase()) {
      case 'niche': return 'bg-green-800/60 text-green-300 ring-1 ring-inset ring-green-500/20';
      case 'location': return 'bg-blue-800/60 text-blue-300 ring-1 ring-inset ring-blue-500/20';
      case 'trending': return 'bg-yellow-800/60 text-yellow-300 ring-1 ring-inset ring-yellow-500/20';
      case 'general':
      default: return 'bg-gray-700/80 text-purple-300 ring-1 ring-inset ring-gray-500/20';
    }
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isLoading }) => {
  const [activeTab, setActiveTab] = useState<CaptionType>('medium');

  if (isLoading) {
    return (
        <div className="w-full mt-6 text-center">
            <div className="animate-pulse bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-6"></div>
                <div className="h-4 bg-gray-700 rounded w-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
                <div className="flex justify-start gap-2 mt-6">
                    <div className="h-6 bg-gray-700 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-700 rounded-full w-24"></div>
                    <div className="h-6 bg-gray-700 rounded-full w-16"></div>
                </div>
            </div>
        </div>
    );
  }
  
  if (!result) return null;

  const captions = {
    title: result.titleCaption,
    medium: result.mediumCaption,
    large: result.largeCaption,
  };
  
  const tabNames: { key: CaptionType; label: string }[] = [
    { key: 'title', label: 'Short' },
    { key: 'medium', label: 'Medium' },
    { key: 'large', label: 'Long' },
  ];

  const activeCaption = captions[activeTab];
  const hashtagsText = result.hashtags.map(h => `#${h.tag}`).join(' ');
  const textToCopy = `${activeCaption}\n\n${hashtagsText}`;

  return (
    <div className="w-full mt-6 text-left animate-fade-in-up">
      <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700">
        
        <div className="flex border-b border-gray-700 mb-4">
          {tabNames.map(({key, label}) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 -mb-px text-sm font-semibold transition-colors duration-200 border-b-2
                ${activeTab === key ? 'text-purple-400 border-purple-400' : 'text-gray-400 border-transparent hover:text-purple-400'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <p className="text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[6rem] pr-10">
            {activeCaption}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {result.hashtags.map((ht, index) => (
              <span key={index} className={`text-xs font-medium px-3 py-1 rounded-full ${getCategoryColor(ht.category)}`}>
                #{ht.tag}
              </span>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <ShareButtons text={textToCopy} />
          </div>

          <CopyButton textToCopy={textToCopy} />
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;