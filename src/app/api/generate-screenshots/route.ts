import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import JSZip from 'jszip'

const DEVICE_TEMPLATES = [
  // iPhone 15 Series
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    width: 1290,
    height: 2796,
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    width: 1179,
    height: 2556,
  },
  // ... add other templates as needed
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const optionsStr = formData.get('options') as string
    const options = JSON.parse(optionsStr)

    if (!files.length) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Get template dimensions
    const template = DEVICE_TEMPLATES.find(t => t.id === options.template)
    if (!template) {
      return NextResponse.json(
        { error: 'Invalid template' },
        { status: 400 }
      )
    }

    // Create a ZIP file
    const zip = new JSZip()

    // Process each image
    await Promise.all(files.map(async (file, index) => {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Process image with sharp
      const processedBuffer = await sharp(buffer)
        // First resize to fill the dimensions while maintaining aspect ratio
        .resize({
          width: template.width,
          height: template.height,
          fit: 'cover',
          position: 'center',
          background: options.backgroundColor || '#FFFFFF'
        })
        // Then add padding if specified
        .extend({
          top: options.padding || 0,
          bottom: options.padding || 0,
          left: options.padding || 0,
          right: options.padding || 0,
          background: options.backgroundColor || '#FFFFFF'
        })
        .jpeg({
          quality: options.quality || 90
        })
        .toBuffer()

      // Add the processed image to the ZIP with a numbered filename
      const filename = files.length === 1 
        ? `${template.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
        : `${template.name.toLowerCase().replace(/\s+/g, '-')}-${index + 1}.jpg`

      zip.file(filename, processedBuffer)
    }))

    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    })

    // Return the ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=screenshots.zip'
      }
    })
  } catch (error) {
    console.error('Screenshot generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate screenshots' },
      { status: 500 }
    )
  }
} 