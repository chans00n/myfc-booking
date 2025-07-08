'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertCircle } from 'lucide-react'

interface ConsultationTimerProps {
  startTime: Date
  maxDuration: number // in minutes
}

export function ConsultationTimer({ startTime, maxDuration }: ConsultationTimerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [isWarning, setIsWarning] = useState(false)
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000)
      setElapsed(elapsedMinutes)
      
      // Show warning when 5 minutes remain
      setIsWarning(elapsedMinutes >= maxDuration - 5)
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime, maxDuration])

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 
      ? `${hours}:${mins.toString().padStart(2, '0')}` 
      : `${mins}:00`
  }

  const remainingMinutes = Math.max(0, maxDuration - elapsed)
  const isOvertime = elapsed >= maxDuration

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
      isOvertime ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
      isWarning ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }`}>
      {isOvertime ? (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>Overtime: +{formatTime(elapsed - maxDuration)}</span>
        </>
      ) : (
        <>
          <Clock className="h-4 w-4" />
          <span>Time: {formatTime(elapsed)} / {maxDuration}:00</span>
          {isWarning && (
            <span className="text-xs">({remainingMinutes} min left)</span>
          )}
        </>
      )}
    </div>
  )
}