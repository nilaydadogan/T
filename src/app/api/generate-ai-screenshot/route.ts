import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import type { GeneratedAsset } from '@/types/user'
import Replicate from 'replicate'

export async function POST(req: Request) {
  try {
    console.log('🚀 Starting AI screenshot generation...')
    const { prompt, deviceType } = await req.json()
    console.log('📝 Received request:', { prompt, deviceType })

    if (!prompt) {
      console.error('❌ No prompt provided')
      throw new Error('Prompt is required')
    }

    console.log('🔄 Initializing Replicate client...')
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('❌ Missing Replicate API token')
      throw new Error('Replicate API token not configured')
    }

    // Round dimensions to nearest multiple of 8
    const width = Math.floor(1242 / 8) * 8  // 1240
    const height = Math.floor(2688 / 8) * 8  // 2688 (already divisible by 8)

    console.log('🎨 Calling Replicate API with prompt:', prompt)
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: `A professional app screenshot showing ${prompt}. Modern UI design, clean interface, mobile app style`,
          negative_prompt: "blurry, bad quality, distorted, deformed, low resolution, poor quality UI",
          width,  // Using adjusted width
          height, // Using adjusted height
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          refine: "expert_ensemble_refiner",
          high_noise_frac: 0.8,
        }
      }
    ) as string[]

    console.log('✨ Replicate API response:', output)

    if (!output || !Array.isArray(output) || !output[0]) {
      console.error('❌ Invalid output from Replicate:', output)
      throw new Error('Invalid response from image generation API')
    }

    const imageUrl = output[0]
    console.log('🖼️ Generated image URL:', imageUrl)

    console.log('📥 Fetching generated image...')
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.error('❌ Failed to fetch image:', {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        url: imageUrl
      })
      throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`)
    }

    console.log('🔄 Converting image to base64...')
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')

    const asset: GeneratedAsset = {
      id: uuidv4(),
      type: 'screenshot',
      name: `ai-screenshot-${Date.now()}.png`,
      size: `${width}x${height}`,  // Using adjusted dimensions
      url: `data:image/png;base64,${base64Image}`,
      createdAt: Date.now()
    }

    console.log('✅ Screenshot generation completed successfully')
    return NextResponse.json({ asset })

  } catch (error) {
    console.error('❌ Screenshot generation error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate screenshot',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 