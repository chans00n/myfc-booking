"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { createClient } from '@/lib/supabase/client'

interface ServiceData {
  name: string
  bookings: number
  revenue: number
}

export function ChartServiceAnalytics() {
  const [data, setData] = React.useState<ServiceData[]>([])
  const [loading, setLoading] = React.useState(true)
  
  const supabase = createClient()

  React.useEffect(() => {
    fetchServiceData()
  }, [])

  const fetchServiceData = async () => {
    setLoading(true)
    try {
      // Fetch all appointments with service details
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          service_id,
          total_price_cents,
          status,
          service:services!appointments_service_id_fkey(
            id,
            name
          )
        `)
        .in('status', ['completed', 'confirmed', 'scheduled'])

      if (error) throw error

      // Aggregate data by service
      const serviceMap = new Map<string, { name: string; bookings: number; revenue: number }>()
      
      appointments?.forEach(appointment => {
        if (appointment.service) {
          const serviceId = appointment.service.id
          const existing = serviceMap.get(serviceId) || {
            name: appointment.service.name,
            bookings: 0,
            revenue: 0
          }
          
          existing.bookings++
          if (appointment.status === 'completed' && appointment.total_price_cents) {
            existing.revenue += appointment.total_price_cents / 100
          }
          
          serviceMap.set(serviceId, existing)
        }
      })

      // Convert to array and sort by bookings
      const chartData = Array.from(serviceMap.values())
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5) // Top 5 services

      setData(chartData)
    } catch (error) {
      console.error('Error fetching service data:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartConfig = {
    bookings: {
      label: "Bookings",
      color: "hsl(var(--chart-1))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Services</CardTitle>
        <CardDescription>
          Top services by number of bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No service data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        if (name === 'bookings') {
                          return [`${value} bookings`, 'Total Bookings']
                        }
                        return [value, name]
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="bookings"
                  fill="var(--color-bookings)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {data.length > 0 && (
          <div className="mt-4 space-y-2">
            {data.map((service, index) => (
              <div key={service.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-primary`} />
                  <span className="font-medium">{index + 1}. {service.name}</span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{service.bookings} bookings</span>
                  <span className="font-medium">${service.revenue.toFixed(0)} revenue</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}