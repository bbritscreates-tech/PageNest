export interface AndroidFile {
  path: string;
  name: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'properties' | 'markdown';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    path: 'android/settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'kotlin',
    description: 'Gradle settings and repository declarations',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "PageNest"
include(":app")
`,
  },
  {
    path: 'android/build.gradle.kts',
    name: 'build.gradle.kts (Project)',
    language: 'kotlin',
    description: 'Root Gradle build configuration',
    content: `plugins {
    id("com.android.application") version "8.4.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.23" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "1.9.23" apply false
}
`,
  },
  {
    path: 'android/gradle.properties',
    name: 'gradle.properties',
    language: 'properties',
    description: 'Gradle execution parameters',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`,
  },
  {
    path: 'android/app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'App module dependencies with Jetpack Compose Material 3 & Coroutines',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.pagenest.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.pagenest.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 3
        versionName = "2.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.11"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // AndroidX Core & Lifecycle
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.activity:activity-compose:1.9.0")

    // Jetpack Compose & Material 3
    implementation(platform("androidx.compose:compose-bom:2024.04.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.foundation:foundation")

    // DataStore for Offline Local Persistence
    implementation("androidx.datastore:datastore-preferences:1.1.0")

    // Kotlinx Serialization for Local Bookmarks & Document Metadata
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
`,
  },
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    description: 'Android manifest with Storage Access Framework and Edge-to-Edge support',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Zero dangerous permissions requested. Pure offline Storage Access Framework -->
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.PageNest">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:theme="@style/Theme.PageNest">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Allow opening PDF files from Android file managers -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="application/pdf" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`,
  },
  {
    path: 'android/app/src/main/java/com/pagenest/app/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    description: 'Main Activity with genuine screen orientation control (Portrait/Landscape) and lifecycle handling',
    content: `package com.pagenest.app

import android.content.Intent
import android.content.pm.ActivityInfo
import android.net.Uri
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.pagenest.app.model.AppTheme
import com.pagenest.app.model.ReaderOrientation
import com.pagenest.app.ui.screens.HomeScreen
import com.pagenest.app.ui.screens.ReaderScreen
import com.pagenest.app.ui.screens.SettingsScreen
import com.pagenest.app.ui.theme.PageNestTheme
import com.pagenest.app.viewmodel.LibraryViewModel
import com.pagenest.app.viewmodel.ReaderViewModel

class MainActivity : ComponentActivity() {

    private val libraryViewModel: LibraryViewModel by viewModels()
    private val readerViewModel: ReaderViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        intent?.data?.let { uri ->
            if (intent.action == Intent.ACTION_VIEW) {
                takePersistablePermissions(uri)
                libraryViewModel.importDocumentFromUri(this, uri)
            }
        }

        setContent {
            val preferences by libraryViewModel.preferences.collectAsState()
            val currentScreen by libraryViewModel.currentScreen.collectAsState()

            // 1. Screen Orientation Management
            // In reader: enforce portrait or landscape according to user preference
            // In library/settings: release orientation lock to unspecified so UI is natural
            LaunchedEffect(currentScreen, preferences.orientation) {
                if (currentScreen == Screen.READER) {
                    val targetOrientation = when (preferences.orientation) {
                        ReaderOrientation.LANDSCAPE -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
                        ReaderOrientation.PORTRAIT -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
                    }
                    if (requestedOrientation != targetOrientation) {
                        requestedOrientation = targetOrientation
                    }
                } else {
                    if (requestedOrientation != ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED) {
                        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                    }
                }
            }

            // 2. In-App Reading Brightness & Screen Awake Lifecycle Management
            LaunchedEffect(currentScreen, preferences.brightness, preferences.keepScreenAwake) {
                val lp = window.attributes
                if (currentScreen == Screen.READER) {
                    lp.screenBrightness = preferences.brightness.coerceIn(0.15f, 1.0f)
                    window.attributes = lp

                    if (preferences.keepScreenAwake) {
                        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    } else {
                        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    }
                } else {
                    lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
                    window.attributes = lp
                    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                }
            }

            val useDark = when (preferences.appTheme) {
                AppTheme.SYSTEM -> isSystemInDarkTheme()
                AppTheme.DARK -> true
                AppTheme.LIGHT -> false
            }

            PageNestTheme(darkTheme = useDark) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    PageNestApp(
                        libraryViewModel = libraryViewModel,
                        readerViewModel = readerViewModel,
                        onImportUri = { uri ->
                            takePersistablePermissions(uri)
                            libraryViewModel.importDocumentFromUri(this, uri)
                        }
                    )
                }
            }
        }
    }

    override fun onStop() {
        super.onStop()
        // Restore system brightness, wake lock, and orientation on app background/pause
        val lp = window.attributes
        lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
        window.attributes = lp
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    }

    private fun takePersistablePermissions(uri: Uri) {
        try {
            val flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
            contentResolver.takePersistableUriPermission(uri, flags)
        } catch (e: SecurityException) {
            // Graceful fallback
        }
    }
}

enum class Screen {
    HOME,
    READER,
    SETTINGS
}

@Composable
fun PageNestApp(
    libraryViewModel: LibraryViewModel,
    readerViewModel: ReaderViewModel,
    onImportUri: (Uri) -> Unit
) {
    val currentScreen by libraryViewModel.currentScreen.collectAsState()
    val activeDocument by readerViewModel.activeDocument.collectAsState()
    val preferences by libraryViewModel.preferences.collectAsState()

    when (currentScreen) {
        Screen.HOME -> {
            HomeScreen(
                viewModel = libraryViewModel,
                onOpenDocument = { doc ->
                    readerViewModel.openDocument(doc)
                    libraryViewModel.navigateTo(Screen.READER)
                },
                onOpenSettings = {
                    libraryViewModel.navigateTo(Screen.SETTINGS)
                },
                onImportUri = onImportUri
            )
        }
        Screen.READER -> {
            activeDocument?.let { doc ->
                ReaderScreen(
                    document = doc,
                    viewModel = readerViewModel,
                    preferences = preferences,
                    onUpdateReadingMode = { libraryViewModel.updateReadingMode(it) },
                    onUpdateOrientation = { libraryViewModel.updateOrientation(it) },
                    onUpdateEyeComfortEnabled = { libraryViewModel.updateEyeComfortEnabled(it) },
                    onUpdateEyeComfortIntensity = { libraryViewModel.updateEyeComfortIntensity(it) },
                    onUpdateBrightness = { libraryViewModel.updateBrightness(it) },
                    onBack = {
                        libraryViewModel.refreshLibrary()
                        libraryViewModel.navigateTo(Screen.HOME)
                    }
                )
            } ?: run {
                libraryViewModel.navigateTo(Screen.HOME)
            }
        }
        Screen.SETTINGS -> {
            SettingsScreen(
                libraryViewModel = libraryViewModel,
                onBack = { libraryViewModel.navigateTo(Screen.HOME) }
            )
        }
    }
}
`,
  },
  {
    path: 'android/app/src/main/java/com/pagenest/app/pdf/AndroidPdfRenderer.kt',
    name: 'AndroidPdfRenderer.kt',
    language: 'kotlin',
    description: 'Hardware-accelerated native PDF page rendering with android.graphics.pdf.PdfRenderer',
    content: `package com.pagenest.app.pdf

import android.content.Context
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AndroidPdfRenderer(private val context: Context) {

    private var fileDescriptor: ParcelFileDescriptor? = null
    private var pdfRenderer: PdfRenderer? = null
    var pageCount: Int = 0
        private set

    suspend fun open(uri: Uri): Result<Int> = withContext(Dispatchers.IO) {
        runCatching {
            close()
            fileDescriptor = context.contentResolver.openFileDescriptor(uri, "r")
                ?: throw IllegalStateException("Could not open file descriptor for URI: $uri")

            pdfRenderer = PdfRenderer(fileDescriptor!!)
            pageCount = pdfRenderer?.pageCount ?: 0
            pageCount
        }
    }

    suspend fun renderPage(pageIndex: Int, targetWidth: Int): Result<Bitmap> = withContext(Dispatchers.IO) {
        runCatching {
            val renderer = pdfRenderer ?: throw IllegalStateException("PdfRenderer not initialized")
            if (pageIndex !in 0 until pageCount) {
                throw IndexOutOfBoundsException("Page index $pageIndex out of range 0..$pageCount")
            }

            val page = renderer.openPage(pageIndex)
            val aspectRatio = page.height.toFloat() / page.width.toFloat()
            val targetHeight = (targetWidth * aspectRatio).toInt()

            val bitmap = Bitmap.createBitmap(
                targetWidth,
                targetHeight,
                Bitmap.Config.ARGB_8888
            )

            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
            page.close()

            bitmap
        }
    }

    fun close() {
        try {
            pdfRenderer?.close()
            pdfRenderer = null
            fileDescriptor?.close()
            fileDescriptor = null
            pageCount = 0
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
`,
  },
  {
    path: 'android/app/src/main/java/com/pagenest/app/model/DocumentModel.kt',
    name: 'DocumentModel.kt',
    language: 'kotlin',
    description: 'Data models for documents, bookmarks, AppTheme, ReadingMode, and ReaderOrientation',
    content: `package com.pagenest.app.model

import kotlinx.serialization.Serializable

@Serializable
enum class AppTheme {
    SYSTEM,
    LIGHT,
    DARK
}

@Serializable
enum class ReadingMode {
    LIGHT,
    DARK
}

// Deprecated alias for backwards compatibility
typealias ReadingTheme = ReadingMode

@Serializable
enum class ReaderOrientation {
    PORTRAIT,
    LANDSCAPE
}

@Serializable
data class Bookmark(
    val id: String,
    val pageNumber: Int,
    val label: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class DocumentItem(
    val id: String,
    val uriString: String,
    val displayName: String,
    val totalPages: Int,
    val currentPage: Int = 1,
    val lastReadTimestamp: Long = System.currentTimeMillis(),
    val bookmarks: List<Bookmark> = emptyList()
)

@Serializable
data class ReaderPreferences(
    val appTheme: AppTheme = AppTheme.SYSTEM,
    val readingMode: ReadingMode = ReadingMode.LIGHT,
    val orientation: ReaderOrientation = ReaderOrientation.PORTRAIT,
    val eyeComfortEnabled: Boolean = false,
    val eyeComfortIntensity: Int = 45, // 0 to 100 ("Blue-light filter intensity")
    val brightness: Float = 1.0f,
    val keepScreenAwake: Boolean = true,
    val showPageIndicator: Boolean = true
)
`,
  },
  {
    path: 'android/app/src/main/java/com/pagenest/app/data/PreferencesManager.kt',
    name: 'PreferencesManager.kt',
    language: 'kotlin',
    description: 'DataStore persistent settings for AppTheme, ReadingMode, orientation, and independent eye comfort',
    content: `package com.pagenest.app.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.pagenest.app.model.AppTheme
import com.pagenest.app.model.ReaderOrientation
import com.pagenest.app.model.ReaderPreferences
import com.pagenest.app.model.ReadingMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "pagenest_prefs")

class PreferencesManager(private val context: Context) {

    private val KEY_APP_THEME = stringPreferencesKey("app_theme")
    private val KEY_READING_MODE = stringPreferencesKey("reading_mode")
    private val KEY_ORIENTATION = stringPreferencesKey("reader_orientation")
    private val KEY_EYE_COMFORT_ENABLED = booleanPreferencesKey("eye_comfort_enabled")
    private val KEY_EYE_COMFORT_INTENSITY = intPreferencesKey("eye_comfort_intensity")
    private val KEY_BRIGHTNESS = floatPreferencesKey("reading_brightness")
    private val KEY_KEEP_SCREEN_AWAKE = booleanPreferencesKey("keep_screen_awake")
    private val KEY_SHOW_PAGE_INDICATOR = booleanPreferencesKey("show_page_indicator")

    val preferencesFlow: Flow<ReaderPreferences> = context.dataStore.data.map { prefs ->
        val rawMode = prefs[KEY_READING_MODE]
        val mode = if (rawMode == "DARK") ReadingMode.DARK else ReadingMode.LIGHT

        ReaderPreferences(
            appTheme = prefs[KEY_APP_THEME]?.let { runCatching { AppTheme.valueOf(it) }.getOrNull() } ?: AppTheme.SYSTEM,
            readingMode = mode,
            orientation = prefs[KEY_ORIENTATION]?.let { runCatching { ReaderOrientation.valueOf(it) }.getOrNull() } ?: ReaderOrientation.PORTRAIT,
            eyeComfortEnabled = prefs[KEY_EYE_COMFORT_ENABLED] ?: false,
            eyeComfortIntensity = prefs[KEY_EYE_COMFORT_INTENSITY] ?: 45,
            brightness = prefs[KEY_BRIGHTNESS] ?: 1.0f,
            keepScreenAwake = prefs[KEY_KEEP_SCREEN_AWAKE] ?: true,
            showPageIndicator = prefs[KEY_SHOW_PAGE_INDICATOR] ?: true
        )
    }

    suspend fun updateAppTheme(theme: AppTheme) {
        context.dataStore.edit { it[KEY_APP_THEME] = theme.name }
    }

    suspend fun updateReadingMode(mode: ReadingMode) {
        context.dataStore.edit { it[KEY_READING_MODE] = mode.name }
    }

    suspend fun updateOrientation(orientation: ReaderOrientation) {
        context.dataStore.edit { it[KEY_ORIENTATION] = orientation.name }
    }

    suspend fun updateEyeComfortEnabled(enabled: Boolean) {
        context.dataStore.edit { it[KEY_EYE_COMFORT_ENABLED] = enabled }
    }

    suspend fun updateEyeComfortIntensity(intensity: Int) {
        context.dataStore.edit { it[KEY_EYE_COMFORT_INTENSITY] = intensity }
    }

    suspend fun updateBrightness(brightness: Float) {
        context.dataStore.edit { it[KEY_BRIGHTNESS] = brightness }
    }

    suspend fun updateKeepScreenAwake(awake: Boolean) {
        context.dataStore.edit { it[KEY_KEEP_SCREEN_AWAKE] = awake }
    }

    suspend fun updateShowPageIndicator(show: Boolean) {
        context.dataStore.edit { it[KEY_SHOW_PAGE_INDICATOR] = show }
    }
}
`,
  },
  {
    path: 'android/app/src/main/java/com/pagenest/app/ui/screens/HomeScreen.kt',
    name: 'HomeScreen.kt',
    language: 'kotlin',
    description: 'Library home screen with Recently Read, PDF Document Picker launcher, and library cards',
    content: `package com.pagenest.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.pagenest.app.model.DocumentItem
import com.pagenest.app.viewmodel.LibraryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: LibraryViewModel,
    onOpenDocument: (DocumentItem) -> Unit,
    onOpenSettings: () -> Unit,
    onImportUri: (Uri) -> Unit
) {
    val documents by viewModel.documents.collectAsState()
    val recentlyRead = documents.firstOrNull()

    val docPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        uri?.let { onImportUri(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "PageNest",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                },
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Outlined.Settings, contentDescription = "Settings")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { docPickerLauncher.launch(arrayOf("application/pdf")) },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Import PDF") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            recentlyRead?.let { recent ->
                item {
                    Text(
                        text = "Recently Read",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                    )
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onOpenDocument(recent) },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = recent.displayName,
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = "Page \${recent.currentPage} of \${recent.totalPages}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            val progress = if (recent.totalPages > 0) {
                                recent.currentPage.toFloat() / recent.totalPages.toFloat()
                            } else 0f
                            LinearProgressIndicator(
                                progress = { progress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp)),
                                color = MaterialTheme.colorScheme.primary,
                                trackColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.2f)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = { onOpenDocument(recent) },
                                modifier = Modifier.align(Alignment.End),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Resume Reading")
                            }
                        }
                    }
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Your Library (\${documents.size})",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
            }

            if (documents.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 48.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Outlined.PictureAsPdf,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.outline
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "No documents imported yet",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Tap 'Import PDF' to open any PDF on your device",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }
                    }
                }
            } else {
                items(documents, key = { it.id }) { doc ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onOpenDocument(doc) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(12.dp)
                                .fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.primaryContainer),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.Book,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = doc.displayName,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Page \${doc.currentPage} of \${doc.totalPages} · \${doc.bookmarks.size} bookmarks",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            IconButton(onClick = { viewModel.deleteDocument(doc.id) }) {
                                Icon(
                                    Icons.Outlined.Delete,
                                    contentDescription = "Delete",
                                    tint = MaterialTheme.colorScheme.outline
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
`,
  },
  {
    path: 'android/app/src/main/java/com/pagenest/app/ui/screens/ReaderScreen.kt',
    name: 'ReaderScreen.kt',
    language: 'kotlin',
    description: 'Immersive reading screen with continuous vertical document scrolling, 2 reading modes (Light & Dark), dedicated Eye Comfort filter, and screen orientation control',
    content: `package com.pagenest.app.ui.screens

import android.graphics.Bitmap
import androidx.compose.animation.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pagenest.app.model.DocumentItem
import com.pagenest.app.model.ReaderOrientation
import com.pagenest.app.model.ReaderPreferences
import com.pagenest.app.model.ReadingMode
import com.pagenest.app.ui.components.BookmarksSheet
import com.pagenest.app.ui.components.JumpToPageDialog
import com.pagenest.app.viewmodel.ReaderViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReaderScreen(
    document: DocumentItem,
    viewModel: ReaderViewModel,
    preferences: ReaderPreferences,
    onUpdateReadingMode: (ReadingMode) -> Unit,
    onUpdateOrientation: (ReaderOrientation) -> Unit,
    onUpdateEyeComfortEnabled: (Boolean) -> Unit,
    onUpdateEyeComfortIntensity: (Int) -> Unit,
    onUpdateBrightness: (Float) -> Unit,
    onBack: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var controlsVisible by remember { mutableStateOf(true) }
    var showJumpDialog by remember { mutableStateOf(false) }
    var showBookmarksSheet by remember { mutableStateOf(false) }
    var showBrightnessDialog by remember { mutableStateOf(false) }
    var showEyeComfortPanel by remember { mutableStateOf(false) }

    val currentPage by viewModel.currentPage.collectAsState()
    val totalPages by viewModel.totalPages.collectAsState()

    val listState = rememberLazyListState(initialFirstVisibleItemIndex = (document.currentPage - 1).coerceAtLeast(0))

    // Track scroll position to update current page
    LaunchedEffect(listState.firstVisibleItemIndex) {
        viewModel.onPageSelected(listState.firstVisibleItemIndex + 1)
    }

    val isCurrentPageBookmarked = document.bookmarks.any { it.pageNumber == currentPage }
    val isEyeComfortActive = preferences.eyeComfortEnabled
    val eyeComfortIntensity = preferences.eyeComfortIntensity.coerceIn(0, 100)

    // ColorFilter for PDF Reading: Light & Dark Modes + Independent Eye Comfort Filter
    val colorFilter = remember(preferences.readingMode, isEyeComfortActive, eyeComfortIntensity) {
        val intensityFactor = eyeComfortIntensity / 100f

        when (preferences.readingMode) {
            ReadingMode.DARK -> {
                if (isEyeComfortActive && intensityFactor > 0f) {
                    val blueFactor = (1.0f - (intensityFactor * 0.35f)).coerceAtLeast(0.60f)
                    val greenFactor = (1.0f - (intensityFactor * 0.10f)).coerceAtLeast(0.85f)
                    val matrix = ColorMatrix(
                        floatArrayOf(
                            -1f, 0f, 0f, 0f, 255f,
                            0f, -greenFactor, 0f, 0f, 255f * greenFactor,
                            0f, 0f, -blueFactor, 0f, 255f * blueFactor,
                            0f, 0f, 0f, 1f, 0f
                        )
                    )
                    ColorFilter.colorMatrix(matrix)
                } else {
                    val matrix = ColorMatrix(
                        floatArrayOf(
                            -1f, 0f, 0f, 0f, 255f,
                            0f, -1f, 0f, 0f, 255f,
                            0f, 0f, -1f, 0f, 255f,
                            0f, 0f, 0f, 1f, 0f
                        )
                    )
                    ColorFilter.colorMatrix(matrix)
                }
            }
            ReadingMode.LIGHT -> {
                if (isEyeComfortActive && intensityFactor > 0f) {
                    val blueScale = (1.0f - (intensityFactor * 0.30f)).coerceAtLeast(0.65f)
                    val greenScale = (1.0f - (intensityFactor * 0.08f)).coerceAtLeast(0.88f)
                    val matrix = ColorMatrix().apply { setToScale(1.0f, greenScale, blueScale, 1.0f) }
                    ColorFilter.colorMatrix(matrix)
                } else {
                    null
                }
            }
        }
    }

    val backgroundColor = when (preferences.readingMode) {
        ReadingMode.DARK -> if (isEyeComfortActive && eyeComfortIntensity > 30) Color(0xFF151412) else Color(0xFF121316)
        ReadingMode.LIGHT -> if (isEyeComfortActive && eyeComfortIntensity > 30) Color(0xFFFAF6EC) else Color(0xFFF8F9FA)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundColor)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) {
                controlsVisible = !controlsVisible
            }
    ) {
        // Continuous Vertical Document Scrolling
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 60.dp)
        ) {
            items(totalPages) { pageIndex ->
                PdfPageView(
                    pageIndex = pageIndex,
                    viewModel = viewModel,
                    colorFilter = colorFilter
                )
                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
            }
        }

        // Top App Bar
        AnimatedVisibility(
            visible = controlsVisible,
            enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut(),
            modifier = Modifier.align(Alignment.TopCenter)
        ) {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = document.displayName,
                            maxLines = 1,
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = "p. \$currentPage/\$totalPages · \${preferences.readingMode.name} · \${preferences.orientation.name}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back to Library")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.toggleBookmark(currentPage) }) {
                        Icon(
                            if (isCurrentPageBookmarked) Icons.Default.Bookmark else Icons.Outlined.BookmarkBorder,
                            contentDescription = "Bookmark Page",
                            tint = if (isCurrentPageBookmarked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                        )
                    }
                    IconButton(onClick = { showBookmarksSheet = true }) {
                        Icon(Icons.Outlined.Bookmarks, contentDescription = "View Bookmarks")
                    }
                    IconButton(onClick = {
                        val next = if (preferences.orientation == ReaderOrientation.PORTRAIT) ReaderOrientation.LANDSCAPE else ReaderOrientation.PORTRAIT
                        onUpdateOrientation(next)
                    }) {
                        Icon(
                            if (preferences.orientation == ReaderOrientation.PORTRAIT) Icons.Default.StayCurrentPortrait else Icons.Default.StayCurrentLandscape,
                            contentDescription = "Screen Orientation: \${preferences.orientation}"
                        )
                    }
                    // Dedicated Eye Comfort Button
                    IconButton(onClick = { showEyeComfortPanel = true }) {
                        Icon(
                            Icons.Default.AutoAwesome,
                            contentDescription = "Eye Comfort Filter",
                            tint = if (isEyeComfortActive) Color(0xFFD97706) else MaterialTheme.colorScheme.onSurface
                        )
                    }
                    // Two PDF Reading Modes Switcher: Light <-> Dark
                    IconButton(onClick = {
                        val next = if (preferences.readingMode == ReadingMode.LIGHT) ReadingMode.DARK else ReadingMode.LIGHT
                        onUpdateReadingMode(next)
                    }) {
                        Icon(
                            if (preferences.readingMode == ReadingMode.DARK) Icons.Default.DarkMode else Icons.Default.LightMode,
                            contentDescription = "Toggle Reading Mode: \${preferences.readingMode}"
                        )
                    }
                    IconButton(onClick = { showBrightnessDialog = true }) {
                        Icon(Icons.Outlined.BrightnessMedium, contentDescription = "Adjust Brightness")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f)
                ),
                modifier = Modifier.statusBarsPadding()
            )
        }

        // Bottom Navigation Bar & Scrubber
        AnimatedVisibility(
            visible = controlsVisible,
            enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { it }) + fadeOut(),
            modifier = Modifier.align(Alignment.BottomCenter)
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                tonalElevation = 3.dp
            ) {
                Column(
                    modifier = Modifier
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                        .navigationBarsPadding()
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        IconButton(
                            onClick = {
                                if (currentPage > 1) {
                                    coroutineScope.launch {
                                        listState.animateScrollToItem(currentPage - 2)
                                    }
                                }
                            },
                            enabled = currentPage > 1
                        ) {
                            Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Page")
                        }

                        if (preferences.showPageIndicator) {
                            FilledTonalButton(
                                onClick = { showJumpDialog = true },
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Text("Page $currentPage of $totalPages")
                            }
                        } else {
                            TextButton(onClick = { showJumpDialog = true }) {
                                Text("Jump to Page")
                            }
                        }

                        IconButton(
                            onClick = {
                                if (currentPage < totalPages) {
                                    coroutineScope.launch {
                                        listState.animateScrollToItem(currentPage)
                                    }
                                }
                            },
                            enabled = currentPage < totalPages
                        ) {
                            Icon(Icons.Default.ChevronRight, contentDescription = "Next Page")
                        }
                    }

                    Slider(
                        value = currentPage.toFloat(),
                        onValueChange = { newPage ->
                            val target = newPage.toInt()
                            viewModel.onPageSelected(target)
                            coroutineScope.launch {
                                listState.scrollToItem(target - 1)
                            }
                        },
                        valueRange = 1f..totalPages.coerceAtLeast(1).toFloat(),
                        steps = (totalPages - 2).coerceAtLeast(0)
                    )
                }
            }
        }
    }

    // Jump to Page Dialog
    if (showJumpDialog) {
        JumpToPageDialog(
            currentPage = currentPage,
            totalPages = totalPages,
            onDismiss = { showJumpDialog = false },
            onJumpToPage = { target ->
                showJumpDialog = false
                viewModel.onPageSelected(target)
                coroutineScope.launch {
                    listState.scrollToItem(target - 1)
                }
            }
        )
    }

    // In-App Reading Brightness Dialog
    if (showBrightnessDialog) {
        AlertDialog(
            onDismissRequest = { showBrightnessDialog = false },
            title = { Text("In-App Reading Brightness") },
            text = {
                Column {
                    Text("Adjust window brightness for reading without leaving the app.")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Brightness: \${(preferences.brightness * 100).toInt()}%",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Slider(
                        value = preferences.brightness,
                        onValueChange = { onUpdateBrightness(it) },
                        valueRange = 0.15f..1.0f
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showBrightnessDialog = false }) {
                    Text("Done")
                }
            }
        )
    }

    // EYE COMFORT INTENSITY SLIDER PANEL
    if (showEyeComfortPanel) {
        AlertDialog(
            onDismissRequest = { showEyeComfortPanel = false },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        Icons.Default.AutoAwesome,
                        contentDescription = null,
                        tint = Color(0xFFD97706)
                    )
                    Text("Eye Comfort")
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text(
                        text = "Adjusts the warmth of the reading display.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onUpdateEyeComfortEnabled(!isEyeComfortActive) }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "Enable Eye Comfort",
                                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold)
                            )
                            Text(
                                text = "Works in both Light & Dark modes",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Switch(
                            checked = isEyeComfortActive,
                            onCheckedChange = { onUpdateEyeComfortEnabled(it) }
                        )
                    }

                    Divider()

                    Column(
                        modifier = Modifier.alpha(if (isEyeComfortActive) 1f else 0.4f),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Blue-light filter intensity",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
                            )
                            Text(
                                text = "\$eyeComfortIntensity%",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = Color(0xFFD97706)
                            )
                        }

                        Slider(
                            value = eyeComfortIntensity.toFloat(),
                            onValueChange = { onUpdateEyeComfortIntensity(it.toInt()) },
                            valueRange = 0f..100f,
                            enabled = isEyeComfortActive
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("0% (Neutral)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("100% (Warm amber)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            },
            confirmButton = {
                Button(onClick = { showEyeComfortPanel = false }) {
                    Text("Done")
                }
            }
        )
    }

    // Bookmarks Sheet
    if (showBookmarksSheet) {
        BookmarksSheet(
            bookmarks = document.bookmarks,
            onDismiss = { showBookmarksSheet = false },
            onSelectBookmark = { bm ->
                showBookmarksSheet = false
                viewModel.onPageSelected(bm.pageNumber)
                coroutineScope.launch {
                    listState.scrollToItem(bm.pageNumber - 1)
                }
            },
            onDeleteBookmark = { bm ->
                viewModel.removeBookmark(bm.id)
            }
        )
    }
}
`,
  },
  {
    path: 'android/app/src/main/java/com/pagenest/app/ui/screens/SettingsScreen.kt',
    name: 'SettingsScreen.kt',
    language: 'kotlin',
    description: 'Settings screen for AppTheme, 2 PDF Reading Modes (Light/Dark), Screen Orientation (Portrait/Landscape), and separate Eye Comfort blue-light filter',
    content: `package com.pagenest.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pagenest.app.model.AppTheme
import com.pagenest.app.model.ReaderOrientation
import com.pagenest.app.model.ReaderPreferences
import com.pagenest.app.model.ReadingMode
import com.pagenest.app.viewmodel.LibraryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    libraryViewModel: LibraryViewModel,
    onBack: () -> Unit
) {
    val preferences by libraryViewModel.preferences.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings & Reading Comfort") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Application Appearance
            item {
                Text(
                    text = "App Interface Theme",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Controls app navigation, library and dialogs.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        ThemeOptionRow(
                            title = "System Default",
                            subtitle = "Follows Android OS Dark/Light setting",
                            selected = preferences.appTheme == AppTheme.SYSTEM,
                            onClick = { libraryViewModel.updateAppTheme(AppTheme.SYSTEM) }
                        )
                        Divider()
                        ThemeOptionRow(
                            title = "Light Mode",
                            subtitle = "Clean off-white interface",
                            selected = preferences.appTheme == AppTheme.LIGHT,
                            onClick = { libraryViewModel.updateAppTheme(AppTheme.LIGHT) }
                        )
                        Divider()
                        ThemeOptionRow(
                            title = "Dark Mode",
                            subtitle = "AMOLED dark slate interface",
                            selected = preferences.appTheme == AppTheme.DARK,
                            onClick = { libraryViewModel.updateAppTheme(AppTheme.DARK) }
                        )
                    }
                }
            }

            // 2. TWO PDF READING MODES ONLY (Light & Dark)
            item {
                Text(
                    text = "PDF Reading Mode",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Applied to document pages during reading sessions (2 core modes).",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        ThemeOptionRow(
                            title = "Light Mode",
                            subtitle = "Light reading background and dark text. Ideal for daytime reading.",
                            selected = preferences.readingMode == ReadingMode.LIGHT,
                            onClick = { libraryViewModel.updateReadingMode(ReadingMode.LIGHT) }
                        )
                        Divider()
                        ThemeOptionRow(
                            title = "Dark Mode",
                            subtitle = "Dark reading background and light text. Preserves photos and diagrams.",
                            selected = preferences.readingMode == ReadingMode.DARK,
                            onClick = { libraryViewModel.updateReadingMode(ReadingMode.DARK) }
                        )
                    }
                }
            }

            // 3. SEPARATE EYE COMFORT CONTROL
            item {
                Text(
                    text = "Eye Comfort Filter",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Adjusts the warmth of the reading display. Independent filter active across Light & Dark modes.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { libraryViewModel.updateEyeComfortEnabled(!preferences.eyeComfortEnabled) },
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(
                                    text = "Enable Eye Comfort",
                                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold)
                                )
                                Text(
                                    text = "Warm blue-light reduction",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = preferences.eyeComfortEnabled,
                                onCheckedChange = { libraryViewModel.updateEyeComfortEnabled(it) }
                            )
                        }

                        Divider()

                        Column(
                            modifier = Modifier.alpha(if (preferences.eyeComfortEnabled) 1f else 0.4f),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Blue-light filter intensity",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
                                )
                                Text(
                                    text = "\${preferences.eyeComfortIntensity}%",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = Color(0xFFD97706)
                                )
                            }

                            Slider(
                                value = preferences.eyeComfortIntensity.toFloat(),
                                onValueChange = { libraryViewModel.updateEyeComfortIntensity(it.toInt()) },
                                valueRange = 0f..100f,
                                enabled = preferences.eyeComfortEnabled
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("0% (Neutral)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("100% (Warm amber)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }

            // 4. Screen Orientation
            item {
                Text(
                    text = "Preferred Screen Orientation",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Applied to the reader activity independently of device auto-rotate.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        ThemeOptionRow(
                            title = "Portrait",
                            subtitle = "Standard vertical reading layout",
                            selected = preferences.orientation == ReaderOrientation.PORTRAIT,
                            onClick = { libraryViewModel.updateOrientation(ReaderOrientation.PORTRAIT) }
                        )
                        Divider()
                        ThemeOptionRow(
                            title = "Landscape",
                            subtitle = "Widescreen reading with continuous vertical scroll",
                            selected = preferences.orientation == ReaderOrientation.LANDSCAPE,
                            onClick = { libraryViewModel.updateOrientation(ReaderOrientation.LANDSCAPE) }
                        )
                    }
                }
            }

            // 5. In-App Reading Brightness
            item {
                Text(
                    text = "In-App Reading Brightness",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Brightness: \${(preferences.brightness * 100).toInt()}%",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Slider(
                            value = preferences.brightness,
                            onValueChange = { libraryViewModel.updateBrightness(it) },
                            valueRange = 0.15f..1.0f
                        )
                    }
                }
            }

            // 6. Behavior toggles
            item {
                Text(
                    text = "Reader Behavior",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Keep Screen Awake", style = MaterialTheme.typography.bodyLarge)
                                Text("Prevents timeout while reading", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Switch(
                                checked = preferences.keepScreenAwake,
                                onCheckedChange = { libraryViewModel.updateKeepScreenAwake(it) }
                            )
                        }
                        Divider()
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Show Page Indicator", style = MaterialTheme.typography.bodyLarge)
                                Text("Shows page number in reader", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Switch(
                                checked = preferences.showPageIndicator,
                                onCheckedChange = { libraryViewModel.updateShowPageIndicator(it) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ThemeOptionRow(
    title: String,
    subtitle: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold)
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        if (selected) {
            Icon(
                Icons.Default.Check,
                contentDescription = "Selected",
                tint = MaterialTheme.colorScheme.primary
            )
        }
    }
}
`,
  },
  {
    path: 'android/app/src/main/java/com/pagenest/app/ui/theme/Color.kt',
    name: 'Color.kt',
    language: 'kotlin',
    description: 'Material 3 Color definitions with Eye Comfort warm cream & sepia palettes',
    content: `package com.pagenest.app.ui.theme

import androidx.compose.ui.graphics.Color

val LightPrimary = Color(0xFF2E6588)
val LightOnPrimary = Color(0xFFFFFFFF)
val LightPrimaryContainer = Color(0xFFCCE5FF)
val LightOnPrimaryContainer = Color(0xFF001D32)
val LightBackground = Color(0xFFF9F9FB)
val LightSurface = Color(0xFFFFFFFF)
val LightSurfaceVariant = Color(0xFFE2E7ED)

val DarkPrimary = Color(0xFF94CCF8)
val DarkOnPrimary = Color(0xFF00344F)
val DarkPrimaryContainer = Color(0xFF0F4C6F)
val DarkBackground = Color(0xFF111418)
val DarkSurface = Color(0xFF1A1D23)
val DarkSurfaceVariant = Color(0xFF272C35)

val SepiaBackground = Color(0xFFF6EEDB)
val SepiaSurface = Color(0xFFEDE4CE)
val SepiaSurfaceVariant = Color(0xFFE3D9C0)
val SepiaPrimary = Color(0xFF7A4A28)
val SepiaOnPrimary = Color(0xFFFFFFFF)
val SepiaText = Color(0xFF3B2E24)
`,
  },
  {
    path: 'android/app/src/main/java/com/pagenest/app/ui/theme/Theme.kt',
    name: 'Theme.kt',
    language: 'kotlin',
    description: 'Material 3 Theme implementation with dynamic system color and Sepia eye comfort mode',
    content: `package com.pagenest.app.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val LightColorScheme = lightColorScheme(
    primary = LightPrimary,
    onPrimary = LightOnPrimary,
    primaryContainer = LightPrimaryContainer,
    background = LightBackground,
    surface = LightSurface,
    surfaceVariant = LightSurfaceVariant
)

private val DarkColorScheme = darkColorScheme(
    primary = DarkPrimary,
    onPrimary = DarkOnPrimary,
    primaryContainer = DarkPrimaryContainer,
    background = DarkBackground,
    surface = DarkSurface,
    surfaceVariant = DarkSurfaceVariant
)

@Composable
fun PageNestTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
`,
  },
  {
    path: 'android/README.md',
    name: 'README.md',
    language: 'markdown',
    description: 'Android Studio build and compilation instructions for Two PDF Reading Modes & Independent Eye Comfort',
    content: `# PageNest - Native Android PDF Reader

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
  - **Portrait**: Requests \`ActivityInfo.SCREEN_ORIENTATION_PORTRAIT\`. Pages displayed in standard vertical portrait orientation with continuous vertical scroll.
  - **Landscape**: Requests \`ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE\`. Uses the wider screen width while preserving continuous vertical scrolling through document pages.
  - Independent of Android system auto-rotate setting.
  - Restored to \`SCREEN_ORIENTATION_UNSPECIFIED\` outside the reader.
- **Continuous Vertical Scrolling**:
  - Seamless continuous vertical scrolling across all orientations. Scroll position and bookmarks remain rock-solid across rotation.
- **Independent App Appearance**:
  - System Default, Light, or Dark for app navigation and dialogs, completely independent from PDF document pages.
- **In-App Reading Brightness**:
  - Adjust Activity window brightness (\`window.attributes.screenBrightness\`) without altering device-wide system settings. Restored upon leaving reader.

## Opening in Android Studio
1. Launch **Android Studio (Hedgehog or newer)**.
2. Select **Open** and choose this \`android/\` directory.
3. Gradle will sync automatically using Gradle 8.4 and Kotlin 1.9.23.
4. Connect an Android phone (API 26+) or launch an Android Virtual Device (AVD).
5. Click **Run** (\`Shift + F10\`) or execute in terminal:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
`,
  },
];
