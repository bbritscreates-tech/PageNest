package com.pagenest.app.viewmodel

import android.app.Application
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pagenest.app.model.Bookmark
import com.pagenest.app.model.DocumentItem
import com.pagenest.app.pdf.AndroidPdfRenderer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

class ReaderViewModel(application: Application) : AndroidViewModel(application) {

    private val pdfRenderer = AndroidPdfRenderer(application)

    private val _activeDocument = MutableStateFlow<DocumentItem?>(null)
    val activeDocument: StateFlow<DocumentItem?> = _activeDocument.asStateFlow()

    private val _currentPage = MutableStateFlow(1)
    val currentPage: StateFlow<Int> = _currentPage.asStateFlow()

    private val _totalPages = MutableStateFlow(1)
    val totalPages: StateFlow<Int> = _totalPages.asStateFlow()

    fun openDocument(document: DocumentItem) {
        _activeDocument.value = document
        _currentPage.value = document.currentPage.coerceAtLeast(1)
        _totalPages.value = document.totalPages.coerceAtLeast(1)

        viewModelScope.launch {
            val uri = Uri.parse(document.uriString)
            val countResult = pdfRenderer.open(uri)
            countResult.onSuccess { count ->
                _totalPages.value = count
            }
        }
    }

    suspend fun loadPageBitmap(pageIndex: Int, targetWidth: Int = 1080): Result<Bitmap> {
        return pdfRenderer.renderPage(pageIndex, targetWidth)
    }

    fun onPageSelected(page: Int) {
        val clamped = page.coerceIn(1, _totalPages.value)
        _currentPage.value = clamped
        _activeDocument.value = _activeDocument.value?.copy(
            currentPage = clamped,
            lastReadTimestamp = System.currentTimeMillis()
        )
    }

    fun toggleBookmark(pageNumber: Int) {
        val doc = _activeDocument.value ?: return
        val existing = doc.bookmarks.find { it.pageNumber == pageNumber }
        val updatedBookmarks = if (existing != null) {
            doc.bookmarks.filter { it.id != existing.id }
        } else {
            doc.bookmarks + Bookmark(
                id = UUID.randomUUID().toString(),
                pageNumber = pageNumber,
                label = "Page \$pageNumber"
            )
        }
        _activeDocument.value = doc.copy(bookmarks = updatedBookmarks)
    }

    fun removeBookmark(id: String) {
        val doc = _activeDocument.value ?: return
        _activeDocument.value = doc.copy(
            bookmarks = doc.bookmarks.filter { it.id != id }
        )
    }

    override fun onCleared() {
        super.onCleared()
        pdfRenderer.close()
    }
}
