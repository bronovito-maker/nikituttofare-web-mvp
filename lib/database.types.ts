// lib/database.types.ts
// Tipi TypeScript generati per il database Supabase
// Questi tipi corrispondono alle tabelle definite in CURSOR_DATABASE.md

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // uuid
          email: string;
          full_name: string | null;
          phone: string | null;
          role: 'user' | 'admin' | 'technician';
          created_at: string; // timestamptz
        };
        Insert: {
          id: string; // uuid (references auth.users)
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: 'user' | 'admin' | 'technician';
          created_at?: string; // timestamptz
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: 'user' | 'admin' | 'technician';
          created_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string; // uuid
          user_id: string; // uuid (FK -> profiles.id)
          status: 'new' | 'pending_verification' | 'confirmed' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
          category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic';
          priority: 'low' | 'medium' | 'high' | 'emergency';
          description: string;
          address: string | null;
          payment_status: 'pending' | 'paid' | 'waived';
          created_at: string; // timestamptz
        };
        Insert: {
          id?: string; // uuid (auto-generated)
          user_id: string; // uuid
          status?: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
          category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic';
          priority?: 'low' | 'medium' | 'high' | 'emergency';
          description: string;
          address?: string | null;
          payment_status?: 'pending' | 'paid' | 'waived';
          created_at?: string; // timestamptz
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
          category?: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'generic';
          priority?: 'low' | 'medium' | 'high' | 'emergency';
          description?: string;
          address?: string | null;
          payment_status?: 'pending' | 'paid' | 'waived';
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string; // uuid
          ticket_id: string; // uuid (FK -> tickets.id)
          role: 'user' | 'assistant' | 'system';
          content: string;
          image_url: string | null;
          meta_data: Json | null;
          created_at: string; // timestamptz
        };
        Insert: {
          id?: string; // uuid (auto-generated)
          ticket_id: string; // uuid
          role: 'user' | 'assistant' | 'system';
          content: string;
          image_url?: string | null;
          meta_data?: Json | null;
          created_at?: string; // timestamptz
        };
        Update: {
          id?: string;
          ticket_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          image_url?: string | null;
          meta_data?: Json | null;
          created_at?: string;
        };
      };
      technicians: {
        Row: {
          id: string; // uuid
          created_at: string; // timestamptz
          name: string;
          phone: string;
          cities: string[] | null;
          skills: string[] | null;
          user_id: string | null; // uuid (references auth.users)
          is_active: boolean;
        };
        Insert: {
          id?: string; // uuid (auto-generated)
          created_at?: string; // timestamptz
          name: string;
          phone: string;
          cities?: string[] | null;
          skills?: string[] | null;
          user_id?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          phone?: string;
          cities?: string[] | null;
          skills?: string[] | null;
          user_id?: string | null;
          is_active?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
