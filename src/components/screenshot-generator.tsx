'use client'

import { useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { IconPreview } from '@/components/icon-preview'
import type { GeneratedAsset } from '@/types/user'
import { storage } from '@/lib/storage'
import { authStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { userLimits } from '@/lib/user-limits'
import { Paywall } from '@/components/paywall'

// Dynamically import icons
const Wand2Icon = dynamic(() => import('lucide-react').then(mod => mod.Wand2), { ssr: false })
const ImagePlusIcon = dynamic(() => import('lucide-react').then(mod => mod.ImagePlus), { ssr: false })

const DEVICE_TEMPLATES = [
  // iPhone 15 Series
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    width: 1290,
    height: 2796,
    device: 'iphone'
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    width: 1179,
    height: 2556,
    device: 'iphone'
  },
  {
    id: 'iphone-15-plus',
    name: 'iPhone 15 Plus',
    width: 1284,
    height: 2778,
    device: 'iphone'
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    width: 1179,
    height: 2556,
    device: 'iphone'
  },
  // iPhone 14 Series
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    width: 1290,
    height: 2796,
    device: 'iphone'
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    width: 1179,
    height: 2556,
    device: 'iphone'
  },
  // iPad Series
  {
    id: 'ipad-pro-12-9',
    name: 'iPad Pro 12.9"',
    width: 2048,
    height: 2732,
    device: 'ipad'
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    width: 1668,
    height: 2388,
    device: 'ipad'
  },
  {
    id: 'ipad-air',
    name: 'iPad Air',
    width: 1640,
    height: 2360,
    device: 'ipad'
  },
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    width: 1488,
    height: 2266,
    device: 'ipad'
  },
  // Mac Series
  {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16"',
    width: 3456,
    height: 2234,
    device: 'mac'
  },
  {
    id: 'macbook-pro-14',
    name: 'MacBook Pro 14"',
    width: 3024,
    height: 1964,
    device: 'mac'
  },
  {
    id: 'macbook-air-15',
    name: 'MacBook Air 15"',
    width: 2880,
    height: 1864,
    device: 'mac'
  },
  {
    id: 'macbook-air-13',
    name: 'MacBook Air 13"',
    width: 2560,
    height: 1664,
    device: 'mac'
  },
  {
    id: 'imac-24',
    name: 'iMac 24"',
    width: 4480,
    height: 2520,
    device: 'mac'
  },
  {
    id: 'studio-display',
    name: 'Studio Display',
    width: 5120,
    height: 2880,
    device: 'mac'
  },
  {
    id: 'pro-display-xdr',
    name: 'Pro Display XDR',
    width: 6016,
    height: 3384,
    device: 'mac'
  }
]

