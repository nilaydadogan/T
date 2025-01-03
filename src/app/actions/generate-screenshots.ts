'use server'

import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import type { GeneratedAsset } from '@/types/user'
import satori from 'satori'
import { join } from 'path'
import * as fs from 'fs'

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

// Font dosyasını yükle
const fontPath = join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf')
const fontData = fs.readFileSync(fontPath)

export async function generateScreenshots(buffer: Buffer, options: ScreenshotOptions) {
  try {
    // Base image'i hazırla
    const baseImage = sharp(buffer).png()
    const metadata = await baseImage.metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions')
    }

    // İstenen boyuta resize et
    if (options.width && options.height) {
      baseImage.resize(options.width, options.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
    }

    const generatedAssets: GeneratedAsset[] = []
    const baseBuffer = await baseImage.toBuffer()

    // Her overlay için
    for (const overlay of options.overlays) {
      // SVG text oluştur
      const svg = await satori(
        {
          type: 'div',
          props: {
            children: overlay.text,
            style: {
              fontSize: `${overlay.fontSize || 48}px`,
              color: overlay.color || '#000000',
              fontFamily: 'Inter',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          },
        },
        {
          width: metadata.width,
          height: metadata.height,
          fonts: [
            {
              name: 'Inter',
              data: fontData,
              weight: 400,
              style: 'normal',
            },
          ],
        }
      )

      // SVG'yi buffer'a çevir
      const svgBuffer = Buffer.from(svg)

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