'use client'

import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/types'
import type { ServiceFormData } from './schemas'

export async function createServiceClient(data: ServiceFormData): Promise<{ data?: Service; error?: string }> {
  const supabase = createClient()
  
  const { data: service, error } = await supabase
    .from('services')
    .insert({
      name: data.name,
      description: data.description,
      duration_minutes: data.duration_minutes,
      price_cents: data.price_cents,
      is_active: data.is_active,
    })
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  return { data: service }
}

export async function updateServiceClient(
  serviceId: string,
  data: Partial<ServiceFormData>
): Promise<{ data?: Service; error?: string }> {
  const supabase = createClient()
  
  const { data: service, error } = await supabase
    .from('services')
    .update(data)
    .eq('id', serviceId)
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  return { data: service }
}

export async function deleteServiceClient(serviceId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', serviceId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

export async function getAllServices(includeInactive = false): Promise<Service[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('services')
    .select('*')
    .order('name')
  
  if (!includeInactive) {
    query = query.eq('is_active', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching services:', error)
    return []
  }
  
  return data || []
}

export async function getActiveServices(): Promise<Service[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true })
  
  if (error) {
    console.error('Error fetching active services:', error)
    return []
  }
  
  return data || []
}

export async function searchServices(
  searchTerm: string,
  filters?: {
    minPrice?: number
    maxPrice?: number
    minDuration?: number
    maxDuration?: number
  }
): Promise<Service[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
  
  // Add search filter
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  }
  
  // Add price filters
  if (filters?.minPrice !== undefined) {
    query = query.gte('price_cents', filters.minPrice)
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte('price_cents', filters.maxPrice)
  }
  
  // Add duration filters
  if (filters?.minDuration !== undefined) {
    query = query.gte('duration_minutes', filters.minDuration)
  }
  if (filters?.maxDuration !== undefined) {
    query = query.lte('duration_minutes', filters.maxDuration)
  }
  
  const { data, error } = await query.order('name')
  
  if (error) {
    console.error('Error searching services:', error)
    return []
  }
  
  return data || []
}