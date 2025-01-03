export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-pink-500/5">
      {children}
    </div>
  )
} 