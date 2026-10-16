import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  FileCode,
  FolderGit2,
  Terminal,
  Smartphone,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, AndroidFile } from '../services/androidSourceFiles';
import { generateAndroidProjectZip, downloadBlob } from '../services/zipExporter';

interface AndroidCodeViewerProps {
  onBack: () => void;
  isDark?: boolean;
}

export const AndroidCodeViewer: React.FC<AndroidCodeViewerProps> = ({ onBack, isDark = false }) => {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_PROJECT_FILES[4]); // default to MainActivity.kt
  const [copied, setCopied] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setExporting(true);
      const zipBlob = await generateAndroidProjectZip();
      downloadBlob(zipBlob, 'PageNest-Android-Project.zip');
    } catch (err) {
      console.error('Failed to export Android project ZIP', err);
      alert('Could not generate ZIP: ' + String(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className={`h-full flex flex-col overflow-hidden select-none transition-colors ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-[#F9FAFB] text-zinc-900'
      }`}
    >
      {/* Header */}
      <header
        className={`px-4 py-3 flex items-center justify-between border-b transition-colors shrink-0 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            title="Back to App"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <h1 className="font-bold text-base tracking-tight leading-none">Native Android Project</h1>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Kotlin · Jetpack Compose · Material 3</p>
          </div>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={exporting}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? 'Packaging ZIP...' : 'Download Android Project (.zip)'}</span>
        </button>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar: File Tree */}
        <aside
          className={`w-full md:w-72 border-r overflow-y-auto shrink-0 flex flex-col ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="p-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Project Files</span>
            <span className="text-[10px] font-mono text-zinc-400">{ANDROID_PROJECT_FILES.length} files</span>
          </div>

          <div className="p-2 space-y-1">
            {ANDROID_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isDark
                      ? 'hover:bg-zinc-800 text-zinc-300'
                      : 'hover:bg-zinc-200/70 text-zinc-700'
                  }`}
                >
                  <FileCode
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isSelected
                        ? 'text-white'
                        : file.language === 'kotlin'
                        ? 'text-purple-500'
                        : file.language === 'xml'
                        ? 'text-amber-500'
                        : 'text-zinc-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-medium truncate">{file.name}</div>
                    <div
                      className={`text-[10px] truncate mt-0.5 ${
                        isSelected ? 'text-white/80' : 'text-zinc-500'
                      }`}
                    >
                      {file.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Android Studio Quick Command Info */}
          <div className="mt-auto p-3 m-2 rounded-2xl bg-zinc-950 text-zinc-300 text-xs font-mono border border-zinc-800">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>Android Build</span>
            </div>
            <p className="text-[10px] text-zinc-400 mb-2">Build directly in Android Studio or via Gradle:</p>
            <code className="text-zinc-100 bg-zinc-900 px-2 py-1 rounded block text-[11px]">
              ./gradlew assembleDebug
            </code>
          </div>
        </aside>

        {/* Right Pane: Code View */}
        <section className="flex-1 flex flex-col overflow-hidden bg-zinc-950 text-zinc-100">
          {/* File bar */}
          <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
              <span className="text-zinc-500">{selectedFile.path}</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors text-zinc-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code content */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
            <pre className="text-zinc-200">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};