export function ScreenshotGenerator() {
  const [file, setFile] = useState<File | File[] | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Customization options
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [padding, setPadding] = useState(0)
  const [quality, setQuality] = useState(90)
  const [useFrame, setUseFrame] = useState(true)

  // Add new states for AI generation
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([])
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number | null>(null)

  // Add state for showing paywall
  const [showPaywall, setShowPaywall] = useState(false)

  // Add state for selected device
  const [selectedDevice, setSelectedDevice] = useState('iphone-15-pro')

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    try {
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          variant: "destructive",
          title: "Unsupported file format",
          description: "Please upload a JPEG, PNG, or WebP image.",
        })
        event.target.value = '' // Reset input
        return
      }

      // Check file size
      const MAX_SIZE = 5 * 1024 * 1024 // 5MB
      if (selectedFile.size > MAX_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
        })
        event.target.value = '' // Reset input
        return
      }

      // Create preview URL
      const url = URL.createObjectURL(selectedFile)

      // Validate image dimensions and format
      const img = new Image()
      img.onload = () => {
        // Check minimum dimensions
        if (img.width < 500 || img.height < 500) {
          toast({
            variant: "destructive",
            title: "Image too small",
            description: "Please upload an image at least 500x500 pixels.",
          })
          URL.revokeObjectURL(url)
          event.target.value = '' // Reset input
          return
        }

        setPreviewUrl(url)
        setFile(selectedFile)
      }

      img.onerror = () => {
        toast({
          variant: "destructive",
          title: "Invalid image",
          description: "Please upload a valid image file.",
        })
        URL.revokeObjectURL(url)
        event.target.value = '' // Reset input
      }

      img.src = url
    } catch (error) {
      console.error('Error handling file:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process image. Please try another file.",
      })
      event.target.value = '' // Reset input
    }
  }, [toast])

  const handleGenerate = useCallback(async () => {
    if (!file) return

    if (!userLimits.canUseManualCreation()) {
      toast({
        title: "Manual Creation Limit Reached",
        description: "Upgrade to Pro for unlimited manual creations.",
        action: (
          <Button
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-violet-500 to-purple-500"
            onClick={() => router.push('/pricing')}
          >
            Upgrade to Pro
          </Button>
        ),
      })
      return
    }

    try {
      setIsGenerating(true)
      setProgress(0)

      const formData = new FormData()
      
      // Handle both File objects and base64 URLs
      if (file instanceof File) {
        formData.append('file', file)
      } else if (typeof file === 'string' && file.startsWith('data:')) {
        // Convert base64 to File object
        try {
          const response = await fetch(file)
          const blob = await response.blob()
          const newFile = new File([blob], 'screenshot.png', { type: 'image/png' })
          formData.append('file', newFile)
        } catch (error) {
          console.error('Error converting base64 to file:', error)
          throw new Error('Failed to process image')
        }
      } else {
        throw new Error('Invalid file format')
      }

      formData.append('options', JSON.stringify({
        deviceType: selectedDevice,
        quality,
      }))

      const response = await fetch('/api/generate-screenshots', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to generate screenshots')
      }

      // ZIP dosyasını indir
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'app-screenshots.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      setProgress(100)
      userLimits.incrementManualCount()

      toast({
        title: "Success!",
        description: "Screenshots generated successfully.",
      })

    } catch (error) {
      console.error('Generation error:', error)
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate screenshots",
      })
    } finally {
      setIsGenerating(false)
      setTimeout(() => setProgress(0), 500)
    }
  }, [file, selectedDevice, quality, toast, router])

  // Add handler for selecting an asset
  const handleAssetSelect = useCallback(async (index: number) => {
    const asset = generatedAssets[index]
    if (!asset) return

    setSelectedAssetIndex(index)
    setPreviewUrl(asset.url)
    
    // Create file from the selected asset
    const response = await fetch(asset.url)
    const blob = await response.blob()
    const file = new File([blob], asset.name, { type: 'image/png' })
    setFile(file)
  }, [generatedAssets])

  // Cleanup preview URL when component unmounts
  useCallback(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const iPhoneTemplates = DEVICE_TEMPLATES.filter(t => t.device === 'iphone')
  const iPadTemplates = DEVICE_TEMPLATES.filter(t => t.device === 'ipad')
  const macTemplates = DEVICE_TEMPLATES.filter(t => t.device === 'mac')

  const handleAiGenerate = useCallback(async () => {
    if (!prompt) return

    if (!userLimits.canUseAIGeneration()) {
      toast({
        title: "AI Generation Limit Reached",
        description: "Upgrade to Pro for unlimited AI generations.",
        action: (
          <Button
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-violet-500 to-purple-500"
            onClick={() => router.push('/pricing')}
          >
            Upgrade to Pro
          </Button>
        ),
      })
      return
    }

    try {
      setIsAiGenerating(true)
      setProgress(0)

      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/generate-ai-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          deviceType: selectedTemplate,
          quality: 'hd'
        }),
      })

      clearInterval(interval)

      if (!response.ok) {
        throw new Error('Failed to generate screenshot')
      }

      const data = await response.json()
      
      if (!data.asset) {
        throw new Error('No asset returned from API')
      }

      // Yüksek kaliteli asset'i kullan
      const highQualityAsset = {
        ...data.asset,
        previewUrl: data.asset.url
      }

      // Save asset for authenticated users
      if (authStore.isAuthenticated()) {
        storage.addAsset(highQualityAsset)
      }

      setProgress(100)
      userLimits.incrementGenerationCount()
      setGeneratedAssets([highQualityAsset])
      
      if (highQualityAsset.url) {
        setPreviewUrl(highQualityAsset.url)
      }

      toast({
        title: "Success!",
        description: "Screenshot generated successfully.",
      })

      // Scroll to preview section
      setTimeout(() => {
        const previewSection = document.querySelector('#preview-section')
        if (previewSection) {
          previewSection.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)

    } catch (error) {
      console.error('Generation error:', error)
      
      let errorMessage = 'Failed to generate screenshot'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract error details from the response
        try {
          const errorData = await response?.json()
          errorMessage = errorData?.error || errorData?.details || errorMessage
        } catch (e) {
          console.error('Failed to parse error response:', e)
        }
      }
      
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: errorMessage,
      })
    } finally {
      setIsAiGenerating(false)
      setTimeout(() => setProgress(0), 500)
    }
  }, [prompt, selectedTemplate, toast, router])

  // Device seçimi için handler
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-xl backdrop-blur-sm">
          <TabsTrigger value="upload">
            <span className="relative flex items-center justify-center gap-2">
              <ImagePlusIcon className="w-4 h-4" />
              Upload Screenshot
            </span>
          </TabsTrigger>
          <TabsTrigger value="ai">
            <span className="relative flex items-center justify-center gap-2">
              <Wand2Icon className="w-4 h-4" />
              Generate with AI
              <span className="ml-1 inline-flex items-center rounded-full bg-gradient-to-r from-violet-600/90 to-pink-600/90 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                Pro
              </span>
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent 
          value="upload"
          className="mt-4 relative animate-in fade-in-50 slide-in-from-bottom-3"
        >
          <Card className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500">
                  Select Device
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  Choose the perfect device template for your screenshots
                </p>
              </div>

              <div className="space-y-4">
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>iPhone</SelectLabel>
                      {iPhoneTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>iPad</SelectLabel>
                      {iPadTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Mac</SelectLabel>
                      {macTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Upload Screenshot</h3>
                <label className="block">
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                    <div className="space-y-2 text-center">
                      <ImagePlusIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="text-sm text-gray-500">
                        Click to upload screenshots (max 5)
                      </div>
                      <div className="text-xs text-gray-400">
                        JPEG, PNG, or WebP
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      multiple
                      max="5"
                    />
                  </div>
                </label>
              </div>
            </div>
            {authStore.isAuthenticated() && !authStore.isPro() && (
              <div className="text-sm text-center text-gray-500">
                {userLimits.getManualCount()} / {userLimits.MAX_FREE_MANUAL} free manual creations used
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent 
          value="ai"
          className="mt-4 relative animate-in fade-in-50 slide-in-from-bottom-3"
        >
          {showPaywall ? (
            <Paywall />
          ) : (
            <Card className="p-6 space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 animate-gradient" />
              <div className="relative space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Wand2Icon className="w-6 h-6 text-violet-500 animate-pulse" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500">
                      Generate with AI
                    </span>
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Create stunning screenshots with AI-powered generation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Device Template</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                    required
                  >
                    <SelectTrigger className="relative bg-white dark:bg-slate-950 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500">
                      <SelectValue placeholder="Choose a device template" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      <SelectGroup>
                        <SelectLabel className="sticky top-0 bg-background z-10 font-semibold">iPhone</SelectLabel>
                        {iPhoneTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id} className="py-2">
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground">{template.width}x{template.height}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="sticky top-0 bg-background z-10 font-semibold">iPad</SelectLabel>
                        {iPadTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id} className="py-2">
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground">{template.width}x{template.height}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="sticky top-0 bg-background z-10 font-semibold">Mac</SelectLabel>
                        {macTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id} className="py-2">
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground">{template.width}x{template.height}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-violet-500 dark:text-violet-400">Screenshot Description</Label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient" />
                    <Textarea
                      id="prompt"
                      placeholder="A modern app interface with a clean dashboard showing statistics..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="relative h-32 bg-white dark:bg-slate-950 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </div>
                </div>
                <Button
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white shadow-lg"
                  onClick={handleAiGenerate}
                  disabled={isAiGenerating || !prompt || !selectedTemplate}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-white/25 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isAiGenerating ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Wand2Icon className="w-4 h-4" />
                        Generate with AI
                      </>
                    )}
                  </span>
                </Button>
                {isAiGenerating && (
                  <div className="space-y-2 animate-in fade-in-50">
                    <Progress value={progress} className="bg-violet-100 dark:bg-violet-900">
                      <div className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" style={{ width: `${progress}%` }} />
                    </Progress>
                    <div className="text-center space-y-1">
                      <p className="text-sm text-violet-500 dark:text-violet-400">
                        Generating screenshot with AI... {progress}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        This might take a minute. We're creating a high-quality screenshot that matches your device specifications.
                      </p>
                    </div>
                  </div>
                )}
                {generatedAssets.length > 0 && (
                  <div className="mt-4">
                    <IconPreview 
                      assets={generatedAssets}
                      selectedIndex={selectedAssetIndex}
                      onSelect={handleAssetSelect}
                    />
                  </div>
                )}
                {!authStore.isAuthenticated() && (
                  <Button
                    variant="default"
                    onClick={() => router.push('/auth/sign-in')}
                  >
                    Sign in to save screenshots
                  </Button>
                )}
                {authStore.isAuthenticated() && !authStore.isPro() && (
                  <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.min(userLimits.getGenerationCount(), userLimits.MAX_FREE_GENERATIONS)} / {userLimits.MAX_FREE_GENERATIONS} free AI generations used
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                        onClick={() => router.push('/pricing')}
                      >
                        Upgrade to Pro
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {previewUrl && (
        <div id="preview-section" className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 space-y-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500">
                Preview
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                See how your screenshot will look on the selected device
              </p>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
              <div className="relative max-w-sm mx-auto aspect-[9/19.5] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500">
                Customization
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Perfect your screenshot with these customization options
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Device Template</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                  required
                >
                  <SelectTrigger className="relative bg-white dark:bg-slate-950 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500">
                    <SelectValue placeholder="Choose a device template" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectGroup>
                      <SelectLabel className="sticky top-0 bg-background z-10 font-semibold">iPhone</SelectLabel>
                      {iPhoneTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id} className="py-2">
                          <div className="flex flex-col">
                            <span>{template.name}</span>
                            <span className="text-xs text-muted-foreground">{template.width}x{template.height}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="sticky top-0 bg-background z-10 font-semibold">iPad</SelectLabel>
                      {iPadTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id} className="py-2">
                          <div className="flex flex-col">
                            <span>{template.name}</span>
                            <span className="text-xs text-muted-foreground">{template.width}x{template.height}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="sticky top-0 bg-background z-10 font-semibold">Mac</SelectLabel>
                      {macTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id} className="py-2">
                          <div className="flex flex-col">
                            <span>{template.name}</span>
                            <span className="text-xs text-muted-foreground">{template.width}x{template.height}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="frame">Device Frame</Label>
                  <Switch
                    id="frame"
                    checked={useFrame}
                    onCheckedChange={setUseFrame}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 p-1 h-9"
                    />
                    <Input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="font-mono"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Padding</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[padding]}
                      onValueChange={([value]) => setPadding(value)}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-12 text-right font-mono text-sm">
                      {padding}px
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quality</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[quality]}
                      onValueChange={([value]) => setQuality(value)}
                      min={1}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-12 text-right font-mono text-sm">
                      {quality}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!file || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Screenshots'}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-gray-500">
                  Generating screenshots... {progress}%
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
} 