import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

export async function POST(request: NextRequest) {
  try {
    const { prompt, deviceType } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    // Enhance prompt with device context
    const enhancedPrompt = `A screenshot of ${prompt}, optimized for mobile devices, with clean and modern UI design.`

    console.log('Starting screenshot generation with prompt:', prompt)

    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: enhancedPrompt,
          negative_prompt: "blurry, bad quality, distorted, deformed, text, words, letters, low resolution, ugly, duplicate, watermark",
          width: 1024,
          height: 2048,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          refine: "expert_ensemble_refiner",
          high_noise_frac: 0.8,
        }
      }
    )

    if (!output || !Array.isArray(output) || !output[0]) {
      throw new Error('Failed to generate image')
    }

    const imageUrl = output[0]
    console.log('Generated image URL:', imageUrl)

    return NextResponse.json({ 
      success: true,
      imageUrl: imageUrl 
    })

  } catch (error) {
    console.error('AI Screenshot generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate screenshot' },
      { status: 500 }
    )
  }
} 