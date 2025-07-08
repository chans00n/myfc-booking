import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
}

export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>(Date.now())
  const renderStartTime = useRef<number>(0)
  const firstInteractionTime = useRef<number>(0)

  useEffect(() => {
    renderStartTime.current = Date.now()

    // Log component mount time
    const mountTime = renderStartTime.current - startTime.current
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} mounted in ${mountTime}ms`)
    }

    // Monitor first interaction
    const handleFirstInteraction = () => {
      if (!firstInteractionTime.current) {
        firstInteractionTime.current = Date.now()
        const interactionTime = firstInteractionTime.current - renderStartTime.current
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${componentName} first interaction after ${interactionTime}ms`)
        }

        // Clean up listeners
        document.removeEventListener('click', handleFirstInteraction)
        document.removeEventListener('keydown', handleFirstInteraction)
      }
    }

    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('keydown', handleFirstInteraction)

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [componentName])

  // Return metrics for custom handling
  return {
    getMountTime: () => renderStartTime.current - startTime.current,
    getInteractionTime: () => firstInteractionTime.current - renderStartTime.current,
  }
}