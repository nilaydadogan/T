import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import type { GeneratedAsset } from '@/types/user'

interface DeepAIResponse {
  output: string[]
  id: string
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    // Enhance the prompt for screenshot generation
    const enhancedPrompt = `A professional app screenshot showing ${prompt}. Modern UI design, clean interface, mobile app style`

    const response = await fetch('https://api.deepai.org/api/text2img', {
      method: 'POST',
      headers: {
        'api-key': process.env.DEEPAI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: enhancedPrompt,
        width: 1242, // iPhone screenshot width
        height: 2688 // iPhone screenshot height
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate image')
    }

    const data = await response.json() as DeepAIResponse

    if (!data.output || !data.output.length) {
      throw new Error('No output generated')
    }

    const imageUrl = data.output[0]

    // Fetch the generated image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch generated image')
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')

    const asset: GeneratedAsset = {
      id: uuidv4(),
      type: 'screenshot',
      name: `ai-screenshot-${Date.now()}.png`,
      size: '1242x2688',
      url: `data:image/png;base64,${base64Image}`,
      createdAt: Date.now()
    }

    return NextResponse.json({ asset })

  } catch (error) {
    console.error('Screenshot generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate screenshot' },
      { status: 500 }
    )
  }
} 