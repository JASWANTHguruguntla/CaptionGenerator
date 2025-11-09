import React, { useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  imageUrl: string | null;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, imageUrl, isLoading }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelect(event.target.files[0]);
    }
  };

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isLoading && event.dataTransfer.files && event.dataTransfer.files[0]) {
        onImageSelect(event.dataTransfer.files[0]);
      }
    },
    [isLoading, onImageSelect]
  );

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div>
      {/* Hidden input outside label — linked via htmlFor */}
      <input
        id="image-upload"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
        disabled={isLoading}
      />

      <label
        onDrop={onDrop}
        onDragOver={onDragOver}
        htmlFor="image-upload"
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg bg-gray-900/50 hover:bg-gray-800/60 transition-colors duration-300 ${
          isLoading ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-full object-contain rounded-lg p-1"
          />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
            <UploadIcon className="w-10 h-10 mb-3" />
            <p className="mb-2 text-sm">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs">PNG, JPG, WEBP, etc.</p>
          </div>
        )}
      </label>
    </div>
  );
};

export default ImageUploader;
