import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Settings,
  Search,
  Trash2,
  Clock,
  Bookmark,
  FileText,
  UploadCloud,
  ChevronRight,
  Code2,
  Layers,
  Sparkles,
  Share2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { DocumentItem } from '../types/reader';

interface HomeScreenProps {
  documents: DocumentItem[];
  onOpenDocument: (doc: DocumentItem) => void;
  onImportFile: (file: File) => void;
  onDeleteDocument: (id: string) => void;
  onOpenSettings: () => void;
  onOpenCodeViewer: () => void;
  onOpenIntentModal?: () => void;
  isDark?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  documents,
  onOpenDocument,
  onImportFile,
  onDeleteDocument,
  onOpenSettings,
  onOpenCodeViewer,
  onOpenIntentModal,
  isDark = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentlyRead = documents.length > 0 ? documents[0] : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        onImportFile(file);
      }
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        onImportFile(file);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`h-full flex flex-col overflow-y-auto select-none transition-colors ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-[#F9FAFB] text-zinc-900'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden system file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top App Bar (Material 3 style) */}
      <header
        className={`sticky top-0 z-20 px-4 sm:px-5 py-3.5 flex items-center justify-between border-b transition-colors backdrop-blur-md ${
          isDark ? 'bg-zinc-950/85 border-zinc-800/80' : 'bg-white/85 border-zinc-200/80'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-none">PageNest</h1>
            <span className="text-[11px] text-zinc-500 font-medium tracking-tight">Offline Document Reader</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* External Intent Simulator Trigger */}
          {onOpenIntentModal && (
            <button
              onClick={onOpenIntentModal}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
                isDark
                  ? 'border-blue-900/40 bg-blue-950/30 text-blue-400 hover:bg-blue-900/40'
                  : 'border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100'
              }`}
              title="Simulate opening PDF from Chrome, Gmail, or Share sheet"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold">Simulate Intent</span>
            </button>
          )}

          <button
            onClick={onOpenCodeViewer}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isDark
                ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300'
                : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
            }`}
            title="Inspect Android Kotlin project & export zip"
          >
            <Code2 className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Android Source</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-5">
        {/* Drag and drop banner indicator */}
        {isDragging && (
          <div className="p-8 border-2 border-dashed border-blue-500 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 text-center animate-pulse">
            <UploadCloud className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="font-semibold text-blue-600 dark:text-blue-400">Drop PDF here to import immediately</p>
          </div>
        )}

        {/* External Intent Ready Banner */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
            isDark
              ? 'bg-gradient-to-r from-blue-950/30 to-indigo-950/20 border-blue-900/40'
              : 'bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border-blue-200/80'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs tracking-tight">Android PDF Reader Registered</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  ACTION_VIEW &amp; SEND
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                Handles Chrome downloads, email attachments, and shared PDFs directly in the reader.
              </p>
            </div>
          </div>

          {onOpenIntentModal && (
            <button
              onClick={onOpenIntentModal}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <span>Test External Intent</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Recently Read Hero Card */}
        {recentlyRead && (
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Recently Read</span>
              <span className="text-xs text-zinc-400 font-medium">Auto-resumes where you left off</span>
            </div>

            <div
              onClick={() => onOpenDocument(recentlyRead)}
              className={`p-5 rounded-3xl border shadow-xs hover:shadow-md cursor-pointer transition-all active:scale-[0.99] flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between ${
                isDark
                  ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                  : 'bg-white border-zinc-200/80 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Document Thumbnail or Icon */}
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-black/5 dark:border-white/5 flex items-center justify-center shadow-xs">
                  {recentlyRead.thumbnail ? (
                    <img
                      src={recentlyRead.thumbnail}
                      alt={recentlyRead.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-zinc-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-base tracking-tight truncate mb-1">
                    {recentlyRead.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-mono tabular-nums font-medium text-blue-600 dark:text-blue-400">
                      Page {recentlyRead.currentPage} of {recentlyRead.totalPages}
                    </span>
                    <span>·</span>
                    <span>
                      {Math.round(
                        ((recentlyRead.currentPage || 1) / (recentlyRead.totalPages || 1)) * 100
                      )}
                      % read
                    </span>
                    <span>·</span>
                    <span>{formatDate(recentlyRead.lastReadTimestamp)}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-48 sm:w-64 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            5,
                            Math.round(
                              ((recentlyRead.currentPage || 1) / (recentlyRead.totalPages || 1)) * 100
                            )
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDocument(recentlyRead);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0 transition-all"
              >
                <span>Resume Reading</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* Library Section Header & Actions */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg tracking-tight">Your Library</h2>
              <span className="text-xs text-zinc-400 font-mono font-medium">
                ({filteredDocs.length} {filteredDocs.length === 1 ? 'document' : 'documents'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500'
                      : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              {/* Import PDF Trigger Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Import PDF</span>
              </button>
            </div>
          </div>

          {/* Documents Grid / List */}
          {filteredDocs.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border transition-colors ${
                isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white border-zinc-200/80'
              }`}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base mb-1">
                {searchQuery ? 'No documents match your search' : 'Your Library is Empty'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                {searchQuery
                  ? 'Try searching with another keyword.'
                  : 'Import any PDF stored on your device or open via external app intents.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-xs hover:bg-blue-700 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Select PDF from Device</span>
                </button>
                {onOpenIntentModal && (
                  <button
                    onClick={onOpenIntentModal}
                    className="px-4 py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5 font-medium text-xs inline-flex items-center gap-1.5 transition-all"
                  >
                    <Share2 className="w-4 h-4 text-blue-500" />
                    <span>Simulate Incoming Intent</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredDocs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onOpenDocument(item)}
                  className={`p-4 rounded-2xl border shadow-2xs hover:shadow-sm cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-zinc-900/60 border-zinc-800/90 hover:border-zinc-700'
                      : 'bg-white border-zinc-200/80 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-black/5 dark:border-white/5 flex items-center justify-center shadow-2xs">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm truncate leading-snug">{item.name}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-1">
                        <span className="font-mono tabular-nums">
                          Page {item.currentPage} / {item.totalPages}
                        </span>
                        <span>·</span>
                        <span>{formatFileSize(item.size)}</span>
                      </div>
                      {item.bookmarks.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
                          <Bookmark className="w-3 h-3 fill-current" />
                          <span>{item.bookmarks.length} saved</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove "${item.name}" from library?`)) {
                          onDeleteDocument(item.id);
                        }
                      }}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Offline & Privacy Assurance Badge */}
        <section
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
            isDark ? 'bg-zinc-900/30 border-zinc-800/60 text-zinc-400' : 'bg-zinc-50 border-zinc-200/60 text-zinc-600'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
              100% Offline &amp; Private Document Access
            </span>
            <span>
              External documents opened via ACTION_VIEW and ACTION_SEND are cached securely in private device storage. No network transmission, ads, or telemetry.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
};
