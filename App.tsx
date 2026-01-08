
import React, { useState, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Uploader from './components/Uploader';
import ImageItem from './components/ImageItem';
import { ProcessedImage } from './types';
import { resizeImage } from './utils/imageUtils';
import JSZip from 'jszip';

const PREDEFINED_WIDTHS: number[] = [640, 1200, 1920];

type ViewMode = 'grid' | 'slider';

const LiquidLoader: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="loader-overlay">
    <div className="liquid-loader">
      <div className="loading-text">
        {current} / {total} 処理中<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
      </div>
      <div className="loader-track">
        <div className="liquid-fill" style={{ width: `${(current / total) * 100}%`, animation: 'none' }}></div>
      </div>
      <p className="text-white/60 text-xs mt-4 font-bold tracking-widest uppercase">Processing your images</p>
    </div>
  </div>
);

const Lightbox: React.FC<{ image: ProcessedImage; onClose: () => void }> = ({ image, onClose }) => (
  <div 
    className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-10 animate-in fade-in zoom-in duration-300"
    onClick={onClose}
  >
    <button className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110] group">
      <svg className="w-8 h-8 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    
    <div className="relative max-w-full max-h-[75vh] flex items-center justify-center">
      <img 
        src={image.processedUrl || image.originalUrl} 
        alt="Preview" 
        className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(59,130,246,0.2)] border border-white/10"
        onClick={(e) => e.stopPropagation()}
      />
    </div>

    <div className="mt-8 text-center text-white space-y-4 max-w-lg">
      <h4 className="text-xl font-black truncate px-4">{image.originalFile.name}</h4>
      <div className="inline-flex items-center space-x-4 bg-white/5 border border-white/10 px-6 py-2 rounded-2xl text-sm">
        <span className="text-white/40">元: {image.width}×{image.height}</span>
        <span className="text-blue-400 font-bold">→</span>
        <span className="font-black text-blue-400">新: {image.newWidth}×{image.newHeight}</span>
      </div>
      
      {image.processedUrl && (
        <div className="pt-4">
          <a
            href={image.processedUrl}
            download={`resized_${image.newWidth}_${image.originalFile.name}`}
            className="inline-flex items-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-2xl shadow-blue-500/30 active:scale-95 hover:-translate-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>この画像を保存</span>
          </a>
        </div>
      )}
    </div>
  </div>
);

