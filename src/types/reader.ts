export type AppTheme = 'system' | 'light' | 'dark';
export type PdfReadingMode = 'light' | 'dark';
// Deprecated alias for backwards compatibility
export type ReadingTheme = PdfReadingMode;
export type ReaderOrientation = 'portrait' | 'landscape';

export interface Bookmark {
  id: string;
  pageNumber: number;
  label?: string;
  createdAt: number;
  note?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: number;
  totalPages: number;
  currentPage: number;
  lastReadTimestamp: number;
  bookmarks: Bookmark[];
  thumbnail?: string; // base64 preview
  isSample?: boolean;
}

export interface ReaderPreferences {
  appTheme: AppTheme;
  readingMode: PdfReadingMode;
  readingTheme?: PdfReadingMode; // backwards compatibility
  orientation: ReaderOrientation;
  eyeComfortEnabled: boolean; // Independent toggle: true / false
  eyeComfortIntensity: number; // 0 to 100 ("Blue-light filter intensity")
  brightness: number; // 0.15 to 1.0
  keepScreenAwake: boolean;
  showPageIndicator: boolean;
  zoomLevel: number;
}
