package com.pagenest.app.model

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
