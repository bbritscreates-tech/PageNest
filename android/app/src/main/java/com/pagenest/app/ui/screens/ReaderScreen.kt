package com.pagenest.app.ui.screens

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
                // Dark Mode: Invert colors for night reading
                if (isEyeComfortActive && intensityFactor > 0f) {
                    // Soften inverted stark white into warm amber candlelight text
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
                // Light Mode: daytime presentation
                if (isEyeComfortActive && intensityFactor > 0f) {
                    // Warm amber / sepia tone preserving text contrast
                    val blueScale = (1.0f - (intensityFactor * 0.30f)).coerceAtLeast(0.65f)
                    val greenScale = (1.0f - (intensityFactor * 0.08f)).coerceAtLeast(0.88f)
                    val matrix = ColorMatrix().apply { setToScale(1.0f, greenScale, blueScale, 1.0f) }
                    ColorFilter.colorMatrix(matrix)
                } else {
                    null // Unmodified crisp PDF
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
        // Continuous Vertical Document Scrolling (In Both Portrait & Landscape)
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
                            text = "p. $currentPage/$totalPages · ${preferences.readingMode.name} · ${preferences.orientation.name}",
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
                    // Quick Bookmark
                    IconButton(onClick = { viewModel.toggleBookmark(currentPage) }) {
                        Icon(
                            if (isCurrentPageBookmarked) Icons.Default.Bookmark else Icons.Outlined.BookmarkBorder,
                            contentDescription = "Bookmark Page",
                            tint = if (isCurrentPageBookmarked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                        )
                    }

                    // Bookmarks List
                    IconButton(onClick = { showBookmarksSheet = true }) {
                        Icon(Icons.Outlined.Bookmarks, contentDescription = "View Bookmarks")
                    }

                    // Screen Orientation (Portrait / Landscape)
                    IconButton(onClick = {
                        val next = if (preferences.orientation == ReaderOrientation.PORTRAIT) ReaderOrientation.LANDSCAPE else ReaderOrientation.PORTRAIT
                        onUpdateOrientation(next)
                    }) {
                        Icon(
                            if (preferences.orientation == ReaderOrientation.PORTRAIT) Icons.Default.StayCurrentPortrait else Icons.Default.StayCurrentLandscape,
                            contentDescription = "Screen Orientation: ${preferences.orientation}"
                        )
                    }

                    // DEDICATED EYE COMFORT BUTTON: SEPARATE FROM READING MODE
                    IconButton(onClick = { showEyeComfortPanel = true }) {
                        Icon(
                            Icons.Default.AutoAwesome,
                            contentDescription = "Eye Comfort Filter",
                            tint = if (isEyeComfortActive) Color(0xFFD97706) else MaterialTheme.colorScheme.onSurface
                        )
                    }

                    // TWO PDF READING MODES ONLY: LIGHT MODE <-> DARK MODE SWITCHER
                    IconButton(onClick = {
                        val next = if (preferences.readingMode == ReadingMode.LIGHT) ReadingMode.DARK else ReadingMode.LIGHT
                        onUpdateReadingMode(next)
                    }) {
                        Icon(
                            if (preferences.readingMode == ReadingMode.DARK) Icons.Default.DarkMode else Icons.Default.LightMode,
                            contentDescription = "Toggle Reading Mode: ${preferences.readingMode}"
                        )
                    }

                    // In-app Brightness
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

                    // Scrubber Slider
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
                        text = "Brightness: ${(preferences.brightness * 100).toInt()}%",
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

                    // Enable Eye Comfort toggle
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

                    // Blue-light filter intensity slider
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
                                text = "$eyeComfortIntensity%",
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

@Composable
fun PdfPageView(
    pageIndex: Int,
    viewModel: ReaderViewModel,
    colorFilter: ColorFilter?
) {
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }

    LaunchedEffect(pageIndex) {
        viewModel.renderPage(pageIndex, 1080).onSuccess {
            bitmap = it
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        if (bitmap != null) {
            Image(
                bitmap = bitmap!!.asImageBitmap(),
                contentDescription = "Page ${pageIndex + 1}",
                modifier = Modifier
                    .fillMaxWidth()
                    .wrapContentHeight(),
                contentScale = ContentScale.FillWidth,
                colorFilter = colorFilter
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
                    .background(Color.LightGray.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(modifier = Modifier.size(28.dp))
            }
        }
    }
}
