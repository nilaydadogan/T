import { NextRequest, NextResponse } from 'next/server'
import Replicate from "replicate"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Request body:', body)

    const { prompt, count = 1 } = body as { prompt?: string; count?: number }

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      )
    }

    // Enhance the prompt to generate app icons
    const enhancedPrompt = `A minimalist app icon showing ${prompt}. Clean, modern design, simple shapes, gradient colors, professional look, centered composition, suitable for app store`
    console.log('Enhanced prompt:', enhancedPrompt)

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      const numImages = Math.min(Number(count) || 1, 5)
      const generatedImages: { id: number; url: string }[] = []

      for (let index = 0; index < numImages; index++) {
        let retries = 3
        let lastError: Error | null = null

        while (retries > 0) {
          try {
            const output = await replicate.run(
              "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
              {
                input: {
                  prompt: enhancedPrompt,
                  negative_prompt: "text, watermark, signature, blurry, low quality",
                  width: body.width || 512,
                  height: body.height || 512,
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

            // Add to zip and response
            zip.file(`ai-icon-${index + 1}.png`, imageBuffer)
            console.log(`Generated image ${index + 1}`)

            generatedImages.push({
              id: index + 1,
              url: base64Image
            })
            
            break

          } catch (error) {
            lastError = error as Error
            console.error(`Attempt ${4 - retries} failed:`, error)
            retries--
            
            if (retries > 0) {
              const waitTime = Math.pow(2, 4 - retries)
              console.log(`Waiting ${waitTime} seconds before retry...`)
              await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
            }
          }
        }

        if (lastError) {
          throw lastError
        }

        if (index < numImages - 1) {
          console.log('Waiting 5 seconds before next generation...')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9
        }
      })

      return NextResponse.json({
        success: true,
        images: generatedImages,
        zip: {
          buffer: zipBuffer,
          filename: 'ai-icons.zip'
        }
      })

    } catch (generationError: unknown) {
      console.error('Image generation error:', generationError)
      return NextResponse.json(
        { error: 'Image generation failed', details: generationError instanceof Error ? generationError.message : 'Unknown error' },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('AI icon generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI icons', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 