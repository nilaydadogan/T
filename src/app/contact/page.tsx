'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Building2, Mail, MessageSquare, Users, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ContactPage() {
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Message Received",
      description: "We'll get back to you within 24 hours!",
    })
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Navigation Header */}
      <div className="p-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500">
              Enterprise Sales
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Get in touch with our sales team to discuss your enterprise needs
            </p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input type="text" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label>Work Email</Label>
                  <div className="relative">
                    <Input type="email" placeholder="john@company.com" required className="pl-10" />
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <div className="relative">
                    <Input type="text" placeholder="Company Inc." required className="pl-10" />
                    <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Team Size</Label>
                  <div className="relative">
                    <Input type="number" placeholder="10" required className="pl-10" />
                    <Users className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <div className="relative">
                  <Textarea 
                    placeholder="Tell us about your needs..."
                    className="min-h-[100px] pl-10"
                    required
                  />
                  <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500">
                Send Message
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
} 