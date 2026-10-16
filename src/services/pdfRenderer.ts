import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up local worker without any CDN or internet requirement
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface LoadedPdfDoc {
  numPages: number;
  getPage: (pageNumber: number) => Promise<any>;
  destroy: () => void;
}

/**
 * Loads a PDF from an ArrayBuffer offline
 */
export async function loadPdfDocument(buffer: ArrayBuffer): Promise<LoadedPdfDoc> {
  // Make a copy of the buffer so PDF.js doesn't detach the original
  const copyBuffer = buffer.slice(0);
  const loadingTask = pdfjsLib.getDocument({
    data: copyBuffer,
    cMapUrl: undefined,
    cMapPacked: false,
  });

  const pdf = await loadingTask.promise;

  return {
    numPages: pdf.numPages,
    getPage: (pageNumber: number) => pdf.getPage(pageNumber),
    destroy: () => {
      try {
        (pdf as any).destroy?.();
      } catch {
        (pdf as any).cleanup?.();
      }
    },
  };
}

/**
 * Renders a PDF page to a canvas element with scale and devicePixelRatio support
 */
export async function renderPageToCanvas(
  page: any,
  canvas: HTMLCanvasElement,
  scale: number = 1.5,
  targetWidth?: number
): Promise<void> {
  const unscaledViewport = page.getViewport({ scale: 1.0 });

  let computedScale = scale;
  if (targetWidth && targetWidth > 0) {
    computedScale = (targetWidth / unscaledViewport.width) * (window.devicePixelRatio || 1);
  } else {
    computedScale = scale * (window.devicePixelRatio || 1);
  }

  const viewport = page.getViewport({ scale: computedScale });
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width / (window.devicePixelRatio || 1)}px`;
  canvas.style.height = `${viewport.height / (window.devicePixelRatio || 1)}px`;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
}

/**
 * Generates a thumbnail image (data URL) of page 1 for library preview
 */
export async function generateDocumentThumbnail(buffer: ArrayBuffer): Promise<string> {
  try {
    const doc = await loadPdfDocument(buffer);
    const page = await doc.getPage(1);
    const canvas = document.createElement('canvas');
    const viewport = page.getViewport({ scale: 0.4 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    doc.destroy();
    return dataUrl;
  } catch (err) {
    console.warn('Failed to generate thumbnail', err);
    return '';
  }
}
