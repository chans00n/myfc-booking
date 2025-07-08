export interface DailyRoomConfig {
  name: string;
  privacy: "public" | "private";
  properties: {
    max_participants?: number;
    enable_recording?: boolean;
    enable_chat?: boolean;
    enable_screenshare?: boolean;
    enable_knocking?: boolean;
    exp?: number; // Expiration time (unix timestamp)
    nbf?: number; // Not before time (unix timestamp)
    lang?: string;
    geo?: string;
    enable_prejoin_ui?: boolean;
    enable_network_ui?: boolean;
    enable_video_processing_ui?: boolean;
    meeting_join_hook?: {
      enabled: boolean;
      url: string;
    };
  };
}

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: DailyRoomConfig["properties"];
}

export interface DailyMeetingToken {
  token: string;
}

export interface DailyTokenConfig {
  properties: {
    room_name: string;
    user_name: string;
    is_owner?: boolean;
    enable_screenshare?: boolean;
    start_video_off?: boolean;
    start_audio_off?: boolean;
    enable_recording?: boolean;
    exp?: number;
    permissions?: {
      canSend?: string[];
      canReceive?: string[];
      canAdmin?: string[];
    };
  };
}

export interface DailyParticipant {
  id: string;
  user_id?: string;
  user_name: string;
  joined_at: string;
  duration: number;
  session_id: string;
  region: string;
}

export interface DailyPresenceResponse {
  participants: DailyParticipant[];
  room_name: string;
  total_count: number;
}

export interface ConsultationVideoSession {
  consultationId: string;
  roomUrl: string;
  roomName: string;
  clientToken: string;
  therapistToken: string;
  expiresAt: Date;
}

export interface VideoConsultationStatus {
  isActive: boolean;
  participantCount: number;
  participants: DailyParticipant[];
  startedAt?: Date;
  duration?: number;
}
