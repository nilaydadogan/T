'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const particles: Particle[] = []
    const particleCount = 50
    const colors = theme === 'dark' 
      ? ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD'] // Violet shades for dark mode
      : ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'] // Lighter violet shades for light mode

    let animationFrameId: number
    let width = 0
    let height = 0

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height

      // Recreate particles on resize
      particles.length = 0
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 4 + 1,
          speedX: Math.random() * 0.5 - 0.25,
          speedY: Math.random() * 0.5 - 0.25,
          opacity: Math.random() * 0.5 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }
    }

    const drawParticle = (particle: Particle) => {
      if (!ctx) return

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = particle.color
      ctx.globalAlpha = particle.opacity
      ctx.fill()
    }

    const updateParticle = (particle: Particle) => {
      particle.x += particle.speedX
      particle.y += particle.speedY

      // Wrap around screen
      if (particle.x < 0) particle.x = width
      if (particle.x > width) particle.x = 0
      if (particle.y < 0) particle.y = height
      if (particle.y > height) particle.y = 0

      // Slowly change opacity
      particle.opacity += Math.random() * 0.02 - 0.01
      if (particle.opacity < 0.2) particle.opacity = 0.2
      if (particle.opacity > 0.7) particle.opacity = 0.7
    }

    const render = () => {
      if (!ctx) return

      ctx.clearRect(0, 0, width, height)

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      if (theme === 'dark') {
        gradient.addColorStop(0, 'rgba(124, 58, 237, 0.1)')  // Violet
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)') // Purple
        gradient.addColorStop(1, 'rgba(167, 139, 250, 0.1)')  // Lavender
      } else {
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)')  // Lighter violet
        gradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.05)') // Lighter purple
        gradient.addColorStop(1, 'rgba(196, 181, 253, 0.05)')  // Lighter lavender
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Update and draw particles
      particles.forEach(particle => {
        updateParticle(particle)
        drawParticle(particle)
      })

      animationFrameId = requestAnimationFrame(render)
    }

    // Initial setup
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
} 