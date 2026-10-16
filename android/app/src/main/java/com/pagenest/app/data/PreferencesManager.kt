package com.pagenest.app.data

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
