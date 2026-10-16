import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  ChevronUp,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  Sliders,
  X,
  Smartphone,
  BookOpen,
  ListFilter,
  Check,
} from 'lucide-react';
import { DocumentItem, ReaderPreferences, PdfReadingMode, ReaderOrientation } from '../types/reader';
import { loadPdfDocument, LoadedPdfDoc, renderPageToCanvas } from '../services/pdfRenderer';
import { getDocumentFile, updateReadingPosition, addBookmark, removeBookmark } from '../services/storage';
import { JumpToPageDialog } from './JumpToPageDialog';
import { BookmarksSheet } from './BookmarksSheet';

interface ReaderScreenProps {
  document: DocumentItem;
  preferences: ReaderPreferences;
  onUpdatePreferences: (prefs: Partial<ReaderPreferences>) => void;
  onBack: () => void;
  onDocUpdated: (updatedDoc: DocumentItem) => void;
}

export const ReaderScreen: React.FC<ReaderScreenProps> = ({
  document: initialDoc,
  preferences,
  onUpdatePreferences,
  onBack,
  onDocUpdated,
}) => {
  const [doc, setDoc] = useState<DocumentItem>(initialDoc);
  const [pdfDoc, setPdfDoc] = useState<LoadedPdfDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(doc.currentPage || 1);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [showJumpDialog, setShowJumpDialog] = useState<boolean>(false);
  const [showBookmarksSheet, setShowBookmarksSheet] = useState<boolean>(false);
  const [showBrightnessPopover, setShowBrightnessPopover] = useState<boolean>(false);
  const [showEyeComfortPanel, setShowEyeComfortPanel] = useState<boolean>(false);

  // Active reading mode: strictly 'light' or 'dark'
  const activeReadingMode: PdfReadingMode =
    preferences.readingMode === 'dark' || preferences.readingTheme === 'dark' ? 'dark' : 'light';
  const isEyeComfortActive = !!preferences.eyeComfortEnabled;
  const eyeComfortIntensity = preferences.eyeComfortIntensity ?? 45;
  const brightness = preferences.brightness ?? 1.0;

  // Vertical scroll container & rendered pages tracking
  const verticalContainerRef = useRef<HTMLDivElement | null>(null);
  const pageCanvasRefs = useRef<{ [pageIndex: number]: HTMLCanvasElement | null }>({});
  const renderedPagesRef = useRef<{ [pageIndex: number]: boolean }>({});

  // Scroll state & click detection
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<any>(null);

  // Screen Wake Lock API reference
  const wakeLockRef = useRef<any>(null);

  // Request & release Screen Wake Lock
  useEffect(() => {
    let released = false;
    async function requestWakeLock() {
      if ('wakeLock' in navigator && preferences.keepScreenAwake) {
        try {
          const lock = await (navigator as any).wakeLock.request('screen');
          if (!released) {
            wakeLockRef.current = lock;
          } else {
            lock.release();
          }
        } catch (err) {
          console.debug('WakeLock not active or unsupported:', err);
        }
      }
    }

    requestWakeLock();

    return () => {
      released = true;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [preferences.keepScreenAwake]);

  // Load PDF file from IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setLoadError(null);
        const buffer = await getDocumentFile(doc.id);
        if (!buffer) {
          throw new Error('Document data could not be found in local storage.');
        }

        const loaded = await loadPdfDocument(buffer);
        if (!isMounted) {
          loaded.destroy();
          return;
        }

        setPdfDoc(loaded);
        if (loaded.numPages !== doc.totalPages) {
          const updated = { ...doc, totalPages: loaded.numPages };
          setDoc(updated);
          onDocUpdated(updated);
        }
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        if (isMounted) {
          setLoadError(err.message || 'Unable to open PDF document. The file may be damaged or unsupported.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
      if (pdfDoc) pdfDoc.destroy();
    };
  }, [doc.id]);

  // Scroll to current page on mount or when page changes from jump/nav
  const scrollToPage = useCallback((targetPage: number, smooth: boolean = true) => {
    if (!verticalContainerRef.current) return;
    const pageEl = verticalContainerRef.current.querySelector(`[data-page="${targetPage}"]`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    }
  }, []);

  // Initial scroll to saved page position
  useEffect(() => {
    if (!loading && pdfDoc) {
      setTimeout(() => {
        scrollToPage(doc.currentPage || 1, false);
      }, 100);
    }
  }, [loading, pdfDoc, doc.id, scrollToPage]);

  // Save reading position when page changes
  const handlePageChange = useCallback(
    async (newPage: number, triggerScroll: boolean = true) => {
      if (!pdfDoc) return;
      const clamped = Math.min(Math.max(newPage, 1), pdfDoc.numPages);
      setCurrentPage(clamped);
      setDoc((prev) => ({ ...prev, currentPage: clamped, lastReadTimestamp: Date.now() }));
      await updateReadingPosition(doc.id, clamped);
      if (triggerScroll) {
        scrollToPage(clamped, true);
      }
    },
    [doc.id, pdfDoc, scrollToPage]
  );

  // Recalculate page render widths on orientation / resize
  const renderVisiblePages = useCallback(async () => {
    if (!pdfDoc || !verticalContainerRef.current) return;
    const containerWidth = verticalContainerRef.current.clientWidth || window.innerWidth;
    // In landscape or portrait, fit comfortable reading width
    const targetWidth = Math.min(containerWidth - 32, preferences.orientation === 'landscape' ? 1080 : 800) * (preferences.zoomLevel || 1.0);

    const wrappers = verticalContainerRef.current.querySelectorAll('.vertical-page-wrapper');
    wrappers.forEach(async (wrapper) => {
      const rect = wrapper.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight + 400 && rect.bottom > -400;
      if (isVisible) {
        const pageNum = parseInt(wrapper.getAttribute('data-page') || '1', 10);
        const canvas = pageCanvasRefs.current[pageNum];
        if (canvas) {
          try {
            const page = await pdfDoc.getPage(pageNum);
            await renderPageToCanvas(page, canvas, 1.5 * (preferences.zoomLevel || 1.0), targetWidth);
          } catch (e) {
            console.warn(`Error rendering page ${pageNum}`, e);
          }
        }
      }
    });
  }, [pdfDoc, preferences.orientation, preferences.zoomLevel]);

  // Handle Orientation Changes: Re-render with new dimensions while preserving current page
  useEffect(() => {
    renderedPagesRef.current = {};
    const timer = setTimeout(() => {
      renderVisiblePages();
      scrollToPage(currentPage, false);
    }, 150);
    return () => clearTimeout(timer);
  }, [preferences.orientation, renderVisiblePages, scrollToPage, currentPage]);

  // Lazy Render Pages on Scroll using IntersectionObserver
  useEffect(() => {
    if (!pdfDoc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page') || '1', 10);
            if (!renderedPagesRef.current[pageNum]) {
              renderedPagesRef.current[pageNum] = true;
              const canvas = pageCanvasRefs.current[pageNum];
              if (canvas && verticalContainerRef.current) {
                try {
                  const page = await pdfDoc.getPage(pageNum);
                  const containerWidth = verticalContainerRef.current.clientWidth || window.innerWidth;
                  const targetWidth = Math.min(containerWidth - 32, preferences.orientation === 'landscape' ? 1080 : 800) * (preferences.zoomLevel || 1.0);
                  await renderPageToCanvas(page, canvas, 1.5 * (preferences.zoomLevel || 1.0), targetWidth);
                } catch (e) {
                  console.warn(`Error rendering page ${pageNum}`, e);
                }
              }
            }
          }
        });
      },
      { root: verticalContainerRef.current, rootMargin: '400px 0px', threshold: 0.05 }
    );

    // Scroll spy for updating current page number indicator during continuous vertical scroll
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page') || '1', 10);
            setCurrentPage(pageNum);
            updateReadingPosition(doc.id, pageNum);
          }
        });
      },
      { root: verticalContainerRef.current, threshold: 0.4 }
    );

    const wrappers = document.querySelectorAll('.vertical-page-wrapper');
    wrappers.forEach((w) => {
      observer.observe(w);
      scrollObserver.observe(w);
    });

    return () => {
      observer.disconnect();
      scrollObserver.disconnect();
    };
  }, [pdfDoc, preferences.orientation, preferences.zoomLevel, doc.id]);

  // Track scrolling to prevent accidental tap toggle when lifting finger
  const handleScroll = () => {
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (currentPage < (pdfDoc?.numPages || 1)) handlePageChange(currentPage + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (currentPage > 1) handlePageChange(currentPage - 1);
      } else if (e.key === 'Escape') {
        setControlsVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pdfDoc, handlePageChange]);

  // Bookmark toggle
  const handleToggleBookmark = async () => {
    const existing = doc.bookmarks.find((b) => b.pageNumber === currentPage);
    if (existing) {
      const updated = await removeBookmark(doc.id, existing.id);
      if (updated) {
        setDoc(updated);
        onDocUpdated(updated);
      }
    } else {
      const updated = await addBookmark(doc.id, currentPage);
      if (updated) {
        setDoc(updated);
        onDocUpdated(updated);
      }
    }
  };

  const isCurrentPageBookmarked = doc.bookmarks.some((b) => b.pageNumber === currentPage);

  // Toggle Screen Orientation: Portrait <-> Landscape
  const handleToggleOrientation = () => {
    const nextOrientation: ReaderOrientation = preferences.orientation === 'portrait' ? 'landscape' : 'portrait';
    onUpdatePreferences({ orientation: nextOrientation });
  };

  // Toggle PDF Reading Mode: Light <-> Dark (only 2 modes!)
  const handleToggleReadingMode = () => {
    const nextMode: PdfReadingMode = activeReadingMode === 'light' ? 'dark' : 'light';
    onUpdatePreferences({
      readingMode: nextMode,
      readingTheme: nextMode,
    });
  };

  // Toggle Eye Comfort (independent feature that works in both Light and Dark mode)
  const handleToggleEyeComfort = (enabled?: boolean) => {
    const nextState = enabled !== undefined ? enabled : !isEyeComfortActive;
    onUpdatePreferences({ eyeComfortEnabled: nextState });
  };

  // Dynamic Canvas Filter for PDF Rendering
  // Preserves text crispness and handles scanned PDFs/diagrams cleanly
  const getCanvasFilter = () => {
    const intensityFactor = (eyeComfortIntensity / 100);

    if (activeReadingMode === 'dark') {
      // Dark Mode: Invert contrast, carefully preserves line diagrams and charts
      if (isEyeComfortActive && intensityFactor > 0) {
        // Warm tone applied over inverted dark mode
        const warmSepia = Math.round(intensityFactor * 35);
        return `invert(90%) hue-rotate(180deg) contrast(95%) brightness(95%) sepia(${warmSepia}%)`;
      }
      return 'invert(90%) hue-rotate(180deg) contrast(95%) brightness(95%)';
    } else {
      // Light Mode
      if (isEyeComfortActive && intensityFactor > 0) {
        // Soft amber/sepia tint warming the page
        const warmSepia = Math.round(intensityFactor * 45);
        const sat = Math.round(100 - intensityFactor * 10);
        return `sepia(${warmSepia}%) saturate(${sat}%) contrast(97%) brightness(98%)`;
      }
      return 'none';
    }
  };

  // Background styling for the main container
  const getViewContainerClasses = () => {
    if (activeReadingMode === 'dark') {
      return isEyeComfortActive && eyeComfortIntensity > 30
        ? 'bg-[#151412] text-zinc-100'
        : 'bg-[#121316] text-zinc-100';
    } else {
      return isEyeComfortActive && eyeComfortIntensity > 30
        ? 'bg-[#FAF6EC] text-[#2C241D]'
        : 'bg-[#F4F5F7] text-zinc-900';
    }
  };

  // Chrome bars background
  const getChromeBarClasses = () => {
    if (activeReadingMode === 'dark') {
      return 'bg-[#181A20]/95 border-zinc-800 text-zinc-100';
    } else {
      return 'bg-white/95 border-zinc-200 text-zinc-900';
    }
  };

  if (loading) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-8 ${getViewContainerClasses()}`}>
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="font-semibold text-base">Opening Document...</p>
        <p className="text-xs text-zinc-500 mt-1">Rendering local pages offline with zero network latency</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-8 text-center ${getViewContainerClasses()}`}>
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold mb-2">Unable to Open Document</h3>
        <p className="text-sm text-zinc-500 max-w-md mb-6">{loadError}</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const totalPages = pdfDoc?.numPages || doc.totalPages || 1;

  return (
    <div
      className={`relative h-full w-full select-none overflow-hidden flex flex-col transition-colors duration-200 ${getViewContainerClasses()}`}
    >
      {/* Dimming Overlay for In-App Reading Brightness (independent from device brightness) */}
      {brightness < 1.0 && (
        <div
          className="absolute inset-0 pointer-events-none z-20 bg-black transition-opacity"
          style={{ opacity: (1 - brightness) * 0.85 }}
          aria-hidden="true"
        />
      )}

      {/* Warm Blue-Light Filter Overlay for Eye Comfort (Active in both Light Mode & Dark Mode) */}
      {isEyeComfortActive && eyeComfortIntensity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-150"
          style={{
            backgroundColor: activeReadingMode === 'dark' ? '#F59E0B' : '#D97706',
            opacity: activeReadingMode === 'dark'
              ? (eyeComfortIntensity / 100) * 0.14
              : (eyeComfortIntensity / 100) * 0.22,
            mixBlendMode: activeReadingMode === 'dark' ? 'screen' : 'multiply',
          }}
          aria-hidden="true"
        />
      )}

      {/* 1. TOP READING TOOLBAR (IMMERSIVE HIDE/SHOW ON TAP) */}
      <header
        className={`absolute top-0 left-0 right-0 z-30 transition-transform duration-200 ease-out backdrop-blur-md px-3 py-2.5 flex items-center justify-between gap-2 border-b shadow-xs ${
          controlsVisible ? 'translate-y-0' : '-translate-y-full'
        } ${getChromeBarClasses()}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-current shrink-0"
            aria-label="Back to Library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold truncate max-w-[130px] sm:max-w-xs md:max-w-md">
              {doc.name}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] opacity-75 font-mono">
              <span>p. {currentPage}/{totalPages}</span>
              <span>·</span>
              <span className="uppercase text-[9px]">{activeReadingMode}</span>
              {isEyeComfortActive && (
                <>
                  <span>·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Eye Comfort</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Essential Toolbar Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Bookmark Toggle */}
          <button
            onClick={handleToggleBookmark}
            className={`p-2 rounded-xl active:scale-95 transition-all ${
              isCurrentPageBookmarked
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-current'
            }`}
            title={isCurrentPageBookmarked ? 'Bookmarked' : 'Add bookmark'}
          >
            {isCurrentPageBookmarked ? (
              <BookmarkCheck className="w-4 h-4 fill-current" />
            ) : (
              <BookmarkIcon className="w-4 h-4" />
            )}
          </button>

          {/* Bookmarks List Sheet Trigger */}
          <button
            onClick={() => setShowBookmarksSheet(true)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-current relative"
            title="Bookmarks"
          >
            <ListFilter className="w-4 h-4" />
            {doc.bookmarks.length > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-blue-600 text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                {doc.bookmarks.length}
              </span>
            )}
          </button>

          {/* SCREEN ORIENTATION CONTROL: PORTRAIT / LANDSCAPE */}
          <button
            onClick={handleToggleOrientation}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl active:scale-95 transition-all flex items-center gap-1 border text-xs font-medium ${
              preferences.orientation === 'landscape'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'hover:bg-black/5 dark:hover:bg-white/10 border-black/10 dark:border-white/10 text-current'
            }`}
            title={`Orientation: ${preferences.orientation === 'portrait' ? 'Portrait (Click for Landscape)' : 'Landscape (Click for Portrait)'}`}
          >
            <Smartphone
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                preferences.orientation === 'landscape' ? 'rotate-90' : 'rotate-0'
              }`}
            />
            <span className="hidden sm:inline font-mono text-[10px] uppercase">
              {preferences.orientation}
            </span>
          </button>

          {/* DEDICATED EYE COMFORT BUTTON: SEPARATE FROM READING MODE */}
          <button
            onClick={() => setShowEyeComfortPanel(true)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 border text-xs font-medium ${
              isEyeComfortActive
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-xs ring-1 ring-amber-500/30'
                : 'hover:bg-black/5 dark:hover:bg-white/10 border-black/10 dark:border-white/10 text-current opacity-85'
            }`}
            title={`Eye Comfort: ${isEyeComfortActive ? `Enabled (${eyeComfortIntensity}%)` : 'Disabled (Click to configure)'}`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isEyeComfortActive ? 'text-amber-500 animate-pulse' : 'text-current'}`} />
            <span className="hidden md:inline font-medium text-[11px]">
              Eye Comfort {isEyeComfortActive ? `${eyeComfortIntensity}%` : ''}
            </span>
          </button>

          {/* TWO PDF READING MODES ONLY: LIGHT MODE <-> DARK MODE SWITCHER */}
          <button
            onClick={handleToggleReadingMode}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 border text-xs font-medium ${
              activeReadingMode === 'dark'
                ? 'bg-zinc-800 text-amber-300 border-zinc-700 shadow-xs'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 shadow-xs'
            }`}
            title={`PDF Reading Mode: ${activeReadingMode === 'light' ? 'Light Mode (Click for Dark)' : 'Dark Mode (Click for Light)'}`}
          >
            {activeReadingMode === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-300 fill-amber-300/40" />
                <span className="hidden sm:inline font-mono text-[10px] uppercase">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600 fill-amber-600/30" />
                <span className="hidden sm:inline font-mono text-[10px] uppercase">Light</span>
              </>
            )}
          </button>

          {/* In-App Reading Brightness Toggle */}
          <button
            onClick={() => setShowBrightnessPopover(!showBrightnessPopover)}
            className={`p-2 rounded-xl active:scale-95 transition-all ${
              showBrightnessPopover
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-current'
            }`}
            title="Reading Brightness"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. BRIGHTNESS POPOVER BAR */}
      {showBrightnessPopover && (
        <div
          className={`absolute top-14 right-3 z-40 w-72 rounded-3xl p-4 shadow-xl border backdrop-blur-md transition-all ${getChromeBarClasses()}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Reading Brightness</span>
            <span className="text-xs font-mono font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {Math.round(brightness * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Sun className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="range"
              min={0.15}
              max={1.0}
              step={0.05}
              value={brightness}
              onChange={(e) => onUpdatePreferences({ brightness: parseFloat(e.target.value) })}
              className="flex-1 accent-blue-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none"
            />
            <Sun className="w-5 h-5 text-amber-500 shrink-0" />
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Dims reading viewport for low-light environments without changing device-wide system settings.
          </p>
        </div>
      )}

      {/* 3. MOBILE-FRIENDLY EYE COMFORT PANEL / MODAL */}
      {showEyeComfortPanel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowEyeComfortPanel(false)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl border transition-all ${
              activeReadingMode === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'bg-white border-zinc-200 text-zinc-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-black/5 dark:border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Eye Comfort</h3>
                  <span className="text-[10px] text-zinc-500">Blue-light reduction filter</span>
                </div>
              </div>
              <button
                onClick={() => setShowEyeComfortPanel(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation */}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Adjusts the warmth of the reading display.
            </p>

            {/* Enable Eye Comfort Toggle */}
            <div
              onClick={() => handleToggleEyeComfort()}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors mb-4 ${
                isEyeComfortActive
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40'
              }`}
            >
              <div>
                <span className="font-semibold text-xs block text-zinc-900 dark:text-zinc-100">
                  Enable Eye Comfort
                </span>
                <span className="text-[10px] text-zinc-500">
                  {isEyeComfortActive ? 'Filter active on both Light & Dark modes' : 'Filter turned off'}
                </span>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isEyeComfortActive ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
                aria-pressed={isEyeComfortActive}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isEyeComfortActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Blue-light filter intensity Slider */}
            <div className={`space-y-3 transition-opacity ${!isEyeComfortActive ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Blue-light filter intensity
                </span>
                <span className="font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400 text-sm">
                  {eyeComfortIntensity}%
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={eyeComfortIntensity}
                onChange={(e) => onUpdatePreferences({ eyeComfortIntensity: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none"
              />

              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>0% (Neutral)</span>
                <span>50% (Balanced)</span>
                <span>100% (Warm Amber)</span>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: '0%', val: 0 },
                  { label: '25%', val: 25 },
                  { label: '50%', val: 50 },
                  { label: '75%', val: 75 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    onClick={() => onUpdatePreferences({ eyeComfortIntensity: preset.val })}
                    className={`py-1 text-[11px] font-mono rounded-lg border transition-all ${
                      eyeComfortIntensity === preset.val
                        ? 'bg-amber-500 text-white border-amber-600 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Live Preview Swatch */}
              <div
                className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                  activeReadingMode === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
                }`}
                style={{
                  backgroundColor: activeReadingMode === 'dark'
                    ? (isEyeComfortActive ? `rgba(40, 32, 22, ${0.8 + (eyeComfortIntensity / 100) * 0.2})` : '#181A20')
                    : (isEyeComfortActive ? `rgba(255, ${248 - (eyeComfortIntensity * 0.4)}, ${235 - (eyeComfortIntensity * 0.7)}, 1)` : '#FFFFFF'),
                  color: activeReadingMode === 'dark'
                    ? (isEyeComfortActive ? '#FBE5C8' : '#EDEDED')
                    : (isEyeComfortActive ? '#382B1E' : '#111827'),
                }}
              >
                <span>Live sample ({activeReadingMode.toUpperCase()} MODE)</span>
                <span className="font-mono font-semibold">
                  Aa Bb {isEyeComfortActive ? `+${eyeComfortIntensity}% warmth` : 'Clean'}
                </span>
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={() => setShowEyeComfortPanel(false)}
              className="w-full mt-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN READING CANVAS AREA (CONTINUOUS VERTICAL DOCUMENT SCROLLING IN BOTH PORTRAIT & LANDSCAPE) */}
      <div
        ref={verticalContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full h-full overflow-y-auto px-2 sm:px-6 py-16 space-y-6 flex flex-col items-center cursor-pointer"
        onClick={() => {
          if (!isScrollingRef.current) {
            setControlsVisible((prev) => !prev);
            setShowBrightnessPopover(false);
          }
        }}
      >
        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          return (
            <div
              key={pageNum}
              data-page={pageNum}
              className="vertical-page-wrapper w-full flex flex-col items-center"
            >
              <div
                className={`shadow-md rounded-md overflow-hidden border border-black/5 dark:border-white/5 transition-all duration-150 ${
                  activeReadingMode === 'dark' ? 'bg-[#181A20]' : 'bg-white'
                }`}
                style={{ filter: getCanvasFilter() }}
              >
                <canvas
                  ref={(el) => {
                    pageCanvasRefs.current[pageNum] = el;
                  }}
                  className="block max-w-full"
                />
              </div>
              {preferences.showPageIndicator && (
                <span className="text-[11px] text-zinc-400 mt-2 font-mono tabular-nums">
                  Page {pageNum} of {totalPages}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. BOTTOM NAVIGATION BAR & SCRUBBER (IMMERSIVE HIDE/SHOW ON TAP) */}
      <footer
        className={`absolute bottom-0 left-0 right-0 z-30 transition-transform duration-200 ease-out backdrop-blur-md px-4 py-3 flex flex-col gap-2 border-t shadow-lg ${
          controlsVisible ? 'translate-y-0' : 'translate-y-full'
        } ${getChromeBarClasses()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation buttons and Jump To Page trigger */}
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto w-full">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`p-2 rounded-full border transition-all ${
              currentPage <= 1
                ? 'opacity-30 cursor-not-allowed border-transparent'
                : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
            }`}
            title="Previous page"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* Jump to page pill */}
          {preferences.showPageIndicator ? (
            <button
              onClick={() => setShowJumpDialog(true)}
              className="px-4 py-1.5 rounded-full font-mono text-xs font-semibold tracking-wide bg-blue-600 text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5"
              title="Click to jump to a specific page"
            >
              <span>Page {currentPage} of {totalPages}</span>
              <span className="text-[10px] opacity-75">· Jump</span>
            </button>
          ) : (
            <button
              onClick={() => setShowJumpDialog(true)}
              className="px-3 py-1 rounded-full text-xs font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-current"
            >
              Jump to Page
            </button>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`p-2 rounded-full border transition-all ${
              currentPage >= totalPages
                ? 'opacity-30 cursor-not-allowed border-transparent'
                : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
            }`}
            title="Next page"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Page Scrubber slider */}
        <div className="max-w-lg mx-auto w-full flex items-center gap-3 px-2">
          <span className="text-[11px] font-mono text-zinc-400">1</span>
          <input
            type="range"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => handlePageChange(parseInt(e.target.value, 10))}
            className="flex-1 accent-blue-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none"
          />
          <span className="text-[11px] font-mono text-zinc-400">{totalPages}</span>
        </div>
      </footer>

      {/* Jump to Page Dialog */}
      {showJumpDialog && (
        <JumpToPageDialog
          currentPage={currentPage}
          totalPages={totalPages}
          onJump={(target) => {
            handlePageChange(target);
            setShowJumpDialog(false);
          }}
          onClose={() => setShowJumpDialog(false)}
          isDark={activeReadingMode === 'dark'}
        />
      )}

      {/* Bookmarks Sheet */}
      {showBookmarksSheet && (
        <BookmarksSheet
          bookmarks={doc.bookmarks}
          currentPage={currentPage}
          onSelectBookmark={(page) => {
            handlePageChange(page);
            setShowBookmarksSheet(false);
          }}
          onAddBookmark={async (page, label) => {
            const updated = await addBookmark(doc.id, page, label);
            if (updated) {
              setDoc(updated);
              onDocUpdated(updated);
            }
          }}
          onDeleteBookmark={async (bmId) => {
            const updated = await removeBookmark(doc.id, bmId);
            if (updated) {
              setDoc(updated);
              onDocUpdated(updated);
            }
          }}
          onClose={() => setShowBookmarksSheet(false)}
          isDark={activeReadingMode === 'dark'}
        />
      )}
    </div>
  );
};
