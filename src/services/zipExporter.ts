import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES, AndroidFile } from './androidSourceFiles';
import { GRADLE_WRAPPER_JAR_BASE64 } from './gradleWrapperJarBase64';
import { ICON_ASSETS } from './iconAssets';

export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root folder in the zip
  const root = zip.folder('PageNest-Android');
  if (!root) throw new Error('Could not create zip folder');

  for (const file of ANDROID_PROJECT_FILES) {
    // Strip leading "android/" if present for clean zip packaging
    const cleanPath = file.path.startsWith('android/') ? file.path.substring(8) : file.path;
    
    // Mark gradlew shell script as executable (unixPermissions 755)
    if (cleanPath === 'gradlew') {
      root.file(cleanPath, file.content, { unixPermissions: '755' });
    } else {
      root.file(cleanPath, file.content);
    }
  }

  // Include binary launcher icons across all mipmap densities
  for (const [relPath, b64] of Object.entries(ICON_ASSETS)) {
    root.file(`app/src/main/res/${relPath}`, b64, { base64: true });
  }

  // Include binary gradle-wrapper.jar so ./gradlew works immediately without installing Gradle
  root.file('gradle/wrapper/gradle-wrapper.jar', GRADLE_WRAPPER_JAR_BASE64, {
    base64: true,
  });

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
