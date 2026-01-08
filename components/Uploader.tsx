
import React, { useState, useCallback } from 'react';

interface UploaderProps {
  onFilesSelected: (files: File[]) => void;
}

const Uploader: React.FC<UploaderProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Explicitly type the file parameter as File to resolve the 'unknown' type error in handleDrop
    const files = Array.from(e.dataTransfer.files).filter((file: File) => 
      file.type.match(/image\/(jpeg|png|webp)/)
    );
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Ensure the result of Array.from is treated as a File array
      const files = Array.from(e.target.files) as File[];
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  return (
    <div className="w-full">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full h-64 
          border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-50' 
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
          <div className="mb-4 p-4 bg-blue-100 rounded-full text-blue-600">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="mb-2 text-lg font-semibold text-gray-700">
            画像をドラッグ＆ドロップ
          </p>
          <p className="text-sm text-gray-500 mb-4">
            またはクリックしてファイルを選択
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded border border-gray-200">JPG</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded border border-gray-200">PNG</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded border border-gray-200">WebP</span>
          </div>
        </div>
        <input 
          type="file" 
          className="hidden" 
          multiple 
          accept="image/jpeg,image/png,image/webp" 
          onChange={handleFileInput}
        />
      </label>
    </div>
  );
};

export default Uploader;
