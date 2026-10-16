package com.pagenest.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.StayCurrentLandscape
import androidx.compose.material.icons.filled.StayCurrentPortrait
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
                        // Enable Eye Comfort toggle
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

                        // Intensity slider
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
                                    text = "${preferences.eyeComfortIntensity}%",
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
                    text = "Brightness: ${(preferences.brightness * 100).toInt()}%",
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
