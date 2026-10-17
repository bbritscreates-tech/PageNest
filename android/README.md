# PageNest - Native Android Mobile PDF Reader

PageNest is an offline-first, native Android PDF & document reader built with **Kotlin** and **Jetpack Compose (Material 3)**.

---

## 🚀 Building into APK for Mobile Install

PageNest includes the full **Gradle Wrapper** (`gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`, and `gradle-wrapper.properties`). You do not need to install Gradle manually.

### Prerequisites
- **JDK 17** (Standard OpenJDK 17 or bundled with Android Studio).
- Android SDK Platform 34 (API level 26+ minimum supported on devices).

### 1. Build Debug APK via Command Line
Run one command from the project root:

```bash
# On macOS or Linux:
./gradlew assembleDebug

# On Windows (Command Prompt or PowerShell):
gradlew.bat assembleDebug
```

The Gradle wrapper will automatically execute using Gradle 8.6, resolve dependencies, compile Kotlin 1.9 and Jetpack Compose assets, and generate the APK.

### 2. Locate the Generated APK
Once the build completes with `BUILD SUCCESSFUL`, the APK is located at:
```
app/build/outputs/apk/debug/app-debug.apk
```

### 3. Install on your Android Mobile Device
You can install the APK in either of two ways:

#### Method A: Via USB with ADB
Connect your phone with USB debugging enabled:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

#### Method B: Direct File Transfer
1. Copy `app-debug.apk` to your phone via USB cable, Google Drive, or email/messaging.
2. Open your phone's **Files** or **Downloads** app.
3. Tap `app-debug.apk` and select **Install** (allow installation from unknown sources if prompted).

---

## 🛠 Opening in Android Studio
1. Launch **Android Studio (Hedgehog 2023.1.1 or newer)**.
2. Select **Open** and choose this project root directory.
3. Gradle will automatically sync using the bundled Gradle 8.6 wrapper.
4. Select your connected Android phone or emulator in the device selector.
5. Click **Run** (`Shift + F10`) to build and deploy directly to your device.

---

## 📱 Features & Offline Architecture

- **100% Offline & Private**:
  - No internet permission (`android.permission.INTERNET` is not requested).
  - Documents never leave the local device storage.
  - Fully functional in Airplane Mode.

- **Direct External App Intent Handler**:
  - Registered for `ACTION_VIEW`, `ACTION_SEND`, and `ACTION_SEND_MULTIPLE` with MIME type `application/pdf`.
  - Open PDFs directly from Chrome downloads, Gmail attachments, Files app, or the system Share Sheet.
  - Copies incoming content streams into internal app storage so documents persist offline even after the originating app closes.

- **Two PDF Reading Modes**:
  - **Light Mode**: Clean daytime reading with optimal contrast.
  - **Dark Mode**: Dark background with illuminated text without destructive colour inversion on photos and diagrams.

- **Separate Eye Comfort Filter**:
  - Independent blue-light wavelength attenuation slider (0% to 100%).
  - Can be toggled on/off in either Light Mode or Dark Mode.

- **Screen Orientation Control**:
  - Genuine Activity-level **Portrait** and **Landscape** orientation requests (`ActivityInfo.SCREEN_ORIENTATION_*`).
  - Independent of Android system auto-rotate setting.
  - Seamless continuous vertical scrolling in both orientations.

- **Saved Progress & Bookmarks**:
  - Reading page positions, timestamps, and custom bookmarks are persisted locally in Jetpack DataStore across app restarts.
