import React, { useState } from 'react';
import { Bookmark as BookmarkIcon, Plus, Trash2, X, ExternalLink } from 'lucide-react';
import { Bookmark } from '../types/reader';

interface BookmarksSheetProps {
  bookmarks: Bookmark[];
  currentPage: number;
  onSelectBookmark: (page: number) => void;
  onAddBookmark: (page: number, label?: string) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onClose: () => void;
  isDark?: boolean;
}

export const BookmarksSheet: React.FC<BookmarksSheetProps> = ({
  bookmarks,
  currentPage,
  onSelectBookmark,
  onAddBookmark,
  onDeleteBookmark,
  onClose,
  isDark = false,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const isCurrentPageBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBookmark(currentPage, newLabel.trim() || undefined);
    setNewLabel('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 w-full max-w-lg mx-auto rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t transition-colors ${
          isDark
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto my-3 shrink-0" />

        {/* Header */}
        <div className="px-6 py-2 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-base">Bookmarks ({bookmarks.length})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Current Page Button */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          {!showAddForm ? (
            <button
              onClick={() => {
                if (isCurrentPageBookmarked) {
                  const existing = bookmarks.find((b) => b.pageNumber === currentPage);
                  if (existing) onDeleteBookmark(existing.id);
                } else {
                  setShowAddForm(true);
                }
              }}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                isCurrentPageBookmarked
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100'
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 hover:bg-blue-100'
              }`}
            >
              {isCurrentPageBookmarked ? (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Remove Current Page ({currentPage}) Bookmark</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Bookmark Current Page ({currentPage})</span>
                </>
              )}
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Optional bookmark note (e.g. Chapter summary)..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl border ${
                    isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  Save Bookmark (Page {currentPage})
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bookmarks List */}
        <div className="p-4 overflow-y-auto max-h-96 space-y-2">
          {bookmarks.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <BookmarkIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No bookmarks yet</p>
              <p className="text-xs text-zinc-500 mt-1">Tap the bookmark button in the top bar to save pages.</p>
            </div>
          ) : (
            bookmarks.map((b) => (
              <div
                key={b.id}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 border transition-all ${
                  b.pageNumber === currentPage
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : isDark
                    ? 'border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800'
                    : 'border-zinc-100 bg-zinc-50/80 hover:bg-zinc-100'
                }`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectBookmark(b.pageNumber)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-blue-600 dark:text-blue-400 font-mono">
                      Page {b.pageNumber}
                    </span>
                    {b.pageNumber === currentPage && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-sm">
                        Current
                      </span>
                    )}
                  </div>
                  {b.label && b.label !== `Page ${b.pageNumber}` && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 font-medium line-clamp-1">
                      {b.label}
                    </p>
                  )}
                  <span className="text-[11px] text-zinc-400">
                    Added {new Date(b.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectBookmark(b.pageNumber)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    title="Jump to page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteBookmark(b.id)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
