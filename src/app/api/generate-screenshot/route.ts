import { NextResponse } from 'next/server'
import Replicate from "replicate"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 })
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          negative_prompt: "blurry, bad quality, distorted, deformed",
          width: 1024,
          height: 1792,
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
    
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`

    return NextResponse.json({
      success: true,
      url: base64Image
    })

  } catch (error) {
    console.log('[SCREENSHOT_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 