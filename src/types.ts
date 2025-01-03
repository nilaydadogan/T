export interface TextOverlay {
  text: string
  fontSize: number
  color: string
  position: {
    x: number
    y: number
  }
  align: 'left' | 'center' | 'right'
  fontWeight: 'normal' | 'bold'
  fontFamily: string
}

export interface ScreenshotTemplate {
  id: string
  name: string
  width: number
  height: number
  device: 'iphone' | 'ipad'
  frame?: {
    image: string
    padding: {
      top: number
      right: number
      bottom: number
      left: number
    }
  }
}

export interface GeneratedAsset {
  id: string
  name: string
  size: string
  type: string
  data: Buffer
} 