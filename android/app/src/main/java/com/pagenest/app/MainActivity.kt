package com.pagenest.app

import android.content.Intent
import android.content.pm.ActivityInfo
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
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

        // Handle initial intent when application is cold-started
        intent?.let { handleIncomingIntent(it) }

        setContent {
            val preferences by libraryViewModel.preferences.collectAsState()
            val currentScreen by libraryViewModel.currentScreen.collectAsState()
            val errorMessage by libraryViewModel.errorMessage.collectAsState()
            val snackbarHostState = remember { SnackbarHostState() }

            // Display error feedback when an external document cannot be opened
            LaunchedEffect(errorMessage) {
                errorMessage?.let { msg ->
                    snackbarHostState.showSnackbar(message = msg)
                    libraryViewModel.clearErrorMessage()
                }
            }

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
                            libraryViewModel.importDocumentFromUri(
                                context = this@MainActivity,
                                uri = uri,
                                autoOpen = true,
                                onReady = { doc ->
                                    readerViewModel.openDocument(doc)
                                    libraryViewModel.navigateTo(Screen.READER)
                                }
                            )
                        }
                    )
                }
            }
        }
    }

    /**
     * Handles incoming intents when the app is already running in background
     * or currently displaying another document in the reader.
     */
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent?.let { handleIncomingIntent(it) }
    }

    /**
     * Inspects incoming intent (ACTION_VIEW, ACTION_SEND, ACTION_SEND_MULTIPLE)
     * and securely opens the PDF directly in the reader screen.
     */
    private fun handleIncomingIntent(intent: Intent) {
        val action = intent.action ?: return

        when (action) {
            Intent.ACTION_VIEW -> {
                val uri: Uri? = intent.data ?: intent.clipData?.let { clip ->
                    if (clip.itemCount > 0) clip.getItemAt(0).uri else null
                }
                uri?.let { openSingleUri(it) }
            }

            Intent.ACTION_SEND -> {
                val uri: Uri? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra(Intent.EXTRA_STREAM)
                } ?: intent.clipData?.let { clip ->
                    if (clip.itemCount > 0) clip.getItemAt(0).uri else null
                } ?: intent.data

                uri?.let { openSingleUri(it) }
            }

            Intent.ACTION_SEND_MULTIPLE -> {
                val uris = mutableListOf<Uri>()
                val streamUris: ArrayList<Uri>? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM)
                }
                
                if (streamUris != null) {
                    uris.addAll(streamUris)
                } else {
                    intent.clipData?.let { clip ->
                        for (i in 0 until clip.itemCount) {
                            clip.getItemAt(i).uri?.let { uris.add(it) }
                        }
                    }
                }

                if (uris.isNotEmpty()) {
                    uris.forEach { takePersistablePermissions(it) }
                    libraryViewModel.openMultipleExternalDocuments(
                        context = this,
                        uris = uris,
                        onFirstDocumentReady = { doc ->
                            readerViewModel.openDocument(doc)
                            libraryViewModel.navigateTo(Screen.READER)
                        },
                        onError = { errorMsg ->
                            Toast.makeText(this, errorMsg, Toast.LENGTH_LONG).show()
                        }
                    )
                }
            }
        }
    }

    private fun openSingleUri(uri: Uri) {
        takePersistablePermissions(uri)
        libraryViewModel.openExternalDocument(
            context = this,
            uri = uri,
            onDocumentReady = { doc ->
                readerViewModel.openDocument(doc)
                libraryViewModel.navigateTo(Screen.READER)
            },
            onError = { errorMsg ->
                Toast.makeText(this, errorMsg, Toast.LENGTH_LONG).show()
            }
        )
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
        } catch (e: Exception) {
            // Graceful fallback for non-persistable content URIs (e.g. Gmail attachments)
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
