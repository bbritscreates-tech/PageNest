package com.pagenest.app.pdf

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
