'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw, Trash2 } from 'lucide-react'

export function CreateTestDataButton() {
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const createTestData = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/consultations/create-test-data', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to create test data')
      }

      const data = await response.json()
      toast.success(`Created ${data.appointments} appointments and ${data.consultations} consultations`)
      
      // Refresh the page to show new data
      window.location.reload()
    } catch (error) {
      console.error('Error creating test data:', error)
      toast.error('Failed to create test data')
    } finally {
      setIsCreating(false)
    }
  }

  const deleteTestData = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/admin/consultations/create-test-data', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete test data')
      }

      toast.success('Test data deleted successfully')
      
      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.error('Error deleting test data:', error)
      toast.error('Failed to delete test data')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={createTestData}
        disabled={isCreating || isDeleting}
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${isCreating ? 'animate-spin' : ''}`} />
        Create Test Data
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={deleteTestData}
        disabled={isCreating || isDeleting}
      >
        <Trash2 className={`h-4 w-4 mr-1 ${isDeleting ? 'animate-spin' : ''}`} />
        Delete Test Data
      </Button>
    </div>
  )
}