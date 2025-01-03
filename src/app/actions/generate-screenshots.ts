'use server'

import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import type { GeneratedAsset } from '@/types/user'
import satori from 'satori'
import { join } from 'path'
import * as fs from 'fs'

// Font dosyasını yükle
const fontPath = join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf')
const fontData = fs.readFileSync(fontPath)

export async function generateScreenshots(buffer: Buffer, options: any) {
  try {
    const baseImage = sharp(buffer)
    const metadata = await baseImage.metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions')
    }

    // Text overlay'ler için SVG oluştur
    async function createTextOverlay(text: string, fontSize: number, color: string) {
      const svg = await satori(
        {
          type: 'div',
          props: {
            children: text,
            style: {
              fontSize: `${fontSize}px`,
              color: color,
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
          width: metadata.width!,
          height: metadata.height!,
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

      return Buffer.from(svg)
    }

    const generatedAssets: GeneratedAsset[] = []

    // Her overlay için
    for (const overlay of options.overlays) {
      // Text overlay'i SVG olarak oluştur
      const textOverlay = await createTextOverlay(
        overlay.text,
        overlay.fontSize || 48,
        overlay.color || '#000000'
      )

      // Base image üzerine text overlay'i ekle
      const composited = await baseImage
        .composite([
          {
            input: textOverlay,
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