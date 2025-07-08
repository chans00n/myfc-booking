'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function CreateProfileButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleCreateProfile = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/profile/create', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Profile created successfully!',
        })
        
        // Refresh the page to reload auth context
        router.refresh()
        window.location.reload()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create profile',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleCreateProfile} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Profile...
        </>
      ) : (
        'Create Profile'
      )}
    </Button>
  )
}