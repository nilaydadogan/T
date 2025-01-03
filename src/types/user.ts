export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  generatedAssets: GeneratedAsset[]
}

export interface GeneratedAsset {
  id: string
  type: 'icon' | 'screenshot'
  name: string
  size: string
  url: string
  createdAt: number
} 