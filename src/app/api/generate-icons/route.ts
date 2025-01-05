import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import JSZip from 'jszip'

const ICON_SIZES = [
  { size: 20, scales: [1, 2, 3], idiom: "iphone", role: "notification" },
  { size: 29, scales: [2, 3], idiom: "iphone", role: "settings" },
  { size: 40, scales: [2, 3], idiom: "iphone", role: "spotlight" },
  { size: 60, scales: [2, 3], idiom: "iphone", role: "app" },
  { size: 20, scales: [1, 2], idiom: "ipad", role: "notification" },
  { size: 29, scales: [1, 2], idiom: "ipad", role: "settings" },
  { size: 40, scales: [1, 2], idiom: "ipad", role: "spotlight" },
  { size: 76, scales: [1, 2], idiom: "ipad", role: "app" },
  { size: 83.5, scales: [2], idiom: "ipad", role: "app" },
  { size: 1024, scales: [1], idiom: "ios-marketing", role: "app-store" },
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const optionsStr = formData.get('options')

    if (!file) {
      throw new Error('No file provided')
    }

    const options = optionsStr ? JSON.parse(optionsStr as string) : {}

    let buffer: Buffer
    if (typeof file === 'string' && file.startsWith('data:')) {
      // Handle base64 data URL
      const base64Data = file.split(',')[1]
      buffer = Buffer.from(base64Data, 'base64')
    } else if (file instanceof Blob) {
      // Handle file upload
      buffer = Buffer.from(await file.arrayBuffer())
    } else {
      throw new Error('Invalid file format')
    }

    console.log('Successfully created buffer from input')
    const zip = new JSZip()
    const contentsJson = {
      images: [] as any[],
      info: {
        version: 1,
        author: "App Store Asset Generator"
      }
    }

    // Generate icons for each size and scale
    for (const { size, scales, idiom, role } of ICON_SIZES) {
      for (const scale of scales) {
        console.log(`Generating icon for size: ${size}, scale: ${scale}`)
        const pixelSize = Math.round(size * scale)
        const fileName = `AppIcon-${idiom}-${size}x${size}@${scale}x.png`
        
        try {
          const image = sharp(buffer)
            .resize(pixelSize, pixelSize, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })

          // Apply border if specified
          if (options.borderWidth > 0) {
            console.log('Applying border...')
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
            console.log('Applying border radius...')
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
            console.log('Applying shadow...')
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

          console.log(`Adding ${fileName} to zip...`)
          zip.file(fileName, await image.png().toBuffer())
          
          // Add entry to Contents.json
          contentsJson.images.push({
            size: `${size}x${size}`,
            idiom: idiom,
            filename: fileName,
            scale: `${scale}x`,
            role: role
          })

        } catch (error) {
          console.error(`Error processing size ${size}x${scale}:`, error)
          throw error
        }
      }
    }

    // Add Contents.json to the zip
    console.log('Adding Contents.json to zip...')
    zip.file('Contents.json', JSON.stringify(contentsJson, null, 2))

    console.log('Generating final zip file...')
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    console.log('Icon generation completed successfully')
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=AppIcon.appiconset.zip'
      }
    })
  } catch (error) {
    console.error('Icon generation error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate icons' },
      { status: 500 }
    )
  }
} 