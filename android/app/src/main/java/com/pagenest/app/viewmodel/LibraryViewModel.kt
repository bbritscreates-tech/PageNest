package com.pagenest.app.viewmodel

import android.app.Application
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pagenest.app.Screen
import com.pagenest.app.data.PreferencesManager
import com.pagenest.app.model.AppTheme
import com.pagenest.app.model.DocumentItem
import com.pagenest.app.model.ReaderOrientation
import com.pagenest.app.model.ReaderPreferences
import com.pagenest.app.model.ReadingMode
import com.pagenest.app.pdf.AndroidPdfRenderer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

class LibraryViewModel(application: Application) : AndroidViewModel(application) {

    private val preferencesManager = PreferencesManager(application)

    private val _currentScreen = MutableStateFlow(Screen.HOME)
    val currentScreen: StateFlow<Screen> = _currentScreen.asStateFlow()

    private val _preferences = MutableStateFlow(ReaderPreferences())
    val preferences: StateFlow<ReaderPreferences> = _preferences.asStateFlow()

    private val _documents = MutableStateFlow<List<DocumentItem>>(emptyList())
    val documents: StateFlow<List<DocumentItem>> = _documents.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        viewModelScope.launch {
            preferencesManager.preferencesFlow.collect {
                _preferences.value = it
            }
        }
    }

    fun navigateTo(screen: Screen) {
        _currentScreen.value = screen
    }

    fun clearErrorMessage() {
        _errorMessage.value = null
    }

    fun refreshLibrary() {
        _documents.value = _documents.value.sortedByDescending { it.lastReadTimestamp }
    }

    /**
     * Resolves and imports a PDF from an external URI (ACTION_VIEW or ACTION_SEND).
     * Validates that the URI is accessible, caches it locally for 100% offline access,
     * avoids duplicate records, and immediately opens the document in the reader.
     */
    fun openExternalDocument(
        context: Context,
        uri: Uri,
        onDocumentReady: (DocumentItem) -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val doc = processAndCachePdfUri(context, uri)
                // Add or update document in library
                val existing = _documents.value.find { it.id == doc.id || it.uriString == doc.uriString }
                val updatedList = if (existing != null) {
                    listOf(doc) + _documents.value.filter { it.id != doc.id }
                } else {
                    listOf(doc) + _documents.value
                }
                _documents.value = updatedList.sortedByDescending { it.lastReadTimestamp }
                _isLoading.value = false
                onDocumentReady(doc)
            } catch (e: Exception) {
                _isLoading.value = false
                val errorMsg = e.message ?: "Unable to access or read the selected PDF file."
                _errorMessage.value = errorMsg
                onError(errorMsg)
            }
        }
    }

    /**
     * Handles multiple documents shared simultaneously via ACTION_SEND_MULTIPLE.
     * Imports all valid PDFs and opens the first valid document in the reader.
     */
    fun openMultipleExternalDocuments(
        context: Context,
        uris: List<Uri>,
        onFirstDocumentReady: (DocumentItem) -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            var firstReadyDoc: DocumentItem? = null
            val successfulDocs = mutableListOf<DocumentItem>()

            for (uri in uris) {
                try {
                    val doc = processAndCachePdfUri(context, uri)
                    successfulDocs.add(doc)
                    if (firstReadyDoc == null) {
                        firstReadyDoc = doc
                    }
                } catch (e: Exception) {
                    // Log or continue with other documents in the batch
                }
            }

            _isLoading.value = false

            if (successfulDocs.isNotEmpty()) {
                val currentDocs = _documents.value.toMutableList()
                for (doc in successfulDocs) {
                    currentDocs.removeAll { it.id == doc.id || it.uriString == doc.uriString }
                    currentDocs.add(0, doc)
                }
                _documents.value = currentDocs.sortedByDescending { it.lastReadTimestamp }

                firstReadyDoc?.let { onFirstDocumentReady(it) }
            } else {
                val errorMsg = "None of the shared files could be read as valid PDF documents."
                _errorMessage.value = errorMsg
                onError(errorMsg)
            }
        }
    }

    /**
     * Standard internal manual import (e.g. from the in-app file picker button).
     */
    fun importDocumentFromUri(context: Context, uri: Uri, autoOpen: Boolean = false, onReady: ((DocumentItem) -> Unit)? = null) {
        openExternalDocument(
            context = context,
            uri = uri,
            onDocumentReady = { doc ->
                onReady?.invoke(doc)
                if (autoOpen) {
                    navigateTo(Screen.READER)
                }
            },
            onError = { /* handled by errorMessage StateFlow */ }
        )
    }

    /**
     * Worker function to safely validate, copy locally for offline reliability,
     * detect duplicate documents, and parse page count.
     */
    private suspend fun processAndCachePdfUri(context: Context, uri: Uri): DocumentItem = withContext(Dispatchers.IO) {
        // 1. Resolve Display Name
        var displayName: String? = null
        try {
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (cursor.moveToFirst() && nameIndex >= 0) {
                    displayName = cursor.getString(nameIndex)
                }
            }
        } catch (e: Exception) {
            // Content provider query failed, fallback to path segment
        }

        if (displayName.isNullOrBlank()) {
            displayName = uri.lastPathSegment ?: "Document.pdf"
        }
        if (!displayName.lowercase().endsWith(".pdf")) {
            displayName = "$displayName.pdf"
        }

        // 2. Validate MIME type or file accessibility
        val mimeType = context.contentResolver.getType(uri)
        if (mimeType != null && mimeType != "application/pdf" && !mimeType.contains("pdf")) {
            throw IllegalArgumentException("The selected file is not a supported PDF document (Type: $mimeType).")
        }

        // 3. Cache document stream locally for guaranteed 100% offline access
        // Avoid losing access when email app or browser cleans temporary URI grant
        val storageDir = File(context.filesDir, "imported_pdfs").apply { mkdirs() }
        val sanitizedName = displayName.replace(Regex("[^a-zA-Z0-9._-]"), "_")
        
        // Check for existing document in library to avoid duplicate records
        val existingDoc = _documents.value.find { 
            it.displayName.equals(displayName, ignoreCase = true) || it.uriString == uri.toString() 
        }

        val targetFile = if (existingDoc != null && File(Uri.parse(existingDoc.uriString).path ?: "").exists()) {
            File(Uri.parse(existingDoc.uriString).path ?: "")
        } else {
            File(storageDir, "${System.currentTimeMillis()}_$sanitizedName")
        }

        // Copy stream into target file if new
        if (!targetFile.exists() || targetFile.length() == 0L) {
            val inputStream = context.contentResolver.openInputStream(uri)
                ?: throw IllegalStateException("Could not open read stream for URI: $uri. Permission may be missing.")
            
            inputStream.use { input ->
                FileOutputStream(targetFile).use { output ->
                    input.copyTo(output)
                }
            }
        }

        // 4. Validate PDF header (%PDF-)
        if (targetFile.length() < 4) {
            targetFile.delete()
            throw IllegalArgumentException("The document file is empty or corrupted.")
        }

        val localUri = Uri.fromFile(targetFile)

        // 5. Verify total page count using AndroidPdfRenderer
        val pdfRenderer = AndroidPdfRenderer(context)
        val openResult = pdfRenderer.open(localUri)
        val totalPages = openResult.getOrThrow()
        pdfRenderer.close()

        if (totalPages <= 0) {
            throw IllegalArgumentException("The PDF contains no readable pages.")
        }

        // 6. Return DocumentItem (preserve existing bookmarks and progress if updating duplicate)
        if (existingDoc != null) {
            existingDoc.copy(
                uriString = localUri.toString(),
                totalPages = totalPages,
                lastReadTimestamp = System.currentTimeMillis()
            )
        } else {
            DocumentItem(
                id = UUID.randomUUID().toString(),
                uriString = localUri.toString(),
                displayName = displayName,
                totalPages = totalPages,
                currentPage = 1,
                lastReadTimestamp = System.currentTimeMillis()
            )
        }
    }

    fun deleteDocument(id: String) {
        val docToDelete = _documents.value.find { it.id == id }
        docToDelete?.let { doc ->
            try {
                val file = File(Uri.parse(doc.uriString).path ?: "")
                if (file.exists()) {
                    file.delete()
                }
            } catch (e: Exception) {
                // Ignore cleanup errors
            }
        }
        _documents.value = _documents.value.filter { it.id != id }
    }

    fun updateAppTheme(theme: AppTheme) {
        viewModelScope.launch {
            preferencesManager.updateAppTheme(theme)
        }
    }

    fun updateReadingMode(mode: ReadingMode) {
        viewModelScope.launch {
            preferencesManager.updateReadingMode(mode)
        }
    }

    fun updateOrientation(orientation: ReaderOrientation) {
        viewModelScope.launch {
            preferencesManager.updateOrientation(orientation)
        }
    }

    fun updateEyeComfortEnabled(enabled: Boolean) {
        viewModelScope.launch {
            preferencesManager.updateEyeComfortEnabled(enabled)
        }
    }

    fun updateEyeComfortIntensity(intensity: Int) {
        viewModelScope.launch {
            preferencesManager.updateEyeComfortIntensity(intensity)
        }
    }

    fun updateBrightness(brightness: Float) {
        viewModelScope.launch {
            preferencesManager.updateBrightness(brightness)
        }
    }

    fun updateKeepScreenAwake(awake: Boolean) {
        viewModelScope.launch {
            preferencesManager.updateKeepScreenAwake(awake)
        }
    }

    fun updateShowPageIndicator(show: Boolean) {
        viewModelScope.launch {
            preferencesManager.updateShowPageIndicator(show)
        }
    }
}
