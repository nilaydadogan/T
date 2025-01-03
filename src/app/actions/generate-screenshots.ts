'use server'

import sharp from 'sharp'
import type { GeneratedAsset, ScreenshotTemplate, TextOverlay } from '@/types'

interface GenerateOptions {
  backgroundColor: string
  padding: number
  quality: number
  useFrame: boolean
  overlays: TextOverlay[]
}

export async function generateScreenshots(
  base64Image: string,
  template: ScreenshotTemplate,
  options: GenerateOptions
) {
  try {
    console.log('Starting screenshot generation on server')
    
    // Convert base64 to Buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    // Load image with sharp
    const image = sharp(imageBuffer)
    
    // Get image metadata
    const metadata = await image.metadata()
    console.log('Image metadata:', metadata)
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions')
    }

    // Calculate dimensions with padding
    const finalWidth = template.width + (options.padding * 2)
    const finalHeight = template.height + (options.padding * 2)

    // Create base image with background
    const baseImage = sharp({
      create: {
        width: finalWidth,
        height: finalHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })

    // Resize screenshot to fit template
    const resized = await image
      .resize(template.width, template.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer()

    // Composite layers
    const layers = [
      {
        input: resized,
        top: options.padding,
        left: options.padding
      }
    ]

    // Add overlays
    for (const overlay of options.overlays) {
      const textImage = await sharp({
        text: {
          text: overlay.text,
          font: overlay.fontFamily,
          fontSize: overlay.fontSize,
          align: overlay.align,
          rgba: true
        }
      }).toBuffer()

      layers.push({
        input: textImage,
        top: overlay.position.y,
        left: overlay.position.x
      })
    }

    // Generate final image
    const final = await baseImage
      .composite(layers)
      .png()
      .toBuffer()

    // Return single asset
    const asset: GeneratedAsset = {
      name: `${template.name}.png`,
      size: `${finalWidth}x${finalHeight}`,
      url: `data:image/png;base64,${final.toString('base64')}`
    }

    console.log('Screenshot generation complete')
    return { assets: [asset] }
  } catch (error) {
    console.error('Screenshot generation failed:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to generate screenshot'
    }
  }
} 