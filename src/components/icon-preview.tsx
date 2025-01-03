'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Info } from 'lucide-react'
import JSZip from 'jszip'
import type { GeneratedAsset } from '@/types'

interface IconPreviewProps {
  assets: GeneratedAsset[]
  selectedIndex?: number | null
  onSelect?: (index: number) => void
}

export function IconPreview({ assets, selectedIndex, onSelect }: IconPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      
      const zip = new JSZip()
      
      // Add each asset to the zip
      for (const asset of assets) {
        // Convert base64 URL to blob
        const response = await fetch(asset.url)
        const blob = await response.blob()
        zip.file(asset.name, blob)
      }
      
      // Generate zip file
      const content = await zip.generateAsync({ type: 'blob' })
      
      // Create download link
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = 'app-icons.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download assets:', error)
      alert('Failed to download assets. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Generated Icons</h3>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download All'}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Click on any icon to customize it</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {assets.map((asset, index) => (
          <Card 
            key={asset.name} 
            className={`p-4 space-y-2 cursor-pointer transition-all hover:scale-105 ${
              selectedIndex === index ? 'ring-2 ring-violet-500' : ''
            }`}
            onClick={() => {
              onSelect?.(index);
              // Find and scroll to customization section
              const customizationSection = document.getElementById('customization-section');
              if (customizationSection) {
                customizationSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={asset.url}
                alt={asset.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-sm text-center space-y-1">
              <div className="font-medium">{asset.size}</div>
              <div className="text-xs text-muted-foreground">{asset.name}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 