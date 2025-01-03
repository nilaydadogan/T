import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/toaster'
import { Suspense } from 'react'
import { Loading } from '@/components/loading'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from '@/components/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'App Store Asset Generator',
  description: 'Generate beautiful app icons and screenshots for your iOS app.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<Loading />}>
            <AuthProvider>
              <AnimatePresence mode="wait">
                {children}
              </AnimatePresence>
            </AuthProvider>
          </Suspense>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
} 