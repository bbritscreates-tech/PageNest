# PageNest - Native Android PDF Reader

PageNest is an offline-first, privacy-focused PDF & document reader built with **Kotlin** and **Jetpack Compose (Material 3)**.

## Two PDF Reading Modes + Separate Eye Comfort Architecture
- **Two PDF Reading Modes Only**:
  - **Light Mode**: Light reading background and dark text where supported. Ideal for daytime reading.
  - **Dark Mode**: Dark reading background and light text where supported. Ideal for reading in low-light environments. Preserves diagrams, photos, and scanned content without destructive colour inversion.
- **Separate Eye Comfort Control**:
  - Eye Comfort is an independent colour-filter feature that can be enabled or disabled while either Light Mode or Dark Mode is active.
  - User can toggle Eye Comfort on/off in either mode without switching reading modes.
  - Blue-light filter intensity slider (0% to 100%): "Adjusts the warmth of the reading display."
  - In Light Mode, applies warm amber/sepia tint to the page background and content.
  - In Dark Mode, applies warm amber tint to the dark surface and illuminated text to soften contrast without reducing legibility or causing colour blow-out.
  - Persisted locally across sessions and document reopens.
- **Genuine Activity Screen Orientation Control**:
  - **Portrait**: Requests `ActivityInfo.SCREEN_ORIENTATION_PORTRAIT`. Pages displayed in standard vertical portrait orientation with continuous vertical scroll.
  - **Landscape**: Requests `ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE`. Uses the wider screen width while preserving continuous vertical scrolling through document pages.
  - Independent of Android system auto-rotate setting.
  - Restored to `SCREEN_ORIENTATION_UNSPECIFIED` outside the reader.
- **Continuous Vertical Scrolling**:
  - Seamless continuous vertical scrolling across all orientations. Scroll position and bookmarks remain rock-solid across rotation.
- **Independent App Appearance**:
  - System Default, Light, or Dark for app navigation and dialogs, completely independent from PDF document pages.
- **In-App Reading Brightness**:
  - Adjust Activity window brightness (`window.attributes.screenBrightness`) without altering device-wide system settings. Restored upon leaving reader.

## Opening in Android Studio
1. Launch **Android Studio (Hedgehog or newer)**.
2. Select **Open** and choose this `android/` directory.
3. Gradle will sync automatically using Gradle 8.4 and Kotlin 1.9.23.
4. Connect an Android phone (API 26+) or launch an Android Virtual Device (AVD).
5. Click **Run** (`Shift + F10`) or execute in terminal:
   ```bash
   ./gradlew assembleDebug
   ```
