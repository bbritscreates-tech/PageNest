import React, { useState } from 'react';
import {
  X,
  Share2,
  Download,
  Mail,
  FileCheck,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Upload,
} from 'lucide-react';
import {
  createChromeDownloadPdfBuffer,
  createEmailAttachmentPdfBuffer,
  createSharedPdfBuffer,
} from '../services/samplePdfs';

export interface ExternalIntentPayload {
  action: 'ACTION_VIEW' | 'ACTION_SEND' | 'ACTION_SEND_MULTIPLE';
  mimeType: string;
  sourceApp: string;
  uriString: string;
  fileName: string;
  buffer: ArrayBuffer;
  isInvalidOrCorrupt?: boolean;
}

interface ExternalIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerIntent: (payload: ExternalIntentPayload) => Promise<void>;
  isDark?: boolean;
}

export const ExternalIntentModal: React.FC<ExternalIntentModalProps> = ({
  isOpen,
  onClose,
  onTriggerIntent,
  isDark = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIntentType, setSelectedIntentType] = useState<string>('chrome');

  if (!isOpen) return null;

  const handleSimulate = async (type: string) => {
    setIsProcessing(true);
    try {
      if (type === 'chrome') {
        const buffer = createChromeDownloadPdfBuffer();
        await onTriggerIntent({
          action: 'ACTION_VIEW',
          mimeType: 'application/pdf',
          sourceApp: 'Google Chrome (Downloads)',
          uriString: 'content://com.android.providers.downloads.documents/document/raw%3AInvoice_Receipt_INV-8492.pdf',
          fileName: 'Invoice_Receipt_INV-8492.pdf',
          buffer,
        });
      } else if (type === 'email') {
        const buffer = createEmailAttachmentPdfBuffer();
        await onTriggerIntent({
          action: 'ACTION_VIEW',
          mimeType: 'application/pdf',
          sourceApp: 'Gmail / Email Client',
          uriString: 'content://com.google.android.gm.email.attachmentprovider/1/104/RAW',
          fileName: 'Quarterly_Financial_Report_Q3.pdf',
          buffer,
        });
      } else if (type === 'share') {
        const buffer = createSharedPdfBuffer();
        await onTriggerIntent({
          action: 'ACTION_SEND',
          mimeType: 'application/pdf',
          sourceApp: 'External Messaging / Social App',
          uriString: 'content://com.example.messenger.shareprovider/transfers/share_9941.pdf',
          fileName: 'System_Architecture_Design.pdf',
          buffer,
        });
      } else if (type === 'corrupt') {
        // Corrupt/non-PDF simulation
        const fakeBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe]).buffer;
        await onTriggerIntent({
          action: 'ACTION_VIEW',
          mimeType: 'application/pdf',
          sourceApp: 'Third-Party File Manager',
          uriString: 'content://com.example.filemanager.provider/bad_stream.pdf',
          fileName: 'corrupted_download.pdf',
          buffer: fakeBuffer,
          isInvalidOrCorrupt: true,
        });
      }
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessing(true);
      try {
        const buffer = await file.arrayBuffer();
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        await onTriggerIntent({
          action: 'ACTION_VIEW',
          mimeType: file.type || 'application/pdf',
          sourceApp: 'External App Chooser ("Open with PageNest")',
          uriString: `content://com.android.externalstorage.documents/document/${encodeURIComponent(file.name)}`,
          fileName: file.name,
          buffer,
          isInvalidOrCorrupt: !isPdf,
        });
        onClose();
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight leading-snug">
                External App Intent Simulator
              </h3>
              <p className="text-[11px] text-zinc-500">
                Simulate Android &quot;Open with&quot; and &quot;Share to&quot; PDF intents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-zinc-500 leading-relaxed">
            PageNest is registered in AndroidManifest.xml as a system-wide PDF handler for{' '}
            <code className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px] text-blue-600 dark:text-blue-400">
              ACTION_VIEW
            </code>{' '}
            and{' '}
            <code className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px] text-blue-600 dark:text-blue-400">
              ACTION_SEND
            </code>
            . Test how incoming documents are received, cached, and opened immediately:
          </p>

          <div className="space-y-2.5">
            {/* Scenario 1: Chrome Download */}
            <button
              onClick={() => handleSimulate('chrome')}
              disabled={isProcessing}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 transition-all active:scale-[0.99] ${
                isDark
                  ? 'bg-zinc-850/60 border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800'
                  : 'bg-zinc-50 border-zinc-200 hover:border-blue-500/50 hover:bg-blue-50/40'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs tracking-tight">Chrome Browser Download</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                    ACTION_VIEW
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  Invoice_Receipt_INV-8492.pdf · content://downloads provider
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Obtains read access &amp; caches locally for offline</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 self-center shrink-0" />
            </button>

            {/* Scenario 2: Gmail Attachment */}
            <button
              onClick={() => handleSimulate('email')}
              disabled={isProcessing}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 transition-all active:scale-[0.99] ${
                isDark
                  ? 'bg-zinc-850/60 border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800'
                  : 'bg-zinc-50 border-zinc-200 hover:border-blue-500/50 hover:bg-blue-50/40'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs tracking-tight">Email Client Attachment</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                    ACTION_VIEW
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  Quarterly_Financial_Report_Q3.pdf · ephemeral attachment URI
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Persists internally so file survives app restarts</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 self-center shrink-0" />
            </button>

            {/* Scenario 3: ACTION_SEND Share Sheet */}
            <button
              onClick={() => handleSimulate('share')}
              disabled={isProcessing}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 transition-all active:scale-[0.99] ${
                isDark
                  ? 'bg-zinc-850/60 border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800'
                  : 'bg-zinc-50 border-zinc-200 hover:border-blue-500/50 hover:bg-blue-50/40'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs tracking-tight">Share to PageNest</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                    ACTION_SEND
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  System_Architecture_Design.pdf · shared from external app
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-purple-600 dark:text-purple-400 mt-1.5 font-medium">
                  <FileCheck className="w-3 h-3" />
                  <span>Opens instantly in reading screen without re-import</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 self-center shrink-0" />
            </button>

            {/* Scenario 4: Pick any local PDF from device */}
            <label
              className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 cursor-pointer transition-all active:scale-[0.99] ${
                isDark
                  ? 'bg-zinc-850/60 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800'
                  : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/50 hover:bg-emerald-50/40'
              }`}
            >
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleCustomFileUpload}
                disabled={isProcessing}
              />
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs tracking-tight">Dispatch Real PDF File</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                    FILE INTENT
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  Choose any PDF file on your device to simulate external open
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1.5 font-medium">
                  <span>Validates PDF signature, caches, and launches reader</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 self-center shrink-0" />
            </label>

            {/* Scenario 5: Negative Error Handling Test */}
            <button
              onClick={() => handleSimulate('corrupt')}
              disabled={isProcessing}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 transition-all active:scale-[0.99] ${
                isDark
                  ? 'bg-zinc-850/60 border-zinc-800 hover:border-red-500/50 hover:bg-zinc-800'
                  : 'bg-zinc-50 border-zinc-200 hover:border-red-500/50 hover:bg-red-50/40'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs tracking-tight text-red-600 dark:text-red-400">
                    Test Invalid / Corrupt Document Error
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
                    ERROR HANDLING
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  Verifies clear user feedback when stream is damaged or non-PDF
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400 mt-1.5 font-medium">
                  <span>Shows clear error banner without crashing reader</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 self-center shrink-0" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between text-xs">
          <span className="text-zinc-500 text-[11px]">
            Complies with Android 14+ Scoped Storage &amp; ContentResolver
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-medium text-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
