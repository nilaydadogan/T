'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Wand2, Sparkles, Smartphone, Monitor, Tablet, Palette, Layout } from 'lucide-react'

const DEMO_PROMPTS = [
  "Neon circle with futuristic crystals.",
  "Minimalist app icon with shapes.",
  "Purple cartoon cat face icon."
]

const DEMO_ICONS = [
  "/demo/icon-1.png",
  "/demo/icon-2.png",
  "/demo/icon-3.png"
]

const DEMO_SCREENSHOTS = [
  "/demo/screenshot-1.jpg",
  "/demo/screenshot-2.jpg",
  "/demo/screenshot-3.jpg"
]

const DEVICES = [
  {
    name: "iPhone 15 Pro",
    icon: Smartphone,
    width: 1179,
    height: 2556
  },
  {
    name: "iPad Pro",
    icon: Tablet,
    width: 2048,
    height: 2732
  },
  {
    name: "MacBook Pro",
    icon: Monitor,
    width: 3456,
    height: 2234
  }
]

export function ShowcaseAnimation() {
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentDevice, setCurrentDevice] = useState(0)
  const [showingScreenshots, setShowingScreenshots] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGenerating(true)
      setProgress(0)
      
      let prog = 0
      const progressInterval = setInterval(() => {
        prog += 5
        setProgress(prog)
        if (prog >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => {
            setIsGenerating(false)
            if (showingScreenshots) {
              setCurrentDevice((prev) => (prev + 1) % DEVICES.length)
              if (currentDevice === DEVICES.length - 1) {
                // Switch to icons after showing all devices
                setTimeout(() => setShowingScreenshots(false), 1000)
              }
            }
            setCurrentPrompt((prev) => (prev + 1) % DEMO_PROMPTS.length)
          }, 300)
        }
      }, 100)

      return () => clearInterval(progressInterval)
    }, 6000)

    return () => clearInterval(interval)
  }, [currentDevice, showingScreenshots])

  const DeviceIcon = DEVICES[currentDevice].icon

  return (
    <div className="relative w-full min-h-[500px] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-pink-500/5 animate-gradient" />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative grid grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Left side - Preview */}
        <AnimatePresence mode="wait">
          {showingScreenshots ? (
            <motion.div 
              key="screenshot"
              className="relative aspect-[9/16] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-2xl overflow-hidden border border-white/20 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentDevice}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {isGenerating ? (
                    <div className="text-center space-y-4">
                      <DeviceIcon className="w-12 h-12 mx-auto text-violet-500 animate-pulse" />
                      <div className="w-48 h-2 rounded-full bg-violet-500/20 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 background-animate"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-violet-500 animate-pulse">
                        Generating for {DEVICES[currentDevice].name}...
                      </p>
                    </div>
                  ) : (
                    <motion.img
                      src={DEMO_SCREENSHOTS[currentPrompt]}
                      alt="Generated Screenshot"
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              className="relative aspect-square bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-2xl overflow-hidden border border-white/20 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPrompt}
                  className="absolute inset-0 flex items-center justify-center p-12"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  {isGenerating ? (
                    <div className="text-center space-y-4">
                      <Palette className="w-12 h-12 mx-auto text-violet-500 animate-pulse" />
                      <div className="w-48 h-2 rounded-full bg-violet-500/20 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 background-animate"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-violet-500 animate-pulse">
                        Generating icon...
                      </p>
                    </div>
                  ) : (
                    <motion.img
                      src={DEMO_ICONS[currentPrompt]}
                      alt="Generated Icon"
                      className="w-full h-full object-contain"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right side - Generation Info */}
        <div className="flex flex-col justify-center space-y-6">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
              <motion.h3
                key={showingScreenshots ? 'screenshot' : 'icon'}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                {showingScreenshots ? (
                  <>
                    AI Screenshot Generator
                    <Layout className="w-5 h-5 text-violet-500 animate-pulse" />
                  </>
                ) : (
                  <>
                    AI Icon Generator
                    <Palette className="w-5 h-5 text-violet-500 animate-pulse" />
                  </>
                )}
              </motion.h3>
            </AnimatePresence>
            <p className="text-gray-600 dark:text-gray-400">
              {showingScreenshots 
                ? "Transform your ideas into stunning app screenshots"
                : "Create beautiful icons with AI in seconds"
              }
            </p>
          </motion.div>

          <motion.div
            className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {DEMO_PROMPTS[currentPrompt]}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {showingScreenshots && (
              <motion.div 
                className="flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                {DEVICES.map((device, index) => {
                  const Icon = device.icon
                  return (
                    <motion.div
                      key={device.name}
                      className={`p-3 rounded-lg ${
                        currentDevice === index 
                          ? 'bg-violet-500 text-white' 
                          : 'bg-white/10 text-gray-400'
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 