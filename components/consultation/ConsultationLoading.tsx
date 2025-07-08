import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export function ConsultationLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background">
      <div className="text-center space-y-4">
        <div className="mx-auto">
          <Image
            src="/soza-logo.png"
            alt="SOZA Massage"
            width={120}
            height={40}
            className="dark:invert animate-pulse"
          />
        </div>
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Setting up your consultation room...</p>
        </div>
        <p className="text-sm text-muted-foreground">This may take a few moments</p>
      </div>
    </div>
  )
}