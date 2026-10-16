/**
 * Pure JavaScript PDF generator. Creates valid, multi-page PDF 1.4 documents
 * completely offline without any external network dependency.
 */

interface PageSpec {
  title: string;
  subtitle: string;
  lines: string[];
}

function escapePdf(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function buildPdfBuffer(pagesData: PageSpec[]): ArrayBuffer {
  const objects: string[] = [];
  const pageObjIds: number[] = [];

  // Obj 1: Catalog
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  // Obj 3: Font Helvetica
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  // Obj 4: Font Helvetica-Bold
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  let nextId = 5;

  pagesData.forEach((page, idx) => {
    const pageId = nextId++;
    const contentId = nextId++;
    pageObjIds.push(pageId);

    // Build content stream
    let stream = 'BT\n';
    // Title
    stream += '/F2 18 Tf\n';
    stream += '50 730 Td\n';
    stream += `(${escapePdf(page.title)}) Tj\n`;

    // Subtitle
    stream += '0 -22 Td\n';
    stream += '/F1 10.5 Tf\n';
    stream += `(${escapePdf(page.subtitle)}) Tj\n`;

    // Horizontal rule under header
    stream += 'ET\n';
    stream += '0.5 w\n';
    stream += '0.75 0.75 0.75 RG\n';
    stream += '50 690 m 545 690 l S\n';
    stream += 'BT\n';

    // Body lines
    stream += '50 660 Td\n';
    stream += '/F1 11 Tf\n';
    stream += '17 TL\n';

    page.lines.forEach((line) => {
      if (line === '') {
        stream += 'T*\n';
      } else {
        stream += `(${escapePdf(line)}) Tj T*\n`;
      }
    });

    // Page footer
    stream += 'ET\n';
    stream += 'BT\n';
    stream += '/F1 9 Tf\n';
    stream += '270 38 Td\n';
    stream += `(Page ${idx + 1} of ${pagesData.length}) Tj\n`;
    stream += 'ET\n';

    const streamLength = stream.length;
    objects[contentId] = `<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pagesData.length} >>`;

  // Assemble full PDF with xref
  let pdf = '%PDF-1.4\n%âãÏÓ\n';
  const offsets: number[] = [0];

  for (let i = 1; i < nextId; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${nextId}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < nextId; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    pdf += `${offStr} 00000 n \n`;
  }

  pdf += 'trailer\n';
  pdf += `<< /Size ${nextId} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefOffset}\n`;
  pdf += '%%EOF\n';

  // Convert to ArrayBuffer
  const buffer = new ArrayBuffer(pdf.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < pdf.length; i++) {
    view[i] = pdf.charCodeAt(i) & 0xff;
  }
  return buffer;
}

export function createStarterPdfBuffer(): ArrayBuffer {
  return buildPdfBuffer([
    {
      title: 'PageNest: The Art of Focused Reading',
      subtitle: 'Native Offline Reader for Android & Jetpack Compose',
      lines: [
        'Welcome to PageNest, a dedicated sanctuary for your PDF documents.',
        '',
        'Key Capabilities in this Release:',
        '• 100% Offline & Private: Documents never leave your device storage.',
        '• Dual PDF Reading Modes: Crisp Light Mode and contrast-optimized Dark Mode.',
        '• Independent Eye Comfort Slider: Smooth amber warmth with blue-light reduction.',
        '• Screen Orientation Control: Dedicated Portrait and Landscape reading display.',
        '• Direct External App Intent Handler: ACTION_VIEW and ACTION_SEND support.',
        '• Local State Persistence: Automatic page position recovery & bookmarking.',
        '',
        'Explore this document or use the "Import PDF" button to open your own files.',
      ],
    },
    {
      title: 'Chapter 1: The Offline & Privacy Promise',
      subtitle: 'Zero Cloud Dependencies · Pure Local Storage Access',
      lines: [
        'Modern reading applications too often demand account registration, online synchronisation,',
        'telemetry trackers, and network connectivity just to read a document.',
        '',
        'PageNest takes the opposite path:',
        '1. Storage Access Framework: Uses Android document picker to directly read local storage.',
        '2. Zero Network Traffic: Works flawlessly in airplane mode without any internet connection.',
        '3. Zero Ads, Zero Subscriptions: Reading is a fundamental focus activity.',
        '4. Memory-Efficient Rendering: Pages are streamed and rendered on-demand with zero bloat.',
        '',
        'Your reading habits, annotations, and library catalog remain exclusively yours.',
      ],
    },
    {
      title: 'Chapter 2: Meditations by Marcus Aurelius',
      subtitle: 'Book IV, Translated by George Long (Public Domain)',
      lines: [
        'That which rules within, when it is according to nature, is so affected with respect to the',
        'events which happen, that it always easily adapts itself to that which is possible.',
        '',
        'For it requires no definite material, but it moves towards its purpose under a condition;',
        'and it makes a material for itself out of that which opposes it, as fire lays hold of what falls',
        'into it, by which a small light would have been extinguished.',
        '',
        'Let no act be done without a purpose, nor otherwise than according to the perfect principles',
        'of art. Men look for retreats for themselves, the country houses, sea-shores, mountains;',
        'and you are wont to desire such things very much. But this is altogether a mark of the most',
        'common sort of men, for it is in your power whenever you will to retire into yourself.',
      ],
    },
    {
      title: 'Chapter 3: Gestures & Reading Comfort',
      subtitle: 'Tips for Effortless Reading Sessions',
      lines: [
        'Reading Comfort Features:',
        '• Tap Reading Area: Toggle Top Bar and Navigation scrubber.',
        '• Light / Dark Modes: Switch anytime using the top toolbar button.',
        '• Eye Comfort Slider: Adjust amber intensity (0% to 100%) independently.',
        '• Screen Orientation: Toggle Portrait or Landscape independently of device lock.',
        '• Continuous Vertical Scroll: Natural reading flow without awkward horizontal jumps.',
        '• Bookmarks: Tap bookmark ribbon to save important passages with custom notes.',
        '',
        'PageNest is engineered for long, distraction-free reading sessions.',
      ],
    },
  ]);
}

/**
 * Sample PDF for testing Chrome Browser Download intent:
 * content://com.android.providers.downloads.documents/document/raw%3AInvoice_Receipt_INV-8492.pdf
 */
export function createChromeDownloadPdfBuffer(): ArrayBuffer {
  return buildPdfBuffer([
    {
      title: 'Invoice & Purchase Confirmation',
      subtitle: 'Chrome Browser Download · Order #INV-8492',
      lines: [
        'Billed to: PageNest Reader User',
        'Date: October 2026',
        'Status: Paid in Full',
        '',
        'Item Summary:',
        '1. Professional Engineering Reference Manual (Digital Edition) .... $42.00',
        '2. Clean Architecture and Jetpack Compose Companion Guide ......... $29.00',
        'Subtotal: $71.00',
        'Taxes: $0.00',
        'Total: $71.00 USD',
        '',
        'This document was delivered directly via Android ACTION_VIEW intent.',
        'PageNest automatically registered, validated, and cached this document locally',
        'so that it remains accessible offline even if the downloads cache is cleared.',
      ],
    },
    {
      title: 'Terms of Service & Licensing',
      subtitle: 'Standard Digital Document Access Policy',
      lines: [
        'All purchases are stored locally on your device storage.',
        'You have perpetual offline reading rights with PageNest.',
        'No subscription or login credentials are required to open this PDF file.',
      ],
    },
  ]);
}

/**
 * Sample PDF for testing Email Attachment intent:
 * content://com.google.android.gm.email.attachmentprovider/1/104/RAW
 */
export function createEmailAttachmentPdfBuffer(): ArrayBuffer {
  return buildPdfBuffer([
    {
      title: 'Q3 Product & Architecture Review',
      subtitle: 'Email Attachment · Confidential Briefing',
      lines: [
        'From: Engineering Lead <lead@example.com>',
        'Subject: Q3 PDF Engine & Native Android Architecture',
        'Attachment: Quarterly_Financial_Report_Q3.pdf (Application/PDF)',
        '',
        'Executive Summary:',
        '• PDF Reading Performance: 60fps smooth scrolling achieved across all screen sizes.',
        '• Eye Comfort Filter: Complete blue-light wavelength attenuation with adjustable tint.',
        '• Intent Interception: 100% success rate handling ACTION_VIEW from mail apps.',
        '• Zero-Permission Leak: Local cache ensures files persist after email client exits.',
        '',
        'Action items for Q4 are detailed on page 2.',
      ],
    },
    {
      title: 'Q4 Milestones & Offline Integrity',
      subtitle: 'Next Steps & Performance Targets',
      lines: [
        '1. Continuous vertical rendering optimization for 1000+ page documents.',
        '2. Memory bounds enforcement under 48MB heap during concurrent page flips.',
        '3. Instant resume from Android backstack and background lifecycle states.',
      ],
    },
  ]);
}

/**
 * Sample PDF for testing Share (ACTION_SEND) intent:
 * Shared via Android Share Sheet into PageNest
 */
export function createSharedPdfBuffer(): ArrayBuffer {
  return buildPdfBuffer([
    {
      title: 'System Design: Offline-First Native Android',
      subtitle: 'Shared via ACTION_SEND from External Messaging App',
      lines: [
        'Document Origin: Shared to PageNest via Android Send Intent',
        'Content Type: application/pdf',
        '',
        'Core Principles of PageNest Intent Handling:',
        '1. Immediate Presentation: Opens straight into the reading canvas without extra clicks.',
        '2. Deduplication: Reopens the existing record if the document was previously imported.',
        '3. Bookmark Preservation: Retains saved page bookmarks across subsequent opens.',
        '4. Fail-Safe Parsing: Graceful error recovery if the incoming intent has invalid data.',
        '',
        'Enjoy reading with zero distractions in PageNest.',
      ],
    },
  ]);
}
