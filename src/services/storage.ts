import { DocumentItem, ReaderPreferences } from '../types/reader';

const DB_NAME = 'PageNestDB';
const DB_VERSION = 1;
const STORE_DOCS = 'documents';
const STORE_FILES = 'pdf_files';
const PREFS_KEY = 'pagenest_preferences';

export const DEFAULT_PREFERENCES: ReaderPreferences = {
  appTheme: 'system',
  readingMode: 'light',
  readingTheme: 'light',
  orientation: 'portrait',
  eyeComfortEnabled: false,
  eyeComfortIntensity: 45,
  brightness: 1.0,
  keepScreenAwake: true,
  showPageIndicator: true,
  zoomLevel: 1.0,
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        db.createObjectStore(STORE_DOCS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDocument(doc: DocumentItem, fileBuffer?: ArrayBuffer): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([STORE_DOCS, STORE_FILES], 'readwrite');
  const docsStore = tx.objectStore(STORE_DOCS);
  const filesStore = tx.objectStore(STORE_FILES);

  docsStore.put(doc);
  if (fileBuffer) {
    filesStore.put({ id: doc.id, data: fileBuffer });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllDocuments(): Promise<DocumentItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readonly');
    const store = tx.objectStore(STORE_DOCS);
    const request = store.getAll();
    request.onsuccess = () => {
      const items = (request.result as DocumentItem[]) || [];
      // Sort recently read descending
      items.sort((a, b) => (b.lastReadTimestamp || 0) - (a.lastReadTimestamp || 0));
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getDocumentById(id: string): Promise<DocumentItem | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readonly');
    const store = tx.objectStore(STORE_DOCS);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getDocumentFile(id: string): Promise<ArrayBuffer | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, 'readonly');
    const store = tx.objectStore(STORE_FILES);
    const request = store.get(id);
    request.onsuccess = () => {
      const res = request.result;
      resolve(res ? res.data : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateReadingPosition(id: string, pageNumber: number): Promise<void> {
  const doc = await getDocumentById(id);
  if (!doc) return;
  doc.currentPage = pageNumber;
  doc.lastReadTimestamp = Date.now();
  await saveDocument(doc);
}

export async function addBookmark(id: string, pageNumber: number, label?: string): Promise<DocumentItem | null> {
  const doc = await getDocumentById(id);
  if (!doc) return null;
  const existing = doc.bookmarks.find((b) => b.pageNumber === pageNumber);
  if (existing) {
    return doc; // already bookmarked
  }
  const newBookmark = {
    id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    pageNumber,
    label: label || `Page ${pageNumber}`,
    createdAt: Date.now(),
  };
  doc.bookmarks.push(newBookmark);
  doc.bookmarks.sort((a, b) => a.pageNumber - b.pageNumber);
  await saveDocument(doc);
  return doc;
}

export async function removeBookmark(docId: string, bookmarkId: string): Promise<DocumentItem | null> {
  const doc = await getDocumentById(docId);
  if (!doc) return null;
  doc.bookmarks = doc.bookmarks.filter((b) => b.id !== bookmarkId);
  await saveDocument(doc);
  return doc;
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([STORE_DOCS, STORE_FILES], 'readwrite');
  tx.objectStore(STORE_DOCS).delete(id);
  tx.objectStore(STORE_FILES).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function loadPreferences(): ReaderPreferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration mapping for previous versions
      let appTheme = parsed.appTheme || (parsed.theme === 'dark' ? 'dark' : parsed.theme === 'light' ? 'light' : 'system');
      
      // Determine readingMode: exactly two modes 'light' or 'dark'
      let readingMode: 'light' | 'dark' = 'light';
      if (parsed.readingMode === 'dark' || parsed.readingTheme === 'dark' || parsed.colorFilter === 'dark-invert') {
        readingMode = 'dark';
      } else {
        readingMode = 'light';
      }

      // Eye comfort is now an independent toggle feature
      let eyeComfortEnabled = false;
      if (typeof parsed.eyeComfortEnabled === 'boolean') {
        eyeComfortEnabled = parsed.eyeComfortEnabled;
      } else if (parsed.readingTheme === 'eye-comfort' || parsed.readingTheme === 'sepia' || parsed.colorFilter === 'sepia') {
        eyeComfortEnabled = true;
      }

      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        appTheme,
        readingMode,
        readingTheme: readingMode,
        eyeComfortEnabled,
        orientation: parsed.orientation === 'landscape' ? 'landscape' : 'portrait',
        eyeComfortIntensity: typeof parsed.eyeComfortIntensity === 'number' ? Math.min(100, Math.max(0, parsed.eyeComfortIntensity)) : 45,
        brightness: typeof parsed.brightness === 'number' ? parsed.brightness : 1.0,
        keepScreenAwake: typeof parsed.keepScreenAwake === 'boolean' ? parsed.keepScreenAwake : (typeof parsed.keepScreenOn === 'boolean' ? parsed.keepScreenOn : true),
        showPageIndicator: typeof parsed.showPageIndicator === 'boolean' ? parsed.showPageIndicator : true,
      };
    }
  } catch (e) {
    console.warn('Failed to parse preferences from localStorage', e);
  }
  return DEFAULT_PREFERENCES;
}

export function savePreferences(prefs: ReaderPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save preferences to localStorage', e);
  }
}
