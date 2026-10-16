package com.pagenest.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun JumpToPageDialog(
    currentPage: Int,
    totalPages: Int,
    onDismiss: () -> Unit,
    onJumpToPage: (Int) -> Unit
) {
    var sliderValue by remember { mutableFloatStateOf(currentPage.toFloat()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Jump to Page") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Page \${sliderValue.toInt()} of \$totalPages",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(16.dp))
                Slider(
                    value = sliderValue,
                    onValueChange = { sliderValue = it },
                    valueRange = 1f..totalPages.toFloat(),
                    steps = (totalPages - 2).coerceAtLeast(0)
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onJumpToPage(sliderValue.toInt()) },
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Jump")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
