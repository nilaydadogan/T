'use client'

import { useCallback, useState, useEffect } from 'react'
import { ImagePlus, Wand2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { IconPreview } from '@/components/icon-preview'
import { storage } from '@/lib/storage'
import { authStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { userLimits } from '@/lib/user-limits'
import { Paywall } from '@/components/paywall'
import dynamic from 'next/dynamic'

// Dynamically import icons
const Wand2Icon = dynamic(() => import('lucide-react').then(mod => mod.Wand2), { ssr: false })
const ImagePlusIcon = dynamic(() => import('lucide-react').then(mod => mod.ImagePlus), { ssr: false })

export function IconGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Customization options
  const [borderRadius, setBorderRadius] = useState(0)
  const [borderWidth, setBorderWidth] = useState(0)
  const [borderColor, setBorderColor] = useState('#000000')
  const [shadowEnabled, setShadowEnabled] = useState(false)
  const [shadowBlur, setShadowBlur] = useState(10)
  const [shadowColor, setShadowColor] = useState('#000000')
  const [shadowOpacity, setShadowOpacity] = useState(0.3)

  // Add state for generated images
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([])

  // Add new state for selected asset
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number | null>(null)

  // Add state for showing paywall
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    // Component mount olduğunda auth durumunu yenile
    authStore.refreshAuth()
  }, [])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

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

    // Create preview URL
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    setFile(selectedFile)

    // Create an image to check dimensions
    const img = new Image()
    img.onload = () => {
      if (img.width < 1024 || img.height < 1024) {
        toast({
          variant: "destructive",
          title: "Image too small",
          description: "Please upload an image at least 1024x1024 pixels for best quality.",
        })
        setFile(null)
        setPreviewUrl(null)
        URL.revokeObjectURL(url)
        event.target.value = '' // Reset input
      }
    }
    img.src = url
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
      formData.append('file', file)
      formData.append('options', JSON.stringify({
        borderRadius,
        borderWidth,
        borderColor,
        shadow: shadowEnabled ? {
          blur: shadowBlur,
          color: shadowColor,
          opacity: shadowOpacity
        } : null
      }))

      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/generate-icons', {
        method: 'POST',
        body: formData,
      })

      clearInterval(interval)

      if (!response.ok) {
        throw new Error('Failed to generate icons')
      }

      setProgress(100)

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'app-icons.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Icons generated successfully!",
      })

      userLimits.incrementManualCount()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate icons. Please try again.",
      })
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }, [file, borderRadius, borderWidth, borderColor, shadowEnabled, shadowBlur, shadowColor, shadowOpacity, toast, router])

  const handleAiGenerate = useCallback(async () => {
    if (!prompt) {
      toast({
        variant: "destructive",
        title: "Missing prompt",
        description: "Please enter a description for your icon.",
      })
      return
    }

    // Check generation limit before starting
    if (!userLimits.canUseAIGeneration()) {
      if (authStore.isAuthenticated()) {
        // Show upgrade prompt for authenticated users
        toast({
          title: "Generation Limit Reached",
          description: "You've used your free AI generation. Upgrade to Pro for unlimited generations.",
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
      } else {
        setShowPaywall(true)
      }
      return
    }

    try {
      setIsAiGenerating(true)
      setProgress(0)

      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/generate-ai-icon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      clearInterval(interval)

      if (!response.ok) {
        throw new Error('Failed to generate icon')
      }

      const data = await response.json()
      
      if (data.success && data.images) {
        userLimits.incrementGenerationCount()
        const newAssets = data.images.map((image: any) => ({
          id: crypto.randomUUID(),
          type: 'icon',
          url: image.url,
          prompt,
          createdAt: new Date().toISOString(),
          userId: '1'
        }));
        
        // Save assets for authenticated users
        if (authStore.isAuthenticated()) {
          newAssets.forEach(asset => storage.addAsset(asset));
          toast({
            title: "Success!",
            description: "Icons generated successfully. View them in your dashboard.",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                View Dashboard
              </Button>
            ),
          })
        } else {
          toast({
            title: "Want to save your assets?",
            description: "Sign in to save and access your generated assets anytime.",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/auth/sign-in')}
              >
                Sign In
              </Button>
            ),
          })
        }
        
        setGeneratedAssets(newAssets)
      }

      setProgress(100)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI icon. Please try again.",
      })
    } finally {
      setIsAiGenerating(false)
      setProgress(0)
    }
  }, [prompt, toast, router])

  // Add handler for selecting an asset
  const handleAssetSelect = useCallback(async (index: number) => {
    const asset = generatedAssets[index];
    if (!asset) return;

    setSelectedAssetIndex(index);
    setPreviewUrl(asset.url);
    
    // Create file from the selected asset
    const response = await fetch(asset.url);
    const blob = await response.blob();
    const file = new File([blob], asset.name, { type: 'image/png' });
    setFile(file);
  }, [generatedAssets])

  // Cleanup preview URL when component unmounts
  useCallback(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-xl backdrop-blur-sm">
          <TabsTrigger value="upload">
            <span className="relative flex items-center justify-center gap-2">
              <ImagePlusIcon className="w-4 h-4" />
              Upload Icon
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
            <div className="space-y-2">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500">
                Upload Icon
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Upload your icon and customize it with our powerful tools.
              </p>
            </div>
            <div className="space-y-2">
              <label className="block">
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                  <div className="space-y-2 text-center">
                    <ImagePlusIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="text-sm text-gray-500">
                      Click to upload icon
                    </div>
                    <div className="text-xs text-gray-400">
                      JPEG, PNG, or WebP (min 1024x1024px)
                    </div>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                  />
                </div>
              </label>
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
                    Describe your icon and let AI create something unique for you.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-violet-500 dark:text-violet-400">Icon Description</Label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient" />
                    <Textarea
                      id="prompt"
                      placeholder="A minimalist app icon with a blue gradient background and a white abstract shape in the center..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="relative h-32 bg-white dark:bg-slate-950 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </div>
                </div>
                <Button
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white shadow-lg"
                  onClick={handleAiGenerate}
                  disabled={isAiGenerating || !prompt || !userLimits.canUseAIGeneration()}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-white/25 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                  <span className="relative flex items-center justify-center gap-2">
                    <Wand2Icon className="w-4 h-4" />
                    {isAiGenerating ? 'Generating...' : 'Generate with AI'}
                  </span>
                </Button>
                {isAiGenerating && (
                  <div className="space-y-2 animate-in fade-in-50">
                    <Progress value={progress} className="bg-violet-100 dark:bg-violet-900">
                      <div className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" style={{ width: `${progress}%` }} />
                    </Progress>
                    <p className="text-sm text-center text-violet-500 dark:text-violet-400">
                      Generating icon with AI... {progress}%
                    </p>
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
                    Sign in to save icons
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
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-600/90 to-pink-600/90 px-2 py-1 text-xs font-medium text-white">
                  Premium Feature
                </span>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {previewUrl && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500">
                Preview
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Your icon will look like this after customization
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div 
                className="aspect-square w-80 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800"
                style={{
                  backgroundColor: 'white',
                }}
              >
                <div
                  className="w-full h-full relative"
                  style={{
                    borderRadius: `${borderRadius}px`,
                    border: borderWidth ? `${borderWidth}px solid ${borderColor}` : 'none',
                    boxShadow: shadowEnabled 
                      ? `0 0 ${shadowBlur}px rgba(${
                          parseInt(shadowColor.slice(1, 3), 16)
                        }, ${
                          parseInt(shadowColor.slice(3, 5), 16)
                        }, ${
                          parseInt(shadowColor.slice(5, 7), 16)
                        }, ${shadowOpacity})`
                      : 'none',
                  }}
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card id="customization-section" className="p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500">
                Customization
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Fine-tune your icon with these powerful options
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[borderRadius]}
                    onValueChange={([value]) => setBorderRadius(value)}
                    max={50}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-mono text-sm">
                    {borderRadius}px
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Border Width</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[borderWidth]}
                    onValueChange={([value]) => setBorderWidth(value)}
                    max={20}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-mono text-sm">
                    {borderWidth}px
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Border Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="w-12 p-1 h-9"
                  />
                  <Input
                    type="text"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shadow">Enable Shadow</Label>
                  <Switch
                    id="shadow"
                    checked={shadowEnabled}
                    onCheckedChange={setShadowEnabled}
                  />
                </div>

                {shadowEnabled && (
                  <div className="space-y-4 animate-in fade-in-50">
                    <div className="space-y-2">
                      <Label>Shadow Blur</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[shadowBlur]}
                          onValueChange={([value]) => setShadowBlur(value)}
                          max={50}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-right font-mono text-sm">
                          {shadowBlur}px
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Shadow Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={shadowColor}
                          onChange={(e) => setShadowColor(e.target.value)}
                          className="w-12 p-1 h-9"
                        />
                        <Input
                          type="text"
                          value={shadowColor}
                          onChange={(e) => setShadowColor(e.target.value)}
                          className="font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Shadow Opacity</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[shadowOpacity * 100]}
                          onValueChange={([value]) => setShadowOpacity(value / 100)}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-right font-mono text-sm">
                          {Math.round(shadowOpacity * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!file || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Icons'}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-gray-500">
                  Generating icons... {progress}%
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
} 