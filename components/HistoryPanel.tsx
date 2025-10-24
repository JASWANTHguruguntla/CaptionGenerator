import React from 'react';
import { HistoryItem } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { TrashIcon } from './icons/TrashIcon';

interface HistoryPanelProps {
  isOpen: boolean;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, history, onSelect, onClear, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300" 
      onClick={onClose}
      aria-hidden="true"
    >
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 shadow-lg z-50 flex flex-col transition-transform duration-300 transform translate-x-0"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-heading"
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id="history-heading" className="text-lg font-semibold text-white">Caption History</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-800"
              aria-label="Clear history"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
              aria-label="Close history panel"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p>Your generated captions will appear here.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {history.map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => onSelect(item)} 
                    className="w-full flex items-start gap-4 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors text-left"
                  >
                    <img 
                      src={item.imageUrl} 
                      alt="History thumbnail" 
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="text-sm text-slate-200 truncate" title={item.result.titleCaption}>
                        {item.result.titleCaption}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {item.result.mediumCaption}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
