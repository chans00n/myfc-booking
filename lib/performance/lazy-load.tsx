import dynamic from 'next/dynamic'
import { ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingComponentProps {
  message?: string
}

const LoadingComponent = ({ message = 'Loading...' }: LoadingComponentProps) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
)

export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  loadingMessage?: string
) {
  return dynamic(importFunc, {
    loading: () => <LoadingComponent message={loadingMessage} />,
    ssr: false,
  })
}