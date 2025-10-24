import React, { useState } from 'react';
import { TwitterIcon } from './icons/TwitterIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { InstagramIcon } from './icons/InstagramIcon';

interface ShareButtonsProps {
  text: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const encodedText = encodeURIComponent(text);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=https://aistudio.google.com&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=https://aistudio.google.com&title=Check%20out%20this%20AI-generated%20caption!&summary=${encodedText}`,
  };

  const handleInstagramCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-400">Share on:</span>
        <div className="flex items-center gap-3">
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter" className="text-slate-400 hover:text-white transition-colors">
                <TwitterIcon className="w-5 h-5" />
            </a>
            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="text-slate-400 hover:text-white transition-colors">
                <FacebookIcon className="w-5 h-5" />
            </a>
            <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" className="text-slate-400 hover:text-white transition-colors">
                <LinkedInIcon className="w-5 h-5" />
            </a>
            <div className="relative">
              <button onClick={handleInstagramCopy} aria-label="Copy for Instagram" className="text-slate-400 hover:text-white transition-colors">
                  <InstagramIcon className="w-5 h-5" />
              </button>
              {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-green-600 text-white px-2 py-1 rounded-md whitespace-nowrap">Copied!</span>}
            </div>
        </div>
    </div>
  );
};

export default ShareButtons;