
import React from 'react';
import { ProcessedImage } from '../types';
import { formatBytes } from '../utils/imageUtils';

interface ImageItemProps {
  image: ProcessedImage;
  onRemove: (id: string) => void;
  onPreview: (image: ProcessedImage) => void;
}

const ImageItem: React.FC<ImageItemProps> = ({ image, onRemove, onPreview }) => {
  return (
    <div className="relative group bg-white rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_24px_48px_-12px_rgba(59,130,246,0.15)] transition-all duration-500 border border-slate-100">
      {/* Thumbnail Area */}
      <div 
        className="relative aspect-[4/5] bg-slate-50 overflow-hidden cursor-zoom-in"
        onClick={() => onPreview(image)}
      >
        <img 
          src={image.processedUrl || image.originalUrl} 
          alt={image.originalFile.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
          <div className="flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(image.id); }}
              className="p-3 bg-white/20 hover:bg-red-500 backdrop-blur-xl text-white rounded-2xl transition-all shadow-lg active:scale-90"
              title="削除"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="text-white space-y-1">
            <p className="text-sm font-black truncate">{image.originalFile.name}</p>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-white/70 uppercase tracking-widest">
               <span>{image.newWidth || image.width} × {image.newHeight || image.height} px</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
           <span className={`
            px-3 py-1.5 text-[10px] font-black uppercase rounded-xl backdrop-blur-xl border border-white/20 shadow-lg
            ${image.status === 'completed' ? 'bg-emerald-500/90 text-white' : 
              image.status === 'error' ? 'bg-red-500/90 text-white' : 'bg-slate-900/60 text-white'}
          `}>
            {image.status === 'completed' ? 'Success' : image.status === 'error' ? 'Error' : 'Pending'}
          </span>
        </div>

        {image.status === 'processing' && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-md">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Action */}
      <div className="p-5 bg-white">
        {image.status === 'completed' && image.processedUrl ? (
          <a
            href={image.processedUrl}
            download={`resized_${image.newWidth}_${image.originalFile.name}`}
            className="flex items-center justify-center space-x-2 w-full bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="uppercase tracking-widest">Download</span>
          </a>
        ) : (
          <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter h-11 border-2 border-dashed border-slate-100 rounded-2xl px-4">
            <span>Size</span>
            <span className="text-slate-900">{formatBytes(image.originalFile.size)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageItem;
