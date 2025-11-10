import React, { useState, useCallback, useEffect } from 'react';
import { CaptionResult, HistoryItem } from './types';
import { generateCaptionForImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { resizeFileToDataUrl, generateThumbnailDataUrl } from './utils/imageUtils';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import HistoryPanel from './components/HistoryPanel';
import Controls from './components/Controls';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { RefreshIcon } from './components/icons/RefreshIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';

// safe storage helpers
import { loadHistory, saveHistory, clearHistory } from './utils/storage';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  // displayUrl is an object URL (not base64) to avoid large strings in memory
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [captionResult, setCaptionResult] = useState<CaptionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [tone, setTone] = useState('Creative');
  const [platform, setPlatform] = useState('Instagram');

  useEffect(() => {
    const stored = loadHistory();
    setHistory(stored);
  }, []);

  useEffect(() => {
    try {
      saveHistory(history);
    } catch (err) {
      console.error('Error while saving history (caught in App):', err);
    }
  }, [history]);

  // Clean up object URL when component unmounts or displayUrl changes
  useEffect(() => {
    return () => {
      if (displayUrl && displayUrl.startsWith('blob:')) {
        URL.revokeObjectURL(displayUrl);
      }
    };
  }, [displayUrl]);

  const handleImageSelect = async (file: File) => {
    try {
      setImageFile(file);
      setCaptionResult(null);
      setError(null);

      // Use object URL for display (efficient)
      const url = URL.createObjectURL(file);
      // revoke previous
      if (displayUrl && displayUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(displayUrl); } catch {}
      }
      setDisplayUrl(url);
    } catch (err) {
      console.error('handleImageSelect error', err);
      setError('Failed to prepare selected image.');
    }
  };

  const handleGenerateCaption = useCallback(async () => {
    if (!imageFile) {
      setError('Please select an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1) Resize for API to limit upload size (e.g., max 1024)
      const resizedForApi = await resizeFileToDataUrl(imageFile, 1024, 0.8);

      // 2) Generate a small thumbnail to store in history (e.g., 200px)
      const thumb = await generateThumbnailDataUrl(imageFile, 200, 0.6);

      // 3) Use the resizedForApi (base64) to call the model
      const result = await generateCaptionForImage(resizedForApi.replace(/^data:image\/[^;]+;base64,/, ''), 'image/jpeg', tone, platform);
      // Note: If your generateCaptionForImage expects base64-without-dataurl, adapt as above.
      setCaptionResult(result);

      const newEntry: HistoryItem = {
        id: new Date().toISOString(),
        imageUrl: thumb, // store only a small thumbnail
        result,
      };

      setHistory(prev => [newEntry, ...prev].slice(0, 50)); // keep in-memory bounded
    } catch (err: unknown) {
      console.error('generate error', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while generating captions.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, tone, platform]);

  const handleReset = () => {
    setImageFile(null);
    if (displayUrl && displayUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(displayUrl); } catch {}
    }
    setDisplayUrl(null);
    setCaptionResult(null);
    setError(null);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setDisplayUrl(item.imageUrl || null);
    setCaptionResult(item.result);
    setImageFile(null);
    setIsHistoryOpen(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try { clearHistory(); } catch (err) { console.error('clearHistory error', err); }
  };

  const buttonText = isLoading ? 'Generating...' : (captionResult ? 'Regenerate Captions' : 'Generate Captions');
  const showRegenerateIcon = !isLoading && !!captionResult;

  return (
    <>
      <div className="min-h-screen ...">
        <main className="w-full max-w-2xl mx-auto ...">
          <header> ... </header>

          <div className="w-full ...">
            <ImageUploader onImageSelect={handleImageSelect} imageUrl={displayUrl} isLoading={isLoading} />

            <Controls ... />

            <button onClick={handleGenerateCaption} disabled={!imageFile || isLoading} className="...">
              {isLoading && <SpinnerIcon />}
              {!isLoading && showRegenerateIcon && <RefreshIcon />}
              {buttonText}
            </button>

            {error && <div className="mt-4 p-3 rounded bg-red-700 text-white"><strong>Error:</strong> {error}</div>}
          </div>
        </main>

        <HistoryPanel isOpen={isHistoryOpen} history={history} onClose={() => setIsHistoryOpen(false)} onSelect={handleSelectHistoryItem} onClear={handleClearHistory} />
      </div>

      <ResultDisplay result={captionResult} isLoading={isLoading} />
    </>
  );
};

export default App;
