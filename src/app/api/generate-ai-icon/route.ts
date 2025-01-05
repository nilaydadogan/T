import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import type { GeneratedAsset } from '@/types/user'
import Replicate from 'replicate'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log('Starting icon generation with prompt:', prompt)

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    const enhancedPrompt = `A modern app icon showing ${prompt.replace(/[^\w\s,.!?-]/g, '')}. Clean, minimalist design, suitable for app store.`

    console.log('Calling Replicate API with enhanced prompt:', enhancedPrompt)
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: enhancedPrompt,
          negative_prompt: "blurry, bad quality, distorted, deformed, text, words, letters, low resolution, ugly, duplicate, watermark",
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          refine: "expert_ensemble_refiner",
          high_noise_frac: 0.8,
        }
      }
    )

    if (!output || !output[0]) {
      throw new Error('No output generated')
    }

    const imageUrl = output[0]

    // Fetch the generated image and convert to base64
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch generated image')
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const dataUrl = `data:image/png;base64,${base64Image}`

    // Create asset
    const asset: GeneratedAsset = {
      id: uuidv4(),
      type: 'icon',
      name: `ai-icon-${Date.now()}.png`,
      url: dataUrl,
      size: '1024x1024',
      createdAt: Date.now()
    }

    return NextResponse.json({ asset })

  } catch (error) {
    console.error('AI Icon generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate AI icon' },
      { status: 500 }
    )
  }
} 