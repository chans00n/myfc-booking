import { createServiceClient } from '@/lib/supabase/service'
import { Database } from '@/types/database'

interface DailyRoom {
  id: string
  name: string
  url: string
  created_at: string
  config: {
    max_participants?: number
    enable_recording?: boolean
    enable_chat?: boolean
    enable_screenshare?: boolean
    exp?: number
    nbf?: number
  }
}

interface DailyMeetingToken {
  token: string
}

interface DailyParticipant {
  id: string
  user_name: string
  joined_at: string
  duration: number
}

interface ConsultationRoomConfig {
  consultationId: string
  clientName: string
  therapistName?: string
  startTime?: Date
  durationMinutes?: number
}

class DailyService {
  private apiKey: string
  private domain: string
  private baseUrl: string

  constructor() {
    // Note: Daily API key should NOT be exposed to the client
    // This should only be used in server-side functions or API routes
    this.apiKey = process.env.DAILY_API_KEY || ''
    this.domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN || ''
    this.baseUrl = 'https://api.daily.co/v1'

    if (!this.apiKey && typeof window === 'undefined') {
      console.warn('Daily.co API key not configured. Add DAILY_API_KEY to your .env.local file')
    }
    if (!this.domain) {
      console.warn('Daily.co domain not configured. Add NEXT_PUBLIC_DAILY_DOMAIN to your .env.local file')
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Create a private consultation room with 30-minute limit
   */
  async createConsultationRoom({
    consultationId,
    clientName,
    therapistName = 'Therapist',
    startTime = new Date(),
    durationMinutes = 30
  }: ConsultationRoomConfig): Promise<{ roomUrl: string; roomName: string }> {
    try {
      // Generate unique room name
      const roomName = `consultation-${consultationId}-${Date.now()}`
      
      // Calculate expiration time (30 minutes from start)
      const expTime = Math.floor(startTime.getTime() / 1000) + (durationMinutes * 60)
      
      // Create room configuration
      const roomConfig = {
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 2,
          enable_recording: false, // Privacy compliance
          enable_chat: true,
          enable_screenshare: true,
          enable_knocking: true,
          exp: expTime, // Room expires after consultation time
          nbf: Math.floor(startTime.getTime() / 1000), // Not before start time
          lang: 'en',
          geo: 'us-west-2',
          enable_prejoin_ui: true,
          enable_network_ui: true,
          enable_video_processing_ui: false,
          meeting_join_hook: {
            enabled: true,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/daily/join-hook`
          }
        }
      }

      const response = await fetch(`${this.baseUrl}/rooms`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(roomConfig)
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 400 && error.error === 'authorization-header-error') {
          throw new Error('Daily.co API key is invalid or missing. Please check your DAILY_API_KEY in .env.local')
        }
        throw new Error(`Failed to create room: ${error.error || response.statusText}`)
      }

      const room: DailyRoom = await response.json()

      // Store room details in database
      await this.updateConsultationRoom(consultationId, {
        daily_room_url: room.url,
        daily_room_name: room.name
      })

      return {
        roomUrl: room.url,
        roomName: room.name
      }
    } catch (error) {
      console.error('Error creating consultation room:', error)
      throw error
    }
  }

  /**
   * Generate meeting token for participants with appropriate permissions
   */
  async generateConsultationToken(
    roomName: string,
    participantName: string,
    isOwner: boolean = false
  ): Promise<string> {
    try {
      const tokenConfig = {
        properties: {
          room_name: roomName,
          user_name: participantName,
          is_owner: isOwner,
          enable_screenshare: isOwner, // Only therapist can screenshare
          start_video_off: false,
          start_audio_off: false,
          enable_recording: false, // Never allow recording for privacy
          permissions: {
            canSend: ['video', 'audio', 'screenVideo', 'screenAudio'],
            canReceive: ['video', 'audio', 'screenVideo', 'screenAudio'],
            canAdmin: isOwner ? ['participants', 'streaming'] : []
          }
        }
      }

      const response = await fetch(`${this.baseUrl}/meeting-tokens`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(tokenConfig)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to create meeting token: ${error.error || response.statusText}`)
      }

      const tokenData: DailyMeetingToken = await response.json()
      
      // Store token in database for the consultation
      if (isOwner) {
        await this.updateConsultationRoom(roomName, {
          daily_room_token: tokenData.token
        })
      }

      return tokenData.token
    } catch (error) {
      console.error('Error generating meeting token:', error)
      throw error
    }
  }

  /**
   * End and cleanup consultation room
   */
  async endConsultationRoom(roomName: string): Promise<void> {
    try {
      // Delete the room from Daily.co
      const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok && response.status !== 404) {
        const error = await response.json()
        throw new Error(`Failed to delete room: ${error.error || response.statusText}`)
      }

      // Clear room details from database
      await this.clearConsultationRoom(roomName)
    } catch (error) {
      console.error('Error ending consultation room:', error)
      throw error
    }
  }

  /**
   * Get room statistics and participants
   */
  async getConsultationRoomInfo(roomName: string): Promise<{
    room: DailyRoom | null
    participants: DailyParticipant[]
    isActive: boolean
  }> {
    try {
      // Get room details
      const roomResponse = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
        headers: this.getHeaders()
      })

      let room: DailyRoom | null = null
      let isActive = false

      if (roomResponse.ok) {
        room = await roomResponse.json()
        isActive = true
      }

      // Get active participants
      const participantsResponse = await fetch(
        `${this.baseUrl}/rooms/${roomName}/presence`,
        {
          headers: this.getHeaders()
        }
      )

      let participants: DailyParticipant[] = []
      if (participantsResponse.ok) {
        const data = await participantsResponse.json()
        participants = data.participants || []
      }

      return {
        room,
        participants,
        isActive
      }
    } catch (error) {
      console.error('Error getting room info:', error)
      return {
        room: null,
        participants: [],
        isActive: false
      }
    }
  }

  /**
   * Update consultation room details in database
   */
  private async updateConsultationRoom(
    consultationIdOrRoomName: string,
    updates: {
      daily_room_url?: string
      daily_room_name?: string
      daily_room_token?: string
    }
  ): Promise<void> {
    const supabase = createServiceClient()

    // Try to find by consultation ID first, then by room name
    const { error } = await supabase
      .from('consultations')
      .update(updates)
      .or(`id.eq.${consultationIdOrRoomName},daily_room_name.eq.${consultationIdOrRoomName}`)

    if (error) {
      console.error('Error updating consultation room:', error)
      throw error
    }
  }

  /**
   * Clear consultation room details from database
   */
  private async clearConsultationRoom(roomName: string): Promise<void> {
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('consultations')
      .update({
        daily_room_url: null,
        daily_room_name: null,
        daily_room_token: null
      })
      .eq('daily_room_name', roomName)

    if (error) {
      console.error('Error clearing consultation room:', error)
      throw error
    }
  }

  /**
   * Check if Daily.co is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.domain)
  }

  /**
   * Get Daily.co domain for frontend usage
   */
  getDomain(): string {
    return this.domain
  }
}

// Export singleton instance
export const dailyService = new DailyService()

// Export helper functions for common operations
export async function setupConsultationVideo(
  consultationId: string,
  clientName: string,
  therapistName?: string
): Promise<{
  roomUrl: string
  clientToken: string
  therapistToken: string
}> {
  // Create room
  const { roomUrl, roomName } = await dailyService.createConsultationRoom({
    consultationId,
    clientName,
    therapistName
  })

  // Generate tokens
  const [clientToken, therapistToken] = await Promise.all([
    dailyService.generateConsultationToken(roomName, clientName, false),
    dailyService.generateConsultationToken(roomName, therapistName || 'Therapist', true)
  ])

  return {
    roomUrl,
    clientToken,
    therapistToken
  }
}

export async function cleanupConsultationVideo(roomName: string): Promise<void> {
  await dailyService.endConsultationRoom(roomName)
}

export async function getConsultationStatus(roomName: string) {
  return dailyService.getConsultationRoomInfo(roomName)
}