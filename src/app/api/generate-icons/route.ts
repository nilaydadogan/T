import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import JSZip from 'jszip'

const ICON_SIZES = [
  { size: 20, scales: [2, 3] },
  { size: 29, scales: [2, 3] },
  { size: 40, scales: [2, 3] },
  { size: 60, scales: [2, 3] },
  { size: 76, scales: [1, 2] },
  { size: 83.5, scales: [2] },
  { size: 1024, scales: [1] }, // App Store
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const optionsStr = formData.get('options') as string
    const options = JSON.parse(optionsStr)

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const zip = new JSZip()

    // Generate icons for each size and scale
    for (const { size, scales } of ICON_SIZES) {
      for (const scale of scales) {
        const pixelSize = Math.round(size * scale)
        const image = sharp(buffer)
          .resize(pixelSize, pixelSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })

        // Apply border if specified
        if (options.borderWidth > 0) {
          image.extend({
            top: options.borderWidth,
            bottom: options.borderWidth,
            left: options.borderWidth,
            right: options.borderWidth,
            background: options.borderColor
          })
        }

        // Apply border radius if specified
        if (options.borderRadius > 0) {
          const mask = Buffer.from(
            `<svg><rect x="0" y="0" width="${pixelSize}" height="${pixelSize}" rx="${options.borderRadius}" ry="${options.borderRadius}"/></svg>`
          )
          image.composite([{
            input: mask,
            blend: 'dest-in'
          }])
        }

        // Apply shadow if enabled
        if (options.shadow) {
          image.extend({
            top: options.shadow.blur,
            bottom: options.shadow.blur,
            left: options.shadow.blur,
            right: options.shadow.blur,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .blur(options.shadow.blur)
          .composite([{
            input: await image.toBuffer(),
            blend: 'over'
          }])
        }

        const fileName = `Icon-App-${size}x${size}@${scale}x.png`
        zip.file(fileName, await image.png().toBuffer())
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=app-icons.zip'
      }
    })
  } catch (error) {
    console.error('Error generating icons:', error)
    return NextResponse.json(
      { error: 'Failed to generate icons' },
      { status: 500 }
    )
  }
} 