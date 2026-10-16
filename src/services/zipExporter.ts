import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from './androidSourceFiles';

export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root folder in the zip
  const root = zip.folder('PageNest-Android');
  if (!root) throw new Error('Could not create zip folder');

  for (const file of ANDROID_PROJECT_FILES) {
    // Strip leading "android/" if present for clean zip packaging
    const cleanPath = file.path.startsWith('android/') ? file.path.substring(8) : file.path;
    root.file(cleanPath, file.content);
  }

  // Also include a gradlew wrapper placeholder script for convenience
  root.file(
    'gradlew',
    `#!/bin/sh
exec gradle "$@"
`,
    { unixPermissions: '755' }
  );

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
