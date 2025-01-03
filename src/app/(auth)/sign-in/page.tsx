'use client'

import { SignInForm } from '@/components/sign-in-form'
import { PageTransition } from '@/components/page-transition'

export default function SignInPage() {
  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:20px_20px] dark:bg-grid-slate-100/[0.02]" />
          <div className="absolute h-full w-full">
            <div className="absolute -top-48 -left-48 h-96 w-96 rounded-full bg-violet-500/30 mix-blend-multiply blur-3xl animate-blob" />
            <div className="absolute top-48 -right-48 h-96 w-96 rounded-full bg-fuchsia-500/30 mix-blend-multiply blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-48 left-48 h-96 w-96 rounded-full bg-pink-500/30 mix-blend-multiply blur-3xl animate-blob animation-delay-4000" />
          </div>
        </div>

        {/* Content */}
        <div className="relative min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <SignInForm />
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 