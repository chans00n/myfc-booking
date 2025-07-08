export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointment_settings: {
        Row: {
          advance_booking_days: number | null
          buffer_time_minutes: number | null
          cancellation_cutoff_hours: number | null
          created_at: string | null
          google_calendar_id: string | null
          google_refresh_token: string | null
          id: string
          minimum_notice_hours: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          advance_booking_days?: number | null
          buffer_time_minutes?: number | null
          cancellation_cutoff_hours?: number | null
          created_at?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          id?: string
          minimum_notice_hours?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          advance_booking_days?: number | null
          buffer_time_minutes?: number | null
          cancellation_cutoff_hours?: number | null
          created_at?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          id?: string
          minimum_notice_hours?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          client_id: string
          created_at: string | null
          deposit_amount_cents: number | null
          end_time: string
          id: string
          notes: string | null
          payment_collected_at: string | null
          payment_collection_method:
            | Database["public"]["Enums"]["payment_collection_method"]
            | null
          payment_id: string | null
          payment_preference:
            | Database["public"]["Enums"]["payment_preference"]
            | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          requires_payment: boolean | null
          service_id: string
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          stripe_payment_intent_id: string | null
          total_price_cents: number
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          client_id: string
          created_at?: string | null
          deposit_amount_cents?: number | null
          end_time: string
          id?: string
          notes?: string | null
          payment_collected_at?: string | null
          payment_collection_method?:
            | Database["public"]["Enums"]["payment_collection_method"]
            | null
          payment_id?: string | null
          payment_preference?:
            | Database["public"]["Enums"]["payment_preference"]
            | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          requires_payment?: boolean | null
          service_id: string
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          stripe_payment_intent_id?: string | null
          total_price_cents: number
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          client_id?: string
          created_at?: string | null
          deposit_amount_cents?: number | null
          end_time?: string
          id?: string
          notes?: string | null
          payment_collected_at?: string | null
          payment_collection_method?:
            | Database["public"]["Enums"]["payment_collection_method"]
            | null
          payment_id?: string | null
          payment_preference?:
            | Database["public"]["Enums"]["payment_preference"]
            | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          requires_payment?: boolean | null
          service_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          stripe_payment_intent_id?: string | null
          total_price_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_consultation_eligibility"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consultations: {
        Row: {
          appointment_id: string
          client_goals: string | null
          client_id: string
          completed_at: string | null
          consultation_notes: string | null
          consultation_status: Database["public"]["Enums"]["consultation_status"]
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string | null
          daily_room_name: string | null
          daily_room_token: string | null
          daily_room_url: string | null
          follow_up_scheduled: boolean | null
          health_overview: string | null
          id: string
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          client_goals?: string | null
          client_id: string
          completed_at?: string | null
          consultation_notes?: string | null
          consultation_status?: Database["public"]["Enums"]["consultation_status"]
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at?: string | null
          daily_room_name?: string | null
          daily_room_token?: string | null
          daily_room_url?: string | null
          follow_up_scheduled?: boolean | null
          health_overview?: string | null
          id?: string
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          client_goals?: string | null
          client_id?: string
          completed_at?: string | null
          consultation_notes?: string | null
          consultation_status?: Database["public"]["Enums"]["consultation_status"]
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string | null
          daily_room_name?: string | null
          daily_room_token?: string | null
          daily_room_url?: string | null
          follow_up_scheduled?: boolean | null
          health_overview?: string | null
          id?: string
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_consultation_eligibility"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "consultations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_form_responses: {
        Row: {
          created_at: string | null
          form_id: string
          id: string
          question_key: string
          question_text: string
          response_type: string
          response_value: Json | null
        }
        Insert: {
          created_at?: string | null
          form_id: string
          id?: string
          question_key: string
          question_text: string
          response_type: string
          response_value?: Json | null
        }
        Update: {
          created_at?: string | null
          form_id?: string
          id?: string
          question_key?: string
          question_text?: string
          response_type?: string
          response_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_form_templates: {
        Row: {
          created_at: string | null
          form_type: string
          id: string
          is_active: boolean | null
          name: string
          sections: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_type: string
          id?: string
          is_active?: boolean | null
          name: string
          sections: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sections?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      intake_forms: {
        Row: {
          allergies: string[] | null
          appointment_id: string | null
          areas_to_avoid: string[] | null
          avoid_areas: string | null
          best_time_to_call: string | null
          client_id: string
          consent_agreements: Json | null
          consent_date: string | null
          consent_signature: string | null
          created_at: string | null
          current_medications: string[] | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          focus_areas: string | null
          form_category: Database["public"]["Enums"]["intake_form_type"] | null
          form_type: string | null
          goals: string | null
          health_conditions: string | null
          id: string
          injuries: Json | null
          massage_experience: string | null
          massage_frequency: string | null
          massage_goals: string | null
          medical_conditions: Json | null
          medications: string[] | null
          pain_areas: Json | null
          pain_level: number | null
          preferred_contact_method:
            | Database["public"]["Enums"]["contact_method"]
            | null
          preferred_techniques: string[] | null
          pressure_preference:
            | Database["public"]["Enums"]["pressure_preference"]
            | null
          previous_massage_experience: boolean | null
          previous_massage_therapy: string | null
          primary_concerns: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specific_concerns: string | null
          status: string | null
          submitted_at: string | null
          surgeries: Json | null
          treatment_goals: string | null
          updated_at: string | null
        }
        Insert: {
          allergies?: string[] | null
          appointment_id?: string | null
          areas_to_avoid?: string[] | null
          avoid_areas?: string | null
          best_time_to_call?: string | null
          client_id: string
          consent_agreements?: Json | null
          consent_date?: string | null
          consent_signature?: string | null
          created_at?: string | null
          current_medications?: string[] | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          focus_areas?: string | null
          form_category?: Database["public"]["Enums"]["intake_form_type"] | null
          form_type?: string | null
          goals?: string | null
          health_conditions?: string | null
          id?: string
          injuries?: Json | null
          massage_experience?: string | null
          massage_frequency?: string | null
          massage_goals?: string | null
          medical_conditions?: Json | null
          medications?: string[] | null
          pain_areas?: Json | null
          pain_level?: number | null
          preferred_contact_method?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          preferred_techniques?: string[] | null
          pressure_preference?:
            | Database["public"]["Enums"]["pressure_preference"]
            | null
          previous_massage_experience?: boolean | null
          previous_massage_therapy?: string | null
          primary_concerns?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specific_concerns?: string | null
          status?: string | null
          submitted_at?: string | null
          surgeries?: Json | null
          treatment_goals?: string | null
          updated_at?: string | null
        }
        Update: {
          allergies?: string[] | null
          appointment_id?: string | null
          areas_to_avoid?: string[] | null
          avoid_areas?: string | null
          best_time_to_call?: string | null
          client_id?: string
          consent_agreements?: Json | null
          consent_date?: string | null
          consent_signature?: string | null
          created_at?: string | null
          current_medications?: string[] | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          focus_areas?: string | null
          form_category?: Database["public"]["Enums"]["intake_form_type"] | null
          form_type?: string | null
          goals?: string | null
          health_conditions?: string | null
          id?: string
          injuries?: Json | null
          massage_experience?: string | null
          massage_frequency?: string | null
          massage_goals?: string | null
          medical_conditions?: Json | null
          medications?: string[] | null
          pain_areas?: Json | null
          pain_level?: number | null
          preferred_contact_method?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          preferred_techniques?: string[] | null
          pressure_preference?:
            | Database["public"]["Enums"]["pressure_preference"]
            | null
          previous_massage_experience?: boolean | null
          previous_massage_therapy?: string | null
          primary_concerns?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specific_concerns?: string | null
          status?: string | null
          submitted_at?: string | null
          surgeries?: Json | null
          treatment_goals?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_forms_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_forms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_consultation_eligibility"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "intake_forms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_forms_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "client_consultation_eligibility"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "intake_forms_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          appointment_reminder_24h: boolean | null
          appointment_reminder_2h: boolean | null
          booking_confirmation: boolean | null
          cancellation_notification: boolean | null
          created_at: string | null
          email_enabled: boolean | null
          follow_up_emails: boolean | null
          id: string
          intake_form_reminder: boolean | null
          marketing_emails: boolean | null
          reminder_time_24h: string | null
          reminder_time_2h: string | null
          rescheduling_notification: boolean | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          appointment_reminder_24h?: boolean | null
          appointment_reminder_2h?: boolean | null
          booking_confirmation?: boolean | null
          cancellation_notification?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          follow_up_emails?: boolean | null
          id?: string
          intake_form_reminder?: boolean | null
          marketing_emails?: boolean | null
          reminder_time_24h?: string | null
          reminder_time_2h?: string | null
          rescheduling_notification?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_reminder_24h?: boolean | null
          appointment_reminder_2h?: boolean | null
          booking_confirmation?: boolean | null
          cancellation_notification?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          follow_up_emails?: boolean | null
          id?: string
          intake_form_reminder?: boolean | null
          marketing_emails?: boolean | null
          reminder_time_24h?: string | null
          reminder_time_2h?: string | null
          rescheduling_notification?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "client_consultation_eligibility"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          appointment_id: string | null
          channel: string
          content: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_id: string | null
          recipient_phone: string | null
          retry_count: number | null
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          channel: string
          content: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_id?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          scheduled_for: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          content?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_id?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "client_consultation_eligibility"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_collections: {
        Row: {
          amount_cents: number
          appointment_id: string
          collected_at: string | null
          collected_by: string
          collection_method: Database["public"]["Enums"]["payment_collection_method"]
          created_at: string | null
          id: string
          notes: string | null
          payment_reference: string | null
        }
        Insert: {
          amount_cents: number
          appointment_id: string
          collected_at?: string | null
          collected_by: string
          collection_method: Database["public"]["Enums"]["payment_collection_method"]
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_reference?: string | null
        }
        Update: {
          amount_cents?: number
          appointment_id?: string
          collected_at?: string | null
          collected_by?: string
          collection_method?: Database["public"]["Enums"]["payment_collection_method"]
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_collections_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_collections_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "client_consultation_eligibility"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "payment_collections_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string | null
          error_code: string | null
          error_message: string | null
          event_data: Json | null
          event_type: string
          id: string
          payment_id: string
          stripe_event_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          payment_id: string
          stripe_event_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          payment_id?: string
          stripe_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          appointment_id: string
          client_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_method_type: string | null
          receipt_number: string | null
          receipt_url: string | null
          refund_reason: string | null
          refunded_amount_cents: number | null
          refunded_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_method_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          appointment_id: string
          client_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method_type?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          refund_reason?: string | null
          refunded_amount_cents?: number | null
          refunded_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          appointment_id?: string
          client_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method_type?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          refund_reason?: string | null
          refunded_amount_cents?: number | null
          refunded_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_consultation_eligibility"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          consultation_count: number | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          first_name: string | null
          has_had_free_consultation: boolean | null
          id: string
          last_consultation_date: string | null
          last_name: string | null
          phone: string | null
          role: string | null
          state: string | null
          stripe_customer_id: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          consultation_count?: number | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          has_had_free_consultation?: boolean | null
          id: string
          last_consultation_date?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          consultation_count?: number | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          has_had_free_consultation?: boolean | null
          id?: string
          last_consultation_date?: string | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          consultation_limit: number | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          is_consultation: boolean
          name: string
          price_cents: number
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Insert: {
          consultation_limit?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          is_consultation?: boolean
          name: string
          price_cents: number
          service_type?: Database["public"]["Enums"]["service_type"]
        }
        Update: {
          consultation_limit?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_consultation?: boolean
          name?: string
          price_cents?: number
          service_type?: Database["public"]["Enums"]["service_type"]
        }
        Relationships: []
      }
      time_blocks: {
        Row: {
          block_type: string | null
          created_at: string | null
          end_datetime: string
          google_event_id: string | null
          id: string
          is_recurring: boolean | null
          recurrence_rule: string | null
          start_datetime: string
          title: string
          updated_at: string | null
        }
        Insert: {
          block_type?: string | null
          created_at?: string | null
          end_datetime: string
          google_event_id?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          start_datetime: string
          title: string
          updated_at?: string | null
        }
        Update: {
          block_type?: string | null
          created_at?: string | null
          end_datetime?: string
          google_event_id?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          start_datetime?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      client_consultation_eligibility: {
        Row: {
          client_id: string | null
          consultation_count: number | null
          email: string | null
          first_name: string | null
          has_had_free_consultation: boolean | null
          is_eligible: boolean | null
          last_consultation_date: string | null
          last_name: string | null
        }
        Insert: {
          client_id?: string | null
          consultation_count?: number | null
          email?: string | null
          first_name?: string | null
          has_had_free_consultation?: boolean | null
          is_eligible?: never
          last_consultation_date?: string | null
          last_name?: string | null
        }
        Update: {
          client_id?: string | null
          consultation_count?: number | null
          email?: string | null
          first_name?: string | null
          has_had_free_consultation?: boolean | null
          is_eligible?: never
          last_consultation_date?: string | null
          last_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_appointment_conflict: {
        Args: {
          p_service_id: string
          p_appointment_date: string
          p_start_time: string
          p_end_time: string
          p_appointment_id?: string
        }
        Returns: boolean
      }
      check_consultation_eligibility: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      create_consultation_appointment: {
        Args: {
          p_client_id: string
          p_appointment_date: string
          p_start_time: string
          p_consultation_type: Database["public"]["Enums"]["consultation_type"]
          p_notes?: string
        }
        Returns: string
      }
      generate_receipt_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_available_slots: {
        Args: { p_service_id: string; p_date: string }
        Returns: {
          start_time: string
          end_time: string
        }[]
      }
      get_consultation_details: {
        Args: { p_appointment_id: string }
        Returns: {
          consultation_id: string
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          consultation_status: Database["public"]["Enums"]["consultation_status"]
          daily_room_url: string
          consultation_notes: string
          client_goals: string
          health_overview: string
          started_at: string
          completed_at: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_consultation_appointment: {
        Args: { p_appointment_id: string }
        Returns: boolean
      }
      update_consultation_status: {
        Args: {
          p_consultation_id: string
          p_status: Database["public"]["Enums"]["consultation_status"]
          p_notes?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      consultation_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      consultation_type: "phone" | "video" | "in_person"
      contact_method: "phone" | "video" | "in_person"
      intake_form_type: "full_intake" | "consultation" | "health_update"
      payment_collection_method:
        | "online"
        | "in_person_card"
        | "cash"
        | "check"
        | "other"
      payment_preference: "pay_now" | "pay_at_appointment" | "pay_cash"
      payment_status: "pending" | "paid" | "refunded" | "will_pay_later"
      pressure_preference: "light" | "medium" | "firm" | "deep" | "varies"
      service_type: "massage" | "consultation"
      user_role: "client" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      consultation_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      consultation_type: ["phone", "video", "in_person"],
      contact_method: ["phone", "video", "in_person"],
      intake_form_type: ["full_intake", "consultation", "health_update"],
      payment_collection_method: [
        "online",
        "in_person_card",
        "cash",
        "check",
        "other",
      ],
      payment_preference: ["pay_now", "pay_at_appointment", "pay_cash"],
      payment_status: ["pending", "paid", "refunded", "will_pay_later"],
      pressure_preference: ["light", "medium", "firm", "deep", "varies"],
      service_type: ["massage", "consultation"],
      user_role: ["client", "admin"],
    },
  },
} as const
