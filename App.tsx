
import React, { useState, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Uploader from './components/Uploader';
import ImageItem from './components/ImageItem';
import { ProcessedImage, ResizeWidth } from './types';
import { resizeImage } from './utils/imageUtils';
import JSZip from 'jszip';

const PREDEFINED_WIDTHS: ResizeWidth[] = [640, 1024, 1200];

const LiquidLoader: React.FC = () => (
  <div className="loader-overlay">
    <div className="liquid-loader">
      <div className="loading-text">
        画像処理中<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
      </div>
      <div className="loader-track">
        <div className="liquid-fill"></div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [targetWidth, setTargetWidth] = useState<ResizeWidth>(1200);
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed images count for bulk download button
  const completedCount = useMemo(() => images.filter(img => img.status === 'completed').length, [images]);

  const handleFilesSelected = useCallback((files: File[]) => {
    const newImages: ProcessedImage[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      status: 'pending',
      width: 0,
      height: 0,
      newWidth: 0,
      newHeight: 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      const removed = prev.find((img) => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.originalUrl);
        if (removed.processedUrl) URL.revokeObjectURL(removed.processedUrl);
      }
      return filtered;
    });
  }, []);

  const processSingleImage = async (image: ProcessedImage, width: number) => {
    try {
      setImages((prev) => 
        prev.map((img) => img.id === image.id ? { ...img, status: 'processing' } : img)
      );

      const result = await resizeImage(image.originalFile, width);

      setImages((prev) => 
        prev.map((img) => img.id === image.id ? { 
          ...img, 
          processedUrl: result.url, 
          status: 'completed',
          width: result.width,
          height: result.height,
          newWidth: result.newWidth,
          newHeight: result.newHeight
        } : img)
      );
    } catch (err) {
      console.error('Processing failed for', image.originalFile.name, err);
      setImages((prev) => 
        prev.map((img) => img.id === image.id ? { ...img, status: 'error' } : img)
      );
    }
  };

  const startProcessing = async () => {
    setIsProcessing(true);
    // Give browser a frame to render the loader
    await new Promise(r => setTimeout(r, 50));
    
    const pendingImages = images.filter(img => img.status !== 'processing');
    for (const img of pendingImages) {
      await processSingleImage(img, targetWidth);
    }
    setIsProcessing(false);
  };

  const handleBulkDownload = async () => {
    const completedImages = images.filter(img => img.status === 'completed' && img.processedUrl);
    if (completedImages.length === 0) return;

    const zip = new JSZip();
    
    for (const img of completedImages) {
      if (!img.processedUrl) continue;
      const response = await fetch(img.processedUrl);
      const blob = await response.blob();
      const fileName = `resized_${img.newWidth}_${img.originalFile.name}`;
      zip.file(fileName, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `SmartResizer_images_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const clearAll = () => {
    images.forEach(img => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
    });
    setImages([]);
  };

  return (
    <Layout>
      {isProcessing && <LiquidLoader />}
      
      <div className="space-y-12">
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            画像を最適なサイズに。
          </h2>
          <p className="text-lg text-gray-600">
            複数の画像をまとめてリサイズ。ブラウザ上で完結するため、セキュリティも安心です。
          </p>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-4 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  1. リサイズ幅を選択 (px)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PREDEFINED_WIDTHS.map((w) => (
                    <button
                      key={w}
                      disabled={isProcessing}
                      onClick={() => setTargetWidth(w)}
                      className={`
                        py-3 px-2 text-sm font-bold rounded-xl transition-all border-2
                        ${targetWidth === w 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:text-blue-600'}
                      `}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <button
                  disabled={images.length === 0 || isProcessing}
                  onClick={startProcessing}
                  className={`
                    w-full py-4 px-6 rounded-2xl text-lg font-bold transition-all shadow-xl flex items-center justify-center space-x-2
                    ${images.length === 0 || isProcessing
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-blue-200'}
                  `}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>リサイズ開始</span>
                </button>

                {completedCount > 0 && !isProcessing && (
                  <button
                    onClick={handleBulkDownload}
                    className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center space-x-2 active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>一括ダウンロード ({completedCount}枚)</span>
                  </button>
                )}

                {images.length > 0 && !isProcessing && (
                  <button 
                    onClick={clearAll}
                    className="w-full pt-2 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                  >
                    リストをリセット
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-8">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                2. 画像を追加
              </label>
              <Uploader onFilesSelected={handleFilesSelected} />
            </div>
          </div>
        </section>

        {images.length > 0 && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                画像リスト
                <span className="ml-3 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {images.length} 枚
                </span>
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <ImageItem 
                  key={image.id} 
                  image={image} 
                  onRemove={removeImage} 
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default App;
