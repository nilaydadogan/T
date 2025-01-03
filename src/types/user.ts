export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  generatedAssets: GeneratedAsset[]
}

export interface GeneratedAsset {
  id: string
  userId: string
  type: 'icon' | 'screenshot'
  url: string
  prompt?: string
  createdAt: Date
} 