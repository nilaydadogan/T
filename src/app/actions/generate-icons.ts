'use server'

import sharp from 'sharp'
import type { GeneratedAsset } from '@/types'

// Define icon sizes for iOS
const ICON_SIZES = [
  { size: 1024, name: 'icon-1024.png' },
  { size: 180, name: 'icon-180.png' },
  { size: 167, name: 'icon-167.png' },
  { size: 152, name: 'icon-152.png' },
  { size: 120, name: 'icon-120.png' },
  { size: 87, name: 'icon-87.png' },
  { size: 80, name: 'icon-80.png' },
  { size: 76, name: 'icon-76.png' },
  { size: 60, name: 'icon-60.png' },
  { size: 58, name: 'icon-58.png' },
  { size: 40, name: 'icon-40.png' },
  { size: 29, name: 'icon-29.png' },
  { size: 20, name: 'icon-20.png' },
]

export async function generateIcons(base64Image: string) {
  try {
    console.log('Starting icon generation on server')
    
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
    
    if (metadata.width < 1024 || metadata.height < 1024) {
      throw new Error('Image must be at least 1024x1024 pixels')
    }
    
    // Generate icons for each size
    const assets: GeneratedAsset[] = []
    
    for (const { size, name } of ICON_SIZES) {
      console.log(`Generating ${name} (${size}x${size})`)
      
      const resized = await image
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer()
      
      assets.push({
        name,
        size: `${size}x${size}`,
        url: `data:image/png;base64,${resized.toString('base64')}`
      })
    }
    
    console.log('Icon generation complete')
    return { assets }
  } catch (error) {
    console.error('Icon generation failed:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to generate icons'
    }
  }
} 