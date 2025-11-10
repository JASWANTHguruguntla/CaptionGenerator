import React, { useState, useCallback, useEffect } from 'react';
import { CaptionResult, HistoryItem } from './types';
import { generateCaptionForImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import HistoryPanel from './components/HistoryPanel';
import Controls from './components/Controls';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { RefreshIcon } from './components/icons/RefreshIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';

// New imports for safe storage
import { loadHistory, saveHistory, clearHistory } from './utils/storage';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [captionResult, setCaptionResult] = useState<CaptionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [tone, setTone] = useState('Creative');
  const [platform, setPlatform] = useState('Instagram');

  useEffect(() => {
    // Load history safely at startup
    const stored = loadHistory();
    setHistory(stored);
  }, []);

  // Whenever history changes, attempt to persist using our safe helper.
  useEffect(() => {
    try {
      saveHistory(history);
    } catch (err) {
      // saveHistory swallows most errors, but guard here too
      console.error('Error while saving history (caught in App):', err);
    }
  }, [history]);

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    setCaptionResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateCaption = useCallback(async () => {
    if (!imageFile || !imageUrl) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const base64Image = await fileToBase64(imageFile);
      const result = await generateCaptionForImage(base64Image, imageFile.type, tone, platform);
      setCaptionResult(result);

      // Add to history at the front. Keep imageUrl as-is for display,
      // but the storage helper will strip image data if quota is hit.
      const newEntry: HistoryItem = {
        id: new Date().toISOString(),
        imageUrl,
        result,
      };

      setHistory(prevHistory => {
        const updated = [newEntry, ...prevHistory];
        // Optionally, keep only a reasonable maximum in-memory as well
        return updated.slice(0, 50);
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, imageUrl, tone, platform]);

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setCaptionResult(null);
    setError(null);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setImageUrl(item.imageUrl);
    setCaptionResult(item.result);
    setImageFile(null);
    setIsHistoryOpen(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      clearHistory(); // also clear storage
    } catch (err) {
      console.error('clearHistory error', err);
    }
  };

  const buttonText = isLoading ? 'Generating...' : (captionResult ? 'Regenerate Captions' : 'Generate Captions');

  const showRegenerateIcon = !isLoading && !!captionResult;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 flex flex-col items-center p-4 sm:p-6 md:p-8">
        <main className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
          <header className="w-full mb-8 relative">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
              AI Caption Generator
            </h1>
            <p className="text-lg text-slate-400">
              Craft the perfect post in seconds.
            </p>
            <button
                onClick={() => setIsHistoryOpen(true)}
                className="absolute top-0 right-0 flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-colors"
                aria-label="View history"
            >
                <HistoryIcon className="w-5 h-5" />
            </button>
          </header>

          <div className="w-full bg-gray-800/30 rounded-xl shadow-lg p-6 backdrop-blur-sm border border-gray-700">
            <ImageUploader onImageSelect={handleImageSelect} imageUrl={imageUrl} isLoading={isLoading} />
            
            <Controls 
              tone={tone}
              setTone={setTone}
              platform={platform}
              setPlatform={setPlatform}
              disabled={isLoading}
            />

            <button
              onClick={handleGenerateCaption}
              disabled={!imageFile || isLoading}
              className="mt-6 w-full flex justify-center items-center gap-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
            >
              {isLoading && <SpinnerIcon className="w-5 h-5" />}
              {!isLoading && showRegenerateIcon && <RefreshIcon className="w-5 h-5" />}
              {buttonText}
            </button>

            {error && (
              <div className="mt-4 p-3 rounded bg-red-700 text-white">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

        </main>

        <HistoryPanel 
          isOpen={isHistoryOpen}
          history={history}
          onClose={() => setIsHistoryOpen(false)}
          onSelect={handleSelectHistoryItem}
          onClear={handleClearHistory}
        />
      </div>
      <ResultDisplay result={captionResult} isLoading={isLoading} />
    </>
  );
};

export default App;