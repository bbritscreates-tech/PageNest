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
  HelpCircle,
  X,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Package,
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, AndroidFile } from '../services/androidSourceFiles';
import { generateAndroidProjectZip, downloadBlob } from '../services/zipExporter';

interface AndroidCodeViewerProps {
  onBack: () => void;
  isDark?: boolean;
}

export const AndroidCodeViewer: React.FC<AndroidCodeViewerProps> = ({ onBack, isDark = false }) => {
  // Default to MainActivity.kt or gradlew
  const defaultFile =
    ANDROID_PROJECT_FILES.find((f) => f.name === 'MainActivity.kt') ||
    ANDROID_PROJECT_FILES[0];
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(defaultFile);
  const [copied, setCopied] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [showBuildGuide, setShowBuildGuide] = useState<boolean>(false);

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
              <h1 className="font-bold text-base tracking-tight leading-none">
                Native Android Mobile Project
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Gradle Wrapper Included
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              100% Offline Kotlin · Jetpack Compose (Material 3) · Ready to build APK
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Build APK Instructions Guide Trigger */}
          <button
            onClick={() => setShowBuildGuide(true)}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isDark
                ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-zinc-200'
                : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>How to Build APK</span>
          </button>

          {/* Download Project ZIP */}
          <button
            onClick={handleDownloadZip}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-all"
            title="Download full project with Gradle wrapper, wrapper jar, and source code"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Packaging ZIP...' : 'Download Project (.zip)'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar: File Tree */}
        <aside
          className={`w-full md:w-80 border-r overflow-y-auto shrink-0 flex flex-col ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="p-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Project Structure
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {ANDROID_PROJECT_FILES.length} files
            </span>
          </div>

          <div className="p-2 space-y-1">
            {ANDROID_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              const isWrapperFile =
                file.name.startsWith('gradlew') ||
                file.path.includes('gradle-wrapper') ||
                file.name === 'gradle.properties';

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
                        : isWrapperFile
                        ? 'text-emerald-500'
                        : file.language === 'kotlin'
                        ? 'text-purple-500'
                        : file.language === 'xml'
                        ? 'text-amber-500'
                        : 'text-zinc-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-medium truncate flex items-center gap-1.5">
                      <span>{file.name}</span>
                      {isWrapperFile && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-sans uppercase ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          wrapper
                        </span>
                      )}
                    </div>
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

          {/* Android Studio & Gradle Quick Command Info Card */}
          <div className="mt-auto p-3.5 m-2 rounded-2xl bg-zinc-950 text-zinc-300 text-xs font-mono border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                <Terminal className="w-3.5 h-3.5" />
                <span>One-Command APK Build</span>
              </div>
              <span className="text-[10px] text-zinc-500">Gradle 8.6</span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Run inside the unzipped project folder:
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between bg-zinc-900 px-2 py-1.5 rounded text-[11px] text-zinc-200">
                <code>./gradlew assembleDebug</code>
                <span className="text-[9px] text-zinc-500">Mac/Linux</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-900 px-2 py-1.5 rounded text-[11px] text-zinc-200">
                <code>gradlew.bat assembleDebug</code>
                <span className="text-[9px] text-zinc-500">Windows</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Pane: Code View */}
        <section className="flex-1 flex flex-col overflow-hidden bg-zinc-950 text-zinc-100">
          {/* File bar */}
          <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 min-w-0">
              <span className="text-zinc-500 truncate">{selectedFile.path}</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors text-zinc-200 shrink-0"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
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

      {/* How to Build APK Modal */}
      {showBuildGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight leading-snug">
                    Building the APK for Mobile Install
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Step-by-step instructions with the included Gradle wrapper
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBuildGuide(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      1
                    </span>
                    <span>Download &amp; Extract the Project</span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Click <strong>&quot;Download Project (.zip)&quot;</strong> in the top-right
                    corner. Extract the downloaded ZIP to any directory on your computer.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      2
                    </span>
                    <span>Build the Debug APK with Gradle</span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Open a terminal or command prompt in the extracted project folder and run:
                  </p>
                  <div className="space-y-1 font-mono">
                    <div className="p-2 rounded-xl bg-zinc-900 text-emerald-400 border border-zinc-800">
                      # macOS / Linux<br />
                      ./gradlew assembleDebug
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900 text-emerald-400 border border-zinc-800">
                      # Windows Command Prompt / PowerShell<br />
                      gradlew.bat assembleDebug
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    The wrapper will automatically verify and execute with Gradle 8.6, compiling
                    all Kotlin and Compose assets.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      3
                    </span>
                    <span>Locate Output APK</span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Once the build completes with <code>BUILD SUCCESSFUL</code>, find the APK at:
                  </p>
                  <code className="block p-2 rounded-xl bg-zinc-900 text-zinc-200 font-mono text-[11px] border border-zinc-800">
                    app/build/outputs/apk/debug/app-debug.apk
                  </code>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      4
                    </span>
                    <span>Install to Android Mobile Device</span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Install to your phone via USB using ADB:
                  </p>
                  <code className="block p-2 rounded-xl bg-zinc-900 text-zinc-200 font-mono text-[11px] border border-zinc-800">
                    adb install app/build/outputs/apk/debug/app-debug.apk
                  </code>
                  <p className="text-[11px] text-zinc-500">
                    Or simply send <code>app-debug.apk</code> to your phone (via USB cable, Google
                    Drive, or messaging) and tap it in your device Files app to install!
                  </p>
                </div>

                {/* Option B: Android Studio */}
                <div className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-600 dark:text-blue-400">
                    <Cpu className="w-4 h-4" />
                    <span>Alternative: Open Directly in Android Studio</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    Open <strong>Android Studio (Hedgehog or newer)</strong> &gt; Select <strong>Open</strong> &gt;
                    choose the project folder. Click <strong>Run</strong> (Shift+F10) with your
                    connected phone or emulator selected.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between text-xs">
              <span className="text-zinc-500 text-[11px]">
                Requires JDK 17 (included in Android Studio)
              </span>
              <button
                onClick={() => setShowBuildGuide(false)}
                className="px-4 py-1.5 rounded-xl font-medium text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
