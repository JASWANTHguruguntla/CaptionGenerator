import React, { useState, useCallback, useEffect } from "react";
import { CaptionResult, HistoryItem } from "./types";
import { generateCaptionForImage } from "./services/geminiService";
import { resizeFileToDataUrl, generateThumbnailDataUrl } from "./utils/imageUtils";
import ImageUploader from "./components/ImageUploader";
import ResultDisplay from "./components/ResultDisplay";
import HistoryPanel from "./components/HistoryPanel";
import Controls from "./components/Controls";
import { SpinnerIcon } from "./components/icons/SpinnerIcon";
import { RefreshIcon } from "./components/icons/RefreshIcon";
import { HistoryIcon } from "./components/icons/HistoryIcon";
import { loadHistory, saveHistory, clearHistory } from "./utils/storage";

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [captionResult, setCaptionResult] = useState<CaptionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [tone, setTone] = useState("Creative");
  const [platform, setPlatform] = useState("Instagram");

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    try {
      saveHistory(history);
    } catch (err) {
      console.error("Error saving history:", err);
    }
  }, [history]);

  const handleImageSelect = async (file: File) => {
    try {
      setImageFile(file);
      setCaptionResult(null);
      setError(null);
      if (displayUrl && displayUrl.startsWith("blob:")) URL.revokeObjectURL(displayUrl);
      setDisplayUrl(URL.createObjectURL(file));
    } catch (err) {
      console.error("handleImageSelect error", err);
      setError("Failed to prepare selected image.");
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
      const resizedForApi = await resizeFileToDataUrl(imageFile, 1024, 0.8);
      const thumb = await generateThumbnailDataUrl(imageFile, 200, 0.6);

      const result = await generateCaptionForImage(
        resizedForApi.replace(/^data:image\/[^;]+;base64,/, ""),
        "image/jpeg",
        tone,
        platform
      );

      setCaptionResult(result);

      const newEntry: HistoryItem = {
        id: new Date().toISOString(),
        imageUrl: thumb,
        result,
      };

      setHistory((prev) => [newEntry, ...prev].slice(0, 10)); // keep last 10
    } catch (err: any) {
      console.error("generate error", err);
      if (err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE")) {
        setError("⚠️ Gemini servers are busy. Please try again in a few seconds.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while generating captions.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, tone, platform]);

  const handleReset = () => {
    setImageFile(null);
    if (displayUrl && displayUrl.startsWith("blob:")) URL.revokeObjectURL(displayUrl);
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
    clearHistory();
  };

  const buttonText = isLoading
    ? "Generating..."
    : captionResult
    ? "Regenerate Captions"
    : "Generate Captions";

  const showRegenerateIcon = !isLoading && !!captionResult;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white flex flex-col items-center p-4">
        <main className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
          <h1 className="text-4xl font-bold text-purple-400 text-center mt-8">
            AI Caption Generator
          </h1>
          <p className="text-gray-300 text-center">
            Craft the perfect post in seconds 🚀
          </p>

          <ImageUploader
            onImageSelect={handleImageSelect}
            imageUrl={displayUrl}
            isLoading={isLoading}
          />

          <Controls
            tone={tone}
            setTone={setTone}
            platform={platform}
            setPlatform={setPlatform}
          />

          <button
            onClick={handleGenerateCaption}
            disabled={!imageFile || isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition flex items-center gap-2"
          >
            {isLoading && <SpinnerIcon />}
            {!isLoading && showRegenerateIcon && <RefreshIcon />}
            {buttonText}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded bg-red-700 text-white text-center">
              <strong>Error:</strong> {error}
            </div>
          )}
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
