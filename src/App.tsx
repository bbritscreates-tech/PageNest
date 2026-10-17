import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Maximize2,
  Code2,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Share2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { DocumentItem, ReaderPreferences } from './types/reader';
import {
  getAllDocuments,
  saveDocument,
  deleteDocument,
  loadPreferences,
  savePreferences,
} from './services/storage';
import { createStarterPdfBuffer } from './services/samplePdfs';
import { loadPdfDocument, generateDocumentThumbnail } from './services/pdfRenderer';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { HomeScreen } from './components/HomeScreen';
import { ReaderScreen } from './components/ReaderScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AndroidCodeViewer } from './components/AndroidCodeViewer';
import { ExternalIntentModal, ExternalIntentPayload } from './components/ExternalIntentModal';

type Screen = 'home' | 'reader' | 'settings' | 'android-source';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [preferences, setPreferences] = useState<ReaderPreferences>(loadPreferences());
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // External Intent simulation & feedback state
  const [isIntentModalOpen, setIsIntentModalOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize DB & Seed Starter PDF if empty
  useEffect(() => {
    async function init() {
      try {
        let docs = await getAllDocuments();
        if (docs.length === 0) {
          // Seed the starter book
          const starterBuffer = createStarterPdfBuffer();
          const loaded = await loadPdfDocument(starterBuffer);
          const thumb = await generateDocumentThumbnail(starterBuffer);

          const starterDoc: DocumentItem = {
            id: 'starter_guide_pdf',
            name: 'PageNest Guide & Classic Meditations.pdf',
            size: starterBuffer.byteLength,
            totalPages: loaded.numPages,
            currentPage: 1,
            lastReadTimestamp: Date.now(),
            bookmarks: [
              {
                id: 'bm_welcome',
                pageNumber: 1,
                label: 'Welcome to PageNest',
                createdAt: Date.now(),
              },
              {
                id: 'bm_meditations',
                pageNumber: 3,
                label: 'Marcus Aurelius - Meditations IV',
                createdAt: Date.now(),
              },
            ],
            thumbnail: thumb,
            isSample: true,
          };

          await saveDocument(starterDoc, starterBuffer);
          loaded.destroy();
          docs = [starterDoc];
        }

        setDocuments(docs);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    }

    init();
  }, []);

  // Update preferences and sync with storage
  const handleUpdatePreferences = (updated: Partial<ReaderPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updated };
      savePreferences(next);
      return next;
    });
  };

  // Determine active app interface theme
  const isDark =
    preferences.appTheme === 'dark' ||
    (preferences.appTheme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Handle importing a user PDF file from the in-app picker
  const handleImportFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const loaded = await loadPdfDocument(buffer);
      const thumb = await generateDocumentThumbnail(buffer);

      const newDoc: DocumentItem = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        name: file.name,
        size: file.size,
        totalPages: loaded.numPages,
        currentPage: 1,
        lastReadTimestamp: Date.now(),
        bookmarks: [],
        thumbnail: thumb,
      };

      await saveDocument(newDoc, buffer);
      loaded.destroy();

      const refreshed = await getAllDocuments();
      setDocuments(refreshed);
      setActiveDoc(newDoc);
      setCurrentScreen('reader');
    } catch (err: any) {
      console.error('Failed to import PDF file:', err);
      setErrorMessage(
        'Could not open document: ' + (err.message || 'File appears damaged or unsupported.')
      );
    }
  };

  /**
   * Handle incoming external PDF intents (ACTION_VIEW, ACTION_SEND)
   * Dispatched from Chrome, Gmail, File Managers, or Share Sheet.
   * Directly opens in reader, caches locally for offline access, and prevents duplicate records.
   */
  const handleTriggerExternalIntent = async (payload: ExternalIntentPayload) => {
    try {
      if (payload.isInvalidOrCorrupt) {
        throw new Error(
          'Cannot open document: The incoming stream is not a valid PDF or read access was denied.'
        );
      }

      // Check PDF header (%PDF-)
      const uint8 = new Uint8Array(payload.buffer);
      const headerStr = String.fromCharCode(...uint8.slice(0, 5));
      if (!headerStr.startsWith('%PDF')) {
        throw new Error(
          'Cannot open document: Selected file does not contain a valid %PDF header.'
        );
      }

      const loaded = await loadPdfDocument(payload.buffer);
      const thumb = await generateDocumentThumbnail(payload.buffer);

      // Deduplication check: if a document with the same name already exists in library,
      // update its content & timestamp while preserving saved bookmarks and reading progress!
      const existing = documents.find(
        (d) => d.name.toLowerCase() === payload.fileName.toLowerCase()
      );

      let targetDoc: DocumentItem;
      if (existing) {
        targetDoc = {
          ...existing,
          lastReadTimestamp: Date.now(),
          totalPages: loaded.numPages,
        };
        await saveDocument(targetDoc, payload.buffer);
      } else {
        targetDoc = {
          id: `intent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: payload.fileName,
          size: payload.buffer.byteLength,
          totalPages: loaded.numPages,
          currentPage: 1,
          lastReadTimestamp: Date.now(),
          bookmarks: [],
          thumbnail: thumb,
        };
        await saveDocument(targetDoc, payload.buffer);
      }

      loaded.destroy();

      const refreshed = await getAllDocuments();
      setDocuments(refreshed);
      setActiveDoc(targetDoc);
      setCurrentScreen('reader');

      setSnackbarMessage(
        `Opened via ${payload.action} from ${payload.sourceApp} (Saved locally for offline access)`
      );
    } catch (err: any) {
      console.error('External intent error:', err);
      setErrorMessage(err.message || 'Failed to open external PDF document.');
    }
  };

  const handleOpenDocument = (doc: DocumentItem) => {
    setActiveDoc(doc);
    setCurrentScreen('reader');
  };

  const handleDeleteDocument = async (id: string) => {
    await deleteDocument(id);
    const refreshed = await getAllDocuments();
    setDocuments(refreshed);
    if (activeDoc?.id === id) {
      setActiveDoc(null);
      setCurrentScreen('home');
    }
  };

  const handleClearLibrary = async () => {
    for (const d of documents) {
      await deleteDocument(d.id);
    }
    // Re-seed starter
    const starterBuffer = createStarterPdfBuffer();
    const loaded = await loadPdfDocument(starterBuffer);
    const thumb = await generateDocumentThumbnail(starterBuffer);

    const starterDoc: DocumentItem = {
      id: 'starter_guide_pdf',
      name: 'PageNest Guide & Classic Meditations.pdf',
      size: starterBuffer.byteLength,
      totalPages: loaded.numPages,
      currentPage: 1,
      lastReadTimestamp: Date.now(),
      bookmarks: [],
      thumbnail: thumb,
      isSample: true,
    };

    await saveDocument(starterDoc, starterBuffer);
    loaded.destroy();
    setDocuments([starterDoc]);
    setActiveDoc(null);
    setCurrentScreen('home');
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="font-semibold text-sm">Launching PageNest...</p>
      </div>
    );
  }

  // Active Screen Renderer
  const renderScreenContent = () => {
    if (currentScreen === 'android-source') {
      return (
        <AndroidCodeViewer
          onBack={() => setCurrentScreen('home')}
          isDark={isDark}
        />
      );
    }

    if (currentScreen === 'reader' && activeDoc) {
      return (
        <ReaderScreen
          document={activeDoc}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onBack={async () => {
            const refreshed = await getAllDocuments();
            setDocuments(refreshed);
            setCurrentScreen('home');
          }}
          onDocUpdated={(updated) => {
            setActiveDoc(updated);
            setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
        />
      );
    }

    if (currentScreen === 'settings') {
      return (
        <SettingsScreen
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onBack={() => setCurrentScreen('home')}
          documentCount={documents.length}
          onClearLibrary={handleClearLibrary}
          isDark={isDark}
        />
      );
    }

    return (
      <HomeScreen
        documents={documents}
        onOpenDocument={handleOpenDocument}
        onImportFile={handleImportFile}
        onDeleteDocument={handleDeleteDocument}
        onOpenSettings={() => setCurrentScreen('settings')}
        onOpenCodeViewer={() => setCurrentScreen('android-source')}
        onOpenIntentModal={() => setIsIntentModalOpen(true)}
        isDark={isDark}
      />
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-900 text-zinc-100 overflow-hidden font-sans">
      {/* AI Studio Environment Control Strip */}
      <div className="h-11 px-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs shrink-0 z-40">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="PageNest" className="w-5 h-5 rounded-md object-cover shadow-2xs" />
          <span className="font-bold text-zinc-100 tracking-tight">Page<span className="text-cyan-400">Nest</span></span>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-400 text-[11px]">Native Android PDF Reader</span>
        </div>

        <div className="flex items-center gap-2">
          {/* External Intent Simulator Quick Button */}
          <button
            onClick={() => setIsIntentModalOpen(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition-colors shadow-2xs"
            title="Simulate external intent: Chrome, Gmail, File Manager, or Share"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Open External PDF (Simulate Intent)</span>
          </button>

          {/* Toggle Phone Frame vs Full View */}
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isPhoneFrame
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Toggle between phone frame and full window"
          >
            {isPhoneFrame ? <Smartphone className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isPhoneFrame ? 'Phone View' : 'Full Canvas'}</span>
          </button>

          {/* Android Kotlin Source Tab */}
          <button
            onClick={() => setCurrentScreen(currentScreen === 'android-source' ? 'home' : 'android-source')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              currentScreen === 'android-source'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Native Project (.zip)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-0 sm:p-4 bg-zinc-900/90 relative">
        {isPhoneFrame && currentScreen !== 'android-source' ? (
          // Android Device Mockup Shell (Adapts to Reader Orientation)
          (() => {
            const isLandscape = currentScreen === 'reader' && preferences.orientation === 'landscape';
            return (
              <div
                className={`relative w-full overflow-hidden shadow-2xl border-0 sm:border-[8px] border-zinc-800 bg-zinc-950 flex flex-col transition-all duration-300 ${
                  isLandscape
                    ? 'max-w-[840px] h-full sm:h-[480px] sm:rounded-[36px]'
                    : 'max-w-[412px] h-full sm:h-[840px] sm:rounded-[42px]'
                }`}
              >
                {/* Camera Punch-hole Notch */}
                <div
                  className={`absolute rounded-full bg-black z-50 border border-zinc-800/80 hidden sm:block pointer-events-none transition-all ${
                    isLandscape
                      ? 'top-1/2 left-2.5 -translate-y-1/2 w-3.5 h-3.5'
                      : 'top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5'
                  }`}
                />

                {/* Android Status Bar */}
                <div className="pt-1 shrink-0 z-40 bg-inherit">
                  <AndroidStatusBar
                    darkText={
                      currentScreen === 'reader'
                        ? preferences.readingMode !== 'dark' && preferences.readingTheme !== 'dark'
                        : !isDark
                    }
                  />
                </div>

                {/* Screen Viewport */}
                <div className="flex-1 overflow-hidden flex flex-col relative">
                  {renderScreenContent()}
                </div>

                {/* Android Gesture Navigation Bar Pill */}
                <div className="h-5 flex items-center justify-center shrink-0 z-40 bg-inherit pointer-events-none">
                  <div className={`rounded-full bg-zinc-500/40 ${isLandscape ? 'w-48 h-1' : 'w-32 h-1'}`} />
                </div>
              </div>
            );
          })()
        ) : (
          // Full Responsive Canvas View
          <div className="w-full h-full max-w-6xl mx-auto rounded-none sm:rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-950 flex flex-col">
            {renderScreenContent()}
          </div>
        )}

        {/* Success / Info Snackbar Notification */}
        {snackbarMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-zinc-100 shadow-2xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{snackbarMessage}</span>
            </div>
            <button
              onClick={() => setSnackbarMessage(null)}
              className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Snackbar Notification */}
        {errorMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-3 rounded-2xl bg-red-950 border border-red-700/80 text-red-100 shadow-2xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-red-900/50 rounded-lg text-red-300 hover:text-red-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* External Intent Simulator Modal */}
      <ExternalIntentModal
        isOpen={isIntentModalOpen}
        onClose={() => setIsIntentModalOpen(false)}
        onTriggerIntent={handleTriggerExternalIntent}
        isDark={isDark}
      />
    </div>
  );
}
