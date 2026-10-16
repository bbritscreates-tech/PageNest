import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

interface JumpToPageDialogProps {
  currentPage: number;
  totalPages: number;
  onJump: (page: number) => void;
  onClose: () => void;
  isDark?: boolean;
}

export const JumpToPageDialog: React.FC<JumpToPageDialogProps> = ({
  currentPage,
  totalPages,
  onJump,
  onClose,
  isDark = false,
}) => {
  const [targetPage, setTargetPage] = useState<number>(currentPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetPage >= 1 && targetPage <= totalPages) {
      onJump(targetPage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-colors ${
          isDark
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold tracking-tight">Jump to Page</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Target page (1 – {totalPages})</span>
              <span className="font-mono tabular-nums font-medium text-blue-600 dark:text-blue-400">
                {targetPage} / {totalPages}
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={targetPage || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setTargetPage(Math.min(Math.max(val, 1), totalPages));
                }
              }}
              className={`w-full px-4 py-3 rounded-2xl text-xl font-bold font-mono tracking-tight text-center border focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'bg-zinc-800/80 border-zinc-700 text-zinc-100'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900'
              }`}
              autoFocus
            />
          </div>

          <input
            type="range"
            min={1}
            max={totalPages}
            value={targetPage}
            onChange={(e) => setTargetPage(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 cursor-pointer"
          />

          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTargetPage(1)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              First (1)
            </button>
            <button
              type="button"
              onClick={() => setTargetPage(Math.max(1, targetPage - 10))}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              -10
            </button>
            <button
              type="button"
              onClick={() => setTargetPage(Math.min(totalPages, targetPage + 10))}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              +10
            </button>
            <button
              type="button"
              onClick={() => setTargetPage(totalPages)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              Last ({totalPages})
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-98 transition-all"
            >
              <span>Go to Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
