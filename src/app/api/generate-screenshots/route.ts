import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import JSZip from 'jszip'

const DEVICE_TEMPLATES = {
  'iphone-15-pro-max': { width: 1290, height: 2796 },
  'iphone-15-pro': { width: 1179, height: 2556 },
  'iphone-15-plus': { width: 1284, height: 2778 },
  'iphone-15': { width: 1179, height: 2556 }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const optionsStr = formData.get('options') as string
    const options = JSON.parse(optionsStr)

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    let inputBuffer: Buffer
    try {
      if (file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer()
        inputBuffer = Buffer.from(arrayBuffer)
      } else if (typeof file === 'string') {
        // Remove data URL prefix if exists
        const base64Data = file.replace(/^data:image\/\w+;base64,/, '')
        inputBuffer = Buffer.from(base64Data, 'base64')
      } else {
        throw new Error('Invalid file format')
      }

      // Validate buffer
      if (!Buffer.isBuffer(inputBuffer) || inputBuffer.length === 0) {
        throw new Error('Invalid buffer')
      }

      // Validate image format
      const metadata = await sharp(inputBuffer).metadata()
      if (!metadata || !metadata.format) {
        throw new Error('Invalid image format')
      }

    } catch (error) {
      console.error('Error validating input:', error)
      throw new Error('Invalid input file')
    }

    // Create ZIP archive
    const zip = new JSZip()

    // Get device dimensions
    const deviceType = options.deviceType || 'iphone-15-pro'
    const dimensions = DEVICE_TEMPLATES[deviceType as keyof typeof DEVICE_TEMPLATES]
    
    if (!dimensions) {
      throw new Error('Invalid device type')
    }

    try {
      // Create a new sharp instance
      const processedBuffer = await sharp(inputBuffer, {
        failOnError: false // Try to process even if the input is not perfect
      })
        .rotate() // Auto-rotate based on EXIF
        .resize(dimensions.width, dimensions.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer()

      // Add to ZIP
      const fileName = `screenshot-${deviceType}-${Date.now()}.png`
      zip.file(fileName, processedBuffer)

      // Generate final ZIP
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename=app-screenshots.zip'
        }
      })
    } catch (error) {
      console.error('Error processing image:', error)
      throw new Error('Failed to process image')
    }
  } catch (error) {
    console.error('Screenshot generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate screenshots' },
      { status: 500 }
    )
  }
} 