
/**
 * Resizes an image using Canvas API while maintaining aspect ratio.
 */
export const resizeImage = (
  file: File,
  targetWidth: number
): Promise<{ blob: Blob; url: string; width: number; height: number; newWidth: number; newHeight: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        // Calculate new dimensions
        const aspectRatio = originalHeight / originalWidth;
        const newWidth = targetWidth;
        const newHeight = Math.round(targetWidth * aspectRatio);

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 高画質設定を強制
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // クオリティを1.0 (最大) に設定して画質の劣化を最小限に抑える
        const mimeType = file.type || 'image/png';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve({
                blob,
                url,
                width: originalWidth,
                height: originalHeight,
                newWidth,
                newHeight
              });
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          mimeType,
          1.0 
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Utility to format byte sizes
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
