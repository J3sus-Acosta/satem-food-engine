/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { ApiResponse } from '@/types'

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ imageUrl: string }>>> {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as Blob | null

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const originalName = (file as any).name || 'product-image.png'
    const ext = path.extname(originalName) || '.png'

    // Sanitize filename
    const sanitizedName = originalName
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    const finalFilename = `${sanitizedName}-${Date.now()}${ext}`

    // Target directory
    const targetDir = path.join(process.cwd(), 'public', 'images', 'products')
    await fs.mkdir(targetDir, { recursive: true })

    const finalPath = path.join(targetDir, finalFilename)
    await fs.writeFile(finalPath, buffer)

    return NextResponse.json({
      data: {
        imageUrl: `/images/products/${finalFilename}`,
      },
    })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/catalog/products/upload-image] Error uploading image:', err)
    return NextResponse.json({ error: err.message || 'Error al subir la imagen' }, { status: 500 })
  }
}
