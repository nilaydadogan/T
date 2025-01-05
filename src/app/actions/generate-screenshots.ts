'use server'

import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import type { GeneratedAsset } from '@/types/user'

interface TextOverlay {
  text: string
  fontSize?: number
  color?: string
  x?: number
  y?: number
}

interface ScreenshotOptions {
  overlays: TextOverlay[]
  width?: number
  height?: number
  quality?: number
}

function createSVGText(text: string, fontSize: number = 48, color: string = '#000000') {
  return Buffer.from(`
    <svg width="100%" height="100%">
      <style>
        .text {
          font-family: Arial, sans-serif;
          font-size: ${fontSize}px;
          fill: ${color};
        }
      </style>
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        class="text"
      >${text}</text>
    </svg>
  `)
}

export async function generateScreenshots(buffer: Buffer, options: ScreenshotOptions) {
  try {
    const generatedAssets: GeneratedAsset[] = []

    // Base image'i hazırla ve yüksek kalitede tut
    const baseImage = sharp(buffer)
      .png({ quality: options.quality || 100 }) // Yüksek kalite için quality parametresi

    const metadata = await baseImage.metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions')
    }

    // İstenen boyuta resize et, kaliteyi koru
    if (options.width && options.height) {
      baseImage.resize(options.width, options.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        withoutEnlargement: false, // Yüksek kalite için büyütmeye izin ver
      })
    }

    const baseBuffer = await baseImage.toBuffer()

    // Her overlay için
    for (const overlay of options.overlays) {
      // SVG text oluştur
      const svgBuffer = createSVGText(
        overlay.text,
        overlay.fontSize,
        overlay.color
      )

      // Text overlay'i base image üzerine yerleştir
      const composited = await sharp(baseBuffer)
        .composite([
          {
            input: svgBuffer,
            top: overlay.y || 0,
            left: overlay.x || 0,
          },
        ])
        .toBuffer()

      // Asset'i kaydet
      generatedAssets.push({
        id: uuidv4(),
        type: 'screenshot',
        name: `screenshot-${overlay.text}.png`,
        size: `${metadata.width}x${metadata.height}`,
        url: `data:image/png;base64,${composited.toString('base64')}`,
        createdAt: Date.now()
      })
    }

    return generatedAssets
  } catch (error) {
    console.error('Error generating screenshots:', error)
    throw error
  }
} 