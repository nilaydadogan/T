export interface IconSize {
  width: number
  height: number
  scale: number
  name: string
}

export interface DeviceFrame {
  image: string
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

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
  device: 'iphone' | 'ipad'
  width: number
  height: number
}

export interface GeneratedAsset {
  name: string
  size: string
  url: string
}

export interface ActionResponse<T = unknown> {
  data?: T
  error?: string
} 