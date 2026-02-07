export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      customer_assets: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          install_date: string | null
          last_maintenance_date: string | null
          meta_data: Json | null
          model: string | null
          name: string
          next_maintenance_date: string | null
          type: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          install_date?: string | null
          last_maintenance_date?: string | null
          meta_data?: Json | null
          model?: string | null
          name: string
          next_maintenance_date?: string | null
          type: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          install_date?: string | null
          last_maintenance_date?: string | null
          meta_data?: Json | null
          model?: string | null
          name?: string
          next_maintenance_date?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          city: string | null
          coordinates: unknown
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          status_called: boolean | null
          status_confirmed: boolean | null
          status_mail_sent: boolean | null
          status_visited: boolean | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          coordinates?: unknown
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          status_called?: boolean | null
          status_confirmed?: boolean | null
          status_mail_sent?: boolean | null
          status_visited?: boolean | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          coordinates?: unknown
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          status_called?: boolean | null
          status_confirmed?: boolean | null
          status_mail_sent?: boolean | null
          status_visited?: boolean | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads_recovery: {
        Row: {
          abandoned_at: string
          chat_session_id: string
          created_at: string | null
          detected_intent: string | null
          extracted_contact: Json | null
          id: string
          lead_score: number | null
          notes: string | null
          status: Database["public"]["Enums"]["recovery_status"] | null
          updated_at: string | null
        }
        Insert: {
          abandoned_at: string
          chat_session_id: string
          created_at?: string | null
          detected_intent?: string | null
          extracted_contact?: Json | null
          id?: string
          lead_score?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["recovery_status"] | null
          updated_at?: string | null
        }
        Update: {
          abandoned_at?: string
          chat_session_id?: string
          created_at?: string | null
          detected_intent?: string | null
          extracted_contact?: Json | null
          id?: string
          lead_score?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["recovery_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_session_id: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          meta_data: Json | null
          role: string
          ticket_id: string | null
        }
        Insert: {
          chat_session_id?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          meta_data?: Json | null
          role: string
          ticket_id?: string | null
        }
        Update: {
          chat_session_id?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          meta_data?: Json | null
          role?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          created_at: string
          id: string
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          coverage_area: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          loyalty_level: string | null
          loyalty_points: number | null
          phone: string | null
          pin: string | null
          primary_role: string | null
          role: string
          status: string | null
          user_type: string | null
          vat_number: string | null
        }
        Insert: {
          business_name?: string | null
          coverage_area?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          loyalty_level?: string | null
          loyalty_points?: number | null
          phone?: string | null
          pin?: string | null
          primary_role?: string | null
          role?: string
          status?: string | null
          user_type?: string | null
          vat_number?: string | null
        }
        Update: {
          business_name?: string | null
          coverage_area?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          loyalty_level?: string | null
          loyalty_points?: number | null
          phone?: string | null
          pin?: string | null
          primary_role?: string | null
          role?: string
          status?: string | null
          user_type?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      technician_applications: {
        Row: {
          created_at: string
          email: string
          experience: string | null
          id: string
          name: string
          notes: string | null
          partita_iva: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          specializations: string[]
          status: string
          updated_at: string
          zones: string[]
        }
        Insert: {
          created_at?: string
          email: string
          experience?: string | null
          id?: string
          name: string
          notes?: string | null
          partita_iva?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specializations: string[]
          status?: string
          updated_at?: string
          zones: string[]
        }
        Update: {
          created_at?: string
          email?: string
          experience?: string | null
          id?: string
          name?: string
          notes?: string | null
          partita_iva?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specializations?: string[]
          status?: string
          updated_at?: string
          zones?: string[]
        }
        Relationships: []
      }
      technician_assignment_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ticket_id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ticket_id: string
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ticket_id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_assignment_tokens_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_assignment_tokens_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_notifications: {
        Row: {
          id: string
          message_content: string | null
          meta_data: Json | null
          notification_type: string
          sent_at: string
          status: string
          technician_id: string | null
          telegram_message_id: string | null
          ticket_id: string
          token_id: string | null
        }
        Insert: {
          id?: string
          message_content?: string | null
          meta_data?: Json | null
          notification_type?: string
          sent_at?: string
          status?: string
          technician_id?: string | null
          telegram_message_id?: string | null
          ticket_id: string
          token_id?: string | null
        }
        Update: {
          id?: string
          message_content?: string | null
          meta_data?: Json | null
          notification_type?: string
          sent_at?: string
          status?: string
          technician_id?: string | null
          telegram_message_id?: string | null
          ticket_id?: string
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_notifications_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "technician_assignment_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          address: string | null
          ai_paused: boolean | null
          asset_id: string | null
          assigned_at: string | null
          assigned_technician_id: string | null
          category: string
          chat_session_id: string | null
          city: string | null
          completed_at: string | null
          contact_phone: number | null
          created_at: string
          customer_name: string | null
          description: string
          id: string
          meta_data: Json | null
          payment_status: string
          photo_url: string | null
          price_range_max: number | null
          price_range_min: number | null
          priority: string
          rating: number | null
          review_created_at: string | null
          review_text: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          ai_paused?: boolean | null
          asset_id?: string | null
          assigned_at?: string | null
          assigned_technician_id?: string | null
          category: string
          chat_session_id?: string | null
          city?: string | null
          completed_at?: string | null
          contact_phone?: number | null
          created_at?: string
          customer_name?: string | null
          description: string
          id?: string
          meta_data?: Json | null
          payment_status?: string
          photo_url?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          priority?: string
          rating?: number | null
          review_created_at?: string | null
          review_text?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          ai_paused?: boolean | null
          asset_id?: string | null
          assigned_at?: string | null
          assigned_technician_id?: string | null
          category?: string
          chat_session_id?: string | null
          city?: string | null
          completed_at?: string | null
          contact_phone?: number | null
          created_at?: string
          customer_name?: string | null
          description?: string
          id?: string
          meta_data?: Json | null
          payment_status?: string
          photo_url?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          priority?: string
          rating?: number | null
          review_created_at?: string | null
          review_text?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "user_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_assets: {
        Row: {
          address: string
          city: string
          created_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      orphan_sessions_view: {
        Row: {
          chat_session_id: string | null
          last_message_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_technician_assignment: {
        Args: { p_technician_id: string; p_token: string }
        Returns: Json
      }
      generate_assignment_token: {
        Args: { p_expires_hours?: number; p_ticket_id: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_technician: { Args: never; Returns: boolean }
    }
    Enums: {
      recovery_status: "new" | "contacted" | "recovered" | "discarded"
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
      recovery_status: ["new", "contacted", "recovered", "discarded"],
    },
  },
} as const
