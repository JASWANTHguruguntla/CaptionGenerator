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
    try {
      const storedHistory = localStorage.getItem('captionHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('captionHistory', JSON.stringify(history));
  }, [history]);
  
  // This effect handles cleanup of the blob URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, []); // Only runs on mount and unmount to catch the last URL.

  const handleImageSelect = (file: File) => {
    // Revoke the old object URL if it exists to avoid memory leaks
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    
    setCaptionResult(null);
    setError(null);

    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const newImageUrl = URL.createObjectURL(file);
      setImageUrl(newImageUrl);
    } else {
      setError("Please select a valid image file.");
      setImageUrl(null);
      setImageFile(null);
    }
  };

  const handleGenerateCaption = useCallback(async () => {
    if (!imageFile) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const base64Image = await fileToBase64(imageFile);
      const result = await generateCaptionForImage(base64Image, imageFile.type, tone, platform);
      
      // Reconstruct the data URL for history, as blob URLs are temporary.
      const historyImageUrl = `data:${imageFile.type};base64,${base64Image}`;
      
      setCaptionResult(result);
      setHistory(prevHistory => [{ id: new Date().toISOString(), imageUrl: historyImageUrl, result }, ...prevHistory]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, tone, platform]);
  
  const handleReset = () => {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageFile(null);
    setImageUrl(null);
    setCaptionResult(null);
    setError(null);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(item.imageUrl);
    setCaptionResult(item.result);
    setImageFile(null); // Can't regenerate from history item, so disable button
    setIsHistoryOpen(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const canGenerate = !!imageFile;
  const buttonText = isLoading ? 'Generating...' : (captionResult && canGenerate ? 'Regenerate Captions' : 'Generate Captions');
  const showRegenerateIcon = !isLoading && !!captionResult && canGenerate;

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
              disabled={!canGenerate || isLoading}
              className="mt-6 w-full flex justify-center items-center gap-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
            >
              {isLoading && <SpinnerIcon className="w-5 h-5" />}
              {showRegenerateIcon && <RefreshIcon className="w-5 h-5" />}
              {buttonText}
            </button>
          </div>

          {error && (
            <div className="mt-6 w-full bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <ResultDisplay result={captionResult} isLoading={isLoading} />

          {captionResult && !isLoading && (
             <button
              onClick={handleReset}
              className="mt-6 flex justify-center items-center gap-3 bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-pink-500"
            >
              Generate for Another Image
            </button>
          )}

        </main>
      </div>
      <HistoryPanel 
        isOpen={isHistoryOpen}
        history={history}
        onSelect={handleSelectHistoryItem}
        onClear={handleClearHistory}
        onClose={() => setIsHistoryOpen(false)}
      />
    </>
  );
};

export default App;