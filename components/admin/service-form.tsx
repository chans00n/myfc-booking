'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { serviceSchema, type ServiceFormData, parsePriceInput, formatPrice } from '@/lib/services/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { Service } from '@/types'

interface ServiceFormProps {
  service?: Service
  onSubmit: (data: ServiceFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ServiceForm({ service, onSubmit, onCancel, loading = false }: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service ? {
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price_cents: service.price_cents,
      is_active: service.is_active,
    } : {
      is_active: true,
      duration_minutes: 60,
      price_cents: 8000,
    },
  })

  const isActive = watch('is_active')

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cents = parsePriceInput(e.target.value)
    setValue('price_cents', cents)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Service Name</Label>
        <Input
          id="name"
          placeholder="Swedish Massage"
          {...register('name')}
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="A relaxing full-body massage using long strokes..."
          rows={4}
          {...register('description')}
          disabled={loading}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Select
            value={watch('duration_minutes')?.toString()}
            onValueChange={(value) => setValue('duration_minutes', parseInt(value))}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="75">1 hour 15 min</SelectItem>
              <SelectItem value="90">1 hour 30 min</SelectItem>
              <SelectItem value="105">1 hour 45 min</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="150">2 hours 30 min</SelectItem>
              <SelectItem value="180">3 hours</SelectItem>
            </SelectContent>
          </Select>
          {errors.duration_minutes && (
            <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="text"
            placeholder="$80.00"
            defaultValue={service ? formatPrice(service.price_cents).replace('$', '') : '80.00'}
            onChange={handlePriceChange}
            disabled={loading}
          />
          {errors.price_cents && (
            <p className="text-sm text-destructive">{errors.price_cents.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue('is_active', checked)}
          disabled={loading}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Service is active and available for booking
        </Label>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {service ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            service ? 'Update Service' : 'Create Service'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </form>
  )
}