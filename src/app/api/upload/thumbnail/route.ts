import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { verifyToken } from '@/lib/auth'
import { resizeImageToThumbnail } from '@/lib/serverImageUtils'
import { generateThumbnailFilename } from '@/lib/imageUtils'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the form data
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Only JPG and PNG images are allowed' 
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size must be less than 5MB' 
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Resize image to thumbnail dimensions
    const resizeResult = await resizeImageToThumbnail(buffer)
    if (!resizeResult.success) {
      return NextResponse.json({ 
        error: resizeResult.error || 'Failed to process image' 
      }, { status: 500 })
    }

    // Generate unique filename
    const filename = generateThumbnailFilename(file.name)
    const path = join(process.cwd(), 'public', 'uploads', 'thumbnails', filename)

    // Save the resized image
    await writeFile(path, resizeResult.resizedBuffer!)

    // Return the public URL
    const publicUrl = `/uploads/thumbnails/${filename}`

    return NextResponse.json({
      success: true,
      filename,
      url: publicUrl
    })

  } catch (error) {
    console.error('Thumbnail upload error:', error)
    return NextResponse.json({
      error: 'Failed to upload thumbnail'
    }, { status: 500 })
  }
}
