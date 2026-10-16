import React from 'react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  Sliders,
  Smartphone,
  Sparkles,
  Info,
  BookOpen,
} from 'lucide-react';
import { ReaderPreferences, AppTheme, PdfReadingMode, ReaderOrientation } from '../types/reader';

interface SettingsScreenProps {
  preferences: ReaderPreferences;
  onUpdatePreferences: (updated: Partial<ReaderPreferences>) => void;
  onBack: () => void;
  documentCount: number;
  onClearLibrary: () => void;
  isDark?: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  preferences,
  onUpdatePreferences,
  onBack,
  documentCount,
  onClearLibrary,
  isDark = false,
}) => {
  const activeReadingMode: PdfReadingMode =
    preferences.readingMode === 'dark' || preferences.readingTheme === 'dark' ? 'dark' : 'light';
  const isEyeComfortActive = !!preferences.eyeComfortEnabled;
  const eyeComfortIntensity = preferences.eyeComfortIntensity ?? 45;

  return (
    <div
      className={`h-full flex flex-col overflow-y-auto select-none transition-colors ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-[#F9FAFB] text-zinc-900'
      }`}
    >
      {/* Top App Bar */}
      <header
        className={`sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3 border-b transition-colors backdrop-blur-md ${
          isDark ? 'bg-zinc-950/85 border-zinc-800/80' : 'bg-white/85 border-zinc-200/80'
        }`}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-current"
          aria-label="Back to Library"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-lg tracking-tight leading-none">Settings & Reading Comfort</h1>
          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Themes, eye comfort filter & reader orientation</p>
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
        {/* 1. Application Interface Theme (System Default, Light, Dark) */}
        <section
          className={`p-5 rounded-3xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200/80'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-base tracking-tight">App Interface Theme</h2>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Controls the overall application shell, library, navigation, and dialogs independently from PDF document pages.
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'system', label: 'System Default', icon: Monitor, desc: 'Auto-adapts to Android OS' },
              { id: 'light', label: 'Light', icon: Sun, desc: 'Crisp bright interface' },
              { id: 'dark', label: 'Dark', icon: Moon, desc: 'Deep dark slate interface' },
            ].map((theme) => {
              const Icon = theme.icon;
              const isSelected = preferences.appTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onUpdatePreferences({ appTheme: theme.id as AppTheme })}
                  className={`p-3 rounded-2xl border text-left transition-all active:scale-98 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                      : isDark
                      ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 text-zinc-300'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4" />
                    {isSelected && <CheckCircle2 className="w-4 h-4 fill-current text-blue-600 dark:text-blue-400" />}
                  </div>
                  <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{theme.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{theme.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. PDF Reading Modes: Exactly TWO Modes (Light Mode & Dark Mode) */}
        <section
          className={`p-5 rounded-3xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-bold text-base tracking-tight">PDF Reading Mode</h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
              2 Core Modes
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Choose your document page reading mode. Text remains sharp and diagrams are preserved without destructive changes.
          </p>

          <div className="grid grid-cols-2 gap-3.5">
            {/* LIGHT MODE CARD */}
            <div
              onClick={() => onUpdatePreferences({ readingMode: 'light', readingTheme: 'light' })}
              className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-98 flex flex-col justify-between ${
                activeReadingMode === 'light'
                  ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
                  : isDark
                  ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
                  : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60'
              }`}
            >
              {/* Visual Preview */}
              <div className="w-full h-24 rounded-xl border border-zinc-200 bg-white text-zinc-900 p-2.5 flex flex-col justify-between mb-3 shadow-xs">
                <div className="space-y-1.5">
                  <div className="w-1/2 h-1.5 rounded-full bg-zinc-800" />
                  <div className="w-3/4 h-1 rounded-full bg-zinc-300" />
                  <div className="w-5/6 h-1 rounded-full bg-zinc-300" />
                  <div className="w-2/3 h-1 rounded-full bg-zinc-300" />
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                  <span className="font-bold">Aa Daytime</span>
                  <span>Light Mode</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Light Mode</span>
                  </div>
                  {activeReadingMode === 'light' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-current" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Light reading background with dark text. Optimal for daytime reading sessions.
                </p>
              </div>
            </div>

            {/* DARK MODE CARD */}
            <div
              onClick={() => onUpdatePreferences({ readingMode: 'dark', readingTheme: 'dark' })}
              className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-98 flex flex-col justify-between ${
                activeReadingMode === 'dark'
                  ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
                  : isDark
                  ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
                  : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60'
              }`}
            >
              {/* Visual Preview */}
              <div className="w-full h-24 rounded-xl border border-zinc-700 bg-[#181A20] text-zinc-100 p-2.5 flex flex-col justify-between mb-3 shadow-xs">
                <div className="space-y-1.5">
                  <div className="w-1/2 h-1.5 rounded-full bg-zinc-200" />
                  <div className="w-3/4 h-1 rounded-full bg-zinc-600" />
                  <div className="w-5/6 h-1 rounded-full bg-zinc-600" />
                  <div className="w-2/3 h-1 rounded-full bg-zinc-600" />
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                  <span className="font-bold">Aa Nighttime</span>
                  <span>Dark Mode</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-amber-300" />
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Dark Mode</span>
                  </div>
                  {activeReadingMode === 'dark' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-current" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Dark background with light text. Protects eyes in low-light environments without inverted photos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SEPARATE EYE COMFORT CONTROL (INDEPENDENT FEATURE) */}
        <section
          className={`p-5 rounded-3xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-base tracking-tight">Eye Comfort Filter</h2>
            </div>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                isEyeComfortActive
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}
            >
              {isEyeComfortActive ? 'Active' : 'Off'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Adjusts the warmth of the reading display. Independent colour-filter that can be enabled or disabled while either Light Mode or Dark Mode is active.
          </p>

          {/* Enable Eye Comfort Toggle */}
          <div
            onClick={() => onUpdatePreferences({ eyeComfortEnabled: !isEyeComfortActive })}
            className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors mb-4 ${
              isEyeComfortActive
                ? 'border-amber-500/40 bg-amber-500/10'
                : isDark
                ? 'border-zinc-800 bg-zinc-900/80'
                : 'border-zinc-200 bg-zinc-50/60'
            }`}
          >
            <div>
              <span className="font-semibold text-xs block text-zinc-900 dark:text-zinc-100">
                Enable Eye Comfort
              </span>
              <span className="text-[10px] text-zinc-500">
                Works seamlessly in both Light Mode and Dark Mode
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
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-700 dark:text-zinc-300">
                Blue-light filter intensity
              </span>
              <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold">
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
              <span>0% (No additional warmth)</span>
              <span>100% (Warm amber)</span>
            </div>

            {/* Live Visual Sample Swatch */}
            <div
              className={`mt-3 p-3 rounded-2xl border transition-all ${
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
              <div className="flex items-center justify-between text-[10px] font-mono opacity-70 mb-1">
                <span>SIMULATED DOCUMENT VIEW</span>
                <span>{activeReadingMode.toUpperCase()} MODE</span>
              </div>
              <p className="text-xs font-serif leading-relaxed">
                "The soul becomes dyed with the color of its thoughts." — Marcus Aurelius
              </p>
              <div className="flex items-center justify-between text-[9px] font-mono mt-1 opacity-70">
                <span>Text sharpness preserved</span>
                <span>{isEyeComfortActive ? `Warmth: ${eyeComfortIntensity}%` : 'Filter disabled'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Screen Orientation: Portrait / Landscape */}
        <section
          className={`p-5 rounded-3xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200/80'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-base tracking-tight">Preferred Reader Screen Orientation</h2>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Request portrait or landscape orientation for the reader independently of Android's system auto-rotate setting. Documents always use standard continuous vertical scrolling in both modes.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: 'portrait',
                label: 'Portrait',
                desc: 'Standard vertical reading on phones and tablets',
                iconRotate: 'rotate-0',
              },
              {
                id: 'landscape',
                label: 'Landscape',
                desc: 'Wide screen view with comfortable continuous vertical scroll',
                iconRotate: 'rotate-90',
              },
            ].map((ori) => {
              const isSelected = preferences.orientation === ori.id;
              return (
                <button
                  key={ori.id}
                  onClick={() => onUpdatePreferences({ orientation: ori.id as ReaderOrientation })}
                  className={`p-4 rounded-2xl border text-left transition-all active:scale-98 flex items-start gap-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs'
                      : isDark
                      ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60 text-zinc-700'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Smartphone className={`w-5 h-5 transition-transform ${ori.iconRotate}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>{ori.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-current" />}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{ori.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. In-App Reading Brightness Slider */}
        <section
          className={`p-5 rounded-3xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-bold text-base tracking-tight">In-App Reading Brightness</h2>
            </div>
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {Math.round((preferences.brightness || 1.0) * 100)}%
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Adjust screen brightness for comfortable reading in low light without leaving the reader. When you exit reading mode, your standard device brightness is automatically restored.
          </p>

          <div className="flex items-center gap-4">
            <Sun className="w-4 h-4 text-zinc-400" />
            <input
              type="range"
              min={0.15}
              max={1.0}
              step={0.05}
              value={preferences.brightness ?? 1.0}
              onChange={(e) => onUpdatePreferences({ brightness: parseFloat(e.target.value) })}
              className="flex-1 accent-blue-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none"
            />
            <Sun className="w-5 h-5 text-amber-500" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 font-mono">
            <span>Dim (15%)</span>
            <span>Standard (100%)</span>
          </div>
        </section>

        {/* 6. Toggles: Keep Screen Awake & Page Indicators */}
        <section
          className={`p-5 rounded-3xl border transition-colors ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200/80'
          }`}
        >
          <h2 className="font-bold text-base tracking-tight mb-3">Reader Behavior & Display</h2>

          <div className="space-y-4">
            {/* Keep Screen Awake */}
            <div className="flex items-center justify-between gap-4 py-2 border-b border-black/5 dark:border-white/5">
              <div>
                <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block">
                  Keep Screen Awake While Reading
                </span>
                <span className="text-[11px] text-zinc-500">
                  Prevents screen from turning off automatically during reading
                </span>
              </div>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ keepScreenAwake: !preferences.keepScreenAwake })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.keepScreenAwake ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    preferences.keepScreenAwake ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Show Page Number Overlay */}
            <div className="flex items-center justify-between gap-4 py-2">
              <div>
                <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block">
                  Show Page Number Indicator
                </span>
                <span className="text-[11px] text-zinc-500">
                  Displays current page & jump pill in the reader bottom bar
                </span>
              </div>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ showPageIndicator: !preferences.showPageIndicator })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.showPageIndicator ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    preferences.showPageIndicator ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Technical Quality Notice */}
        <section className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <span className="font-semibold block">Two Dedicated PDF Reading Modes + Independent Eye Comfort:</span>
            <p>
              PageNest features exactly two core PDF reading modes (Light and Dark) engineered to preserve diagrams, equations, and scanned books. The Eye Comfort blue-light filter can be toggled and adjusted independently across either mode.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
