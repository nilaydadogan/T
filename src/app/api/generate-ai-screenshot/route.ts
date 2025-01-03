import { NextRequest, NextResponse } from 'next/server'
import { Buffer } from 'buffer'

// Helper function for delay with exponential backoff
const delay = (retryCount: number) => new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))

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

    // Enhance the prompt to generate app screenshots
    const enhancedPrompt = `A high quality screenshot of a mobile app showing ${prompt}. Clean, modern UI design, professional layout, high resolution, photorealistic`
    console.log('Enhanced prompt:', enhancedPrompt)

    try {
      // Create a ZIP file for the generated images
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Generate one image at a time
      const numImages = Math.min(Number(count) || 1, 5)
      for (let index = 0; index < numImages; index++) {
        let retries = 3
        let lastError: Error | null = null

        while (retries > 0) {
          try {
            // Use Craiyon API
            const response = await fetch('https://api.craiyon.com/api/v3', {
              method: 'POST',
              headers: {
                'authority': 'api.craiyon.com',
                'accept': 'application/json',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json',
                'dnt': '1',
                'origin': 'https://www.craiyon.com',
                'referer': 'https://www.craiyon.com/',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              },
              body: JSON.stringify({
                prompt: enhancedPrompt,
                token: null,
                model_version: "c4ue22fb7kb6wlac",
                negative_prompt: "",
                style_id: "app-screenshot",
                aspect_ratio: "portrait",
                batch_size: 1,
                guidance_scale: 7.5,
                seed: Math.floor(Math.random() * 1000000)
              }),
            })

            if (!response.ok) {
              const errorText = await response.text()
              console.error(`API Error: ${response.status} - ${errorText}`)
              
              // Only retry on timeout (524) or server errors (5xx)
              if (response.status !== 524 && !response.status.toString().startsWith('5')) {
                throw new Error(`Failed to generate image ${index + 1}: ${response.statusText}`)
              }
              
              throw new Error('Timeout or server error, retrying...')
            }

            const result = await response.json()
            
            // Convert base64 to buffer
            const imageData = result.images[0]
            const buffer = Buffer.from(imageData, 'base64')
            
            zip.file(`ai-screenshot-${index + 1}.png`, buffer)
            console.log(`Generated image ${index + 1}`)
            
            // Success - break retry loop
            break
          } catch (error) {
            lastError = error as Error
            console.error(`Attempt ${4 - retries} failed:`, error)
            retries--
            
            if (retries > 0) {
              const waitTime = Math.pow(2, 4 - retries)
              console.log(`Waiting ${waitTime} seconds before retry...`)
              await delay(4 - retries)
            }
          }
        }

        if (lastError) {
          throw lastError
        }

        // Add a delay between generating different images
        if (index < numImages - 1) {
          console.log('Waiting 5 seconds before next generation...')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }

      // Generate the ZIP file
      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9
        }
      })

      // Return the ZIP file
      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename=ai-screenshots.zip'
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
    console.error('AI screenshot generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI screenshots', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 