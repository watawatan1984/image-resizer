
export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  width: number;
  height: number;
  newWidth: number;
  newHeight: number;
}

export type ResizeWidth = 640 | 1024 | 1200 | number;

export interface ResizeConfig {
  width: ResizeWidth;
}