const App: React.FC = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [targetWidth, setTargetWidth] = useState<number>(1200);
  const [customWidth, setCustomWidth] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [previewImage, setPreviewImage] = useState<ProcessedImage | null>(null);
  
  const sliderRef = useRef<HTMLDivElement>(null);

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

  const startProcessing = async () => {
    const widthToUse = customWidth ? parseInt(customWidth) : targetWidth;
    if (isNaN(widthToUse) || widthToUse <= 0) return;

    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'error');
    if (pendingImages.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: pendingImages.length });

    for (let i = 0; i < pendingImages.length; i++) {
      const image = pendingImages[i];
      setProcessingProgress(prev => ({ ...prev, current: i + 1 }));
      
      try {
        setImages((prev) => 
          prev.map((img) => img.id === image.id ? { ...img, status: 'processing' } : img)
        );
        const result = await resizeImage(image.originalFile, widthToUse);
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
      const extension = img.originalFile.name.split('.').pop();
      const baseName = img.originalFile.name.replace(`.${extension}`, '');
      const fileName = `${baseName}_${img.newWidth}px.${extension}`;
      zip.file(fileName, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `SmartResizer_${new Date().toISOString().split('T')[0]}.zip`;
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

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 340;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Layout>
      {isProcessing && <LiquidLoader current={processingProgress.current} total={processingProgress.total} />}
      {previewImage && <Lightbox image={previewImage} onClose={() => setPreviewImage(null)} />}
      
      <div className="space-y-10 py-4">
        <section className="bg-white/90 backdrop-blur-3xl p-6 sm:p-12 rounded-[2rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] border border-slate-100 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-between space-y-10">
              <div className="space-y-8">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Resize Setting
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {PREDEFINED_WIDTHS.map((w) => (
                      <button
                        key={w}
                        disabled={isProcessing}
                        onClick={() => {
                          setTargetWidth(w);
                          setCustomWidth('');
                        }}
                        className={`
                          relative py-4 px-2 text-sm font-black rounded-2xl transition-all border-2
                          ${targetWidth === w && !customWidth 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105 z-10' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600'}
                        `}
                      >
                        {w}px
                      </button>
                    ))}
                    <div
                      className={`
                        relative py-4 px-2 text-center text-sm font-black rounded-2xl transition-all border-2
                        ${customWidth ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105 z-10' : 'bg-white border-slate-100 text-slate-400'}
                      `}
                    >
                      CUSTOM
                    </div>
                  </div>

                  <div className="relative group">
                    <input
                      type="number"
                      placeholder="任意の横幅を入力..."
                      value={customWidth}
                      onChange={(e) => {
                        setCustomWidth(e.target.value);
                        setTargetWidth(0);
                      }}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 px-6 text-lg font-black focus:outline-none focus:border-blue-500 transition-all"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black italic">
                      PX
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-4">
                <button
                  disabled={images.length === 0 || isProcessing}
                  onClick={startProcessing}
                  className={`
                    w-full py-6 px-6 rounded-[1.5rem] text-xl font-black transition-all shadow-2xl flex items-center justify-center space-x-4 active:scale-[0.96]
                    ${images.length === 0 || isProcessing
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30 hover:-translate-y-1'}
                  `}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>リサイズ実行</span>
                </button>

                {completedCount > 0 && !isProcessing && (
                  <button
                    onClick={handleBulkDownload}
                    className="w-full py-5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-3 active:scale-[0.96] hover:-translate-y-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>ZIPでまとめて保存 ({completedCount}枚)</span>
                  </button>
                )}

                {images.length > 0 && !isProcessing && (
                  <button 
                    onClick={clearAll}
                    className="w-full text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors uppercase tracking-[0.4em]"
                  >
                    Clear All List
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col min-h-[300px]">
              <label className="block text-xs font-black text-slate-400 mb-5 uppercase tracking-widest">
                Source Gallery
              </label>
              <div className="flex-grow">
                <Uploader onFilesSelected={handleFilesSelected} />
              </div>
            </div>
          </div>
        </section>

        {images.length > 0 && (
          <section className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-10 gap-6">
              <div className="flex items-center space-x-6">
                <h3 className="text-4xl font-[900] text-slate-900 tracking-tight">Gallery</h3>
                <div className="flex items-center space-x-3 bg-slate-100 px-5 py-2 rounded-full border border-slate-200">
                  <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{images.length} FILES</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`px-6 py-2 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Grid
                  </button>
                  <button 
                    onClick={() => setViewMode('slider')}
                    className={`px-6 py-2 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${viewMode === 'slider' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Slider
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {images.map((image) => (
                  <ImageItem 
                    key={image.id} 
                    image={image} 
                    onRemove={removeImage}
                    onPreview={setPreviewImage}
                  />
                ))}
              </div>
            ) : (
              <div className="relative group">
                <div 
                  ref={sliderRef}
                  className="flex overflow-x-auto space-x-8 pb-10 scrollbar-hide snap-x"
                >
                  {images.map((image) => (
                    <div key={image.id} className="flex-none w-[320px] snap-center">
                      <ImageItem 
                        image={image} 
                        onRemove={removeImage}
                        onPreview={setPreviewImage}
                      />
                    </div>
                  ))}
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -left-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => scrollSlider('left')} className="p-4 bg-white shadow-2xl rounded-full hover:bg-blue-600 hover:text-white transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => scrollSlider('right')} className="p-4 bg-white shadow-2xl rounded-full hover:bg-blue-600 hover:text-white transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
};

export default App;
