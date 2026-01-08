
import React from 'react';
import { ProcessedImage } from '../types';
import { formatBytes } from '../utils/imageUtils';

interface ImageItemProps {
  image: ProcessedImage;
  onRemove: (id: string) => void;
}

const ImageItem: React.FC<ImageItemProps> = ({ image, onRemove }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <img 
          src={image.processedUrl || image.originalUrl} 
          alt={image.originalFile.name}
          className="w-full h-full object-contain"
        />
        <button
          onClick={() => onRemove(image.id)}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 shadow-lg"
          title="削除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {image.status === 'processing' && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <span className="text-xs font-medium text-blue-600">処理中...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium text-gray-900 truncate flex-1" title={image.originalFile.name}>
            {image.originalFile.name}
          </h3>
          <span className={`
            ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full
            ${image.status === 'completed' ? 'bg-green-100 text-green-700' : 
              image.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}
          `}>
            {image.status === 'completed' ? '完了' : image.status === 'error' ? '失敗' : '待機中'}
          </span>
        </div>

        <div className="space-y-1 text-xs text-gray-500 mb-4">
          <div className="flex justify-between">
            <span>元のサイズ:</span>
            <span className="font-medium text-gray-700">{image.width} × {image.height} px</span>
          </div>
          {image.status === 'completed' && (
            <div className="flex justify-between text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
              <span className="font-semibold">新サイズ:</span>
              <span className="font-bold">{image.newWidth} × {image.newHeight} px</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>ファイルサイズ:</span>
            <span>{formatBytes(image.originalFile.size)}</span>
          </div>
        </div>

        {image.status === 'completed' && image.processedUrl && (
          <a
            href={image.processedUrl}
            download={`resized_${image.newWidth}_${image.originalFile.name}`}
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors shadow-sm"
          >
            ダウンロード
          </a>
        )}
      </div>
    </div>
  );
};

export default ImageItem;
