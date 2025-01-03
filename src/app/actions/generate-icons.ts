'use server'

import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import type { GeneratedAsset } from '@/types/user'

export async function generateIcons(buffer: Buffer) {
  try {
    const sizes = [
      { size: 1024, name: 'iTunesArtwork@2x.png' },
      { size: 180, name: 'Icon-60@3x.png' },
      { size: 120, name: 'Icon-60@2x.png' },
      { size: 167, name: 'Icon-83.5@2x.png' },
      { size: 152, name: 'Icon-76@2x.png' },
      { size: 76, name: 'Icon-76.png' },
      { size: 40, name: 'Icon-40.png' },
      { size: 80, name: 'Icon-40@2x.png' },
      { size: 120, name: 'Icon-40@3x.png' },
      { size: 58, name: 'Icon-29@2x.png' },
      { size: 87, name: 'Icon-29@3x.png' },
      { size: 20, name: 'Icon-20.png' },
      { size: 40, name: 'Icon-20@2x.png' },
      { size: 60, name: 'Icon-20@3x.png' },
    ]

    const generatedAssets: GeneratedAsset[] = []

    for (const { size, name } of sizes) {
      const resized = await sharp(buffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer()

      generatedAssets.push({
        id: uuidv4(),
        type: 'icon',
        name,
        size: `${size}x${size}`,
        url: `data:image/png;base64,${resized.toString('base64')}`,
        createdAt: Date.now()
      })
    }

    // Contents.json oluştur
    const contents = {
      images: sizes.map(({ size, name }) => ({
        size: `${size}x${size}`,
        idiom: size >= 76 && size <= 167 ? "ipad" : "iphone",
        filename: name,
        scale: name.includes("@2x") ? "2x" : name.includes("@3x") ? "3x" : "1x"
      })),
      info: {
        version: 1,
        author: "App Store Asset Generator"
      }
    }

    // Contents.json'ı da assets'e ekle
    generatedAssets.push({
      id: uuidv4(),
      type: 'icon',
      name: 'Contents.json',
      size: 'json',
      url: `data:application/json;base64,${Buffer.from(JSON.stringify(contents, null, 2)).toString('base64')}`,
      createdAt: Date.now()
    })

    return generatedAssets
  } catch (error) {
    console.error('Error generating icons:', error)
    throw error
  }
} 