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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_entries: {
        Row: {
          amount: number
          created_at: string
          driver_name: string | null
          entry_date: string
          from_km: number
          id: string
          particular: string | null
          place: string | null
          to_km: number
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          driver_name?: string | null
          entry_date?: string
          from_km?: number
          id?: string
          particular?: string | null
          place?: string | null
          to_km?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          driver_name?: string | null
          entry_date?: string
          from_km?: number
          id?: string
          particular?: string | null
          place?: string | null
          to_km?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      teeth_fitment: {
        Row: {
          created_at: string
          entry_date: string
          hours: number
          id: string
          incharge_name: string | null
          km: number
          new_teeth_qty: number
          old_teeth_status: string | null
          operator_name: string | null
          place: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          entry_date?: string
          hours?: number
          id?: string
          incharge_name?: string | null
          km?: number
          new_teeth_qty?: number
          old_teeth_status?: string | null
          operator_name?: string | null
          place?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          entry_date?: string
          hours?: number
          id?: string
          incharge_name?: string | null
          km?: number
          new_teeth_qty?: number
          old_teeth_status?: string | null
          operator_name?: string | null
          place?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teeth_fitment_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      teeth_purchase: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          lock_pin: number
          purchase_shop: string | null
          qty: number
          rock_teeth: number
          storage_place: string | null
          teeth_model: string | null
          updated_at: string
          washer: number
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          lock_pin?: number
          purchase_shop?: string | null
          qty?: number
          rock_teeth?: number
          storage_place?: string | null
          teeth_model?: string | null
          updated_at?: string
          washer?: number
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          lock_pin?: number
          purchase_shop?: string | null
          qty?: number
          rock_teeth?: number
          storage_place?: string | null
          teeth_model?: string | null
          updated_at?: string
          washer?: number
        }
        Relationships: []
      }
      tyre_fitment: {
        Row: {
          brand: string | null
          created_at: string
          driver_name: string | null
          entry_date: string
          id: string
          km: number
          old_tyre_status: string
          old_tyre_stock: string | null
          remarks: string | null
          tyre_no: string | null
          tyre_place: string | null
          tyre_size: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          driver_name?: string | null
          entry_date?: string
          id?: string
          km?: number
          old_tyre_status?: string
          old_tyre_stock?: string | null
          remarks?: string | null
          tyre_no?: string | null
          tyre_place?: string | null
          tyre_size?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          driver_name?: string | null
          entry_date?: string
          id?: string
          km?: number
          old_tyre_status?: string
          old_tyre_stock?: string | null
          remarks?: string | null
          tyre_no?: string | null
          tyre_place?: string | null
          tyre_size?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tyre_fitment_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      tyre_inventory: {
        Row: {
          brand: string | null
          created_at: string
          entry_date: string
          entry_type: string
          id: string
          quantity: number
          tyre_no: string | null
          tyre_size: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          entry_date?: string
          entry_type?: string
          id?: string
          quantity?: number
          tyre_no?: string | null
          tyre_size?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          entry_date?: string
          entry_type?: string
          id?: string
          quantity?: number
          tyre_no?: string | null
          tyre_size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tyre_events: {
        Row: {
          cost: number
          created_at: string
          event_date: string
          event_type: string
          id: string
          km_reading: number
          note: string | null
          tyre_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          event_date?: string
          event_type: string
          id?: string
          km_reading?: number
          note?: string | null
          tyre_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          event_date?: string
          event_type?: string
          id?: string
          km_reading?: number
          note?: string | null
          tyre_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tyre_events_tyre_id_fkey"
            columns: ["tyre_id"]
            isOneToOne: false
            referencedRelation: "tyres"
            referencedColumns: ["id"]
          },
        ]
      }
      tyre_audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tyre_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tyres: {
        Row: {
          axle_label: string | null
          brand: string | null
          cost: number
          created_at: string
          current_km: number
          fitted_km: number
          fitted_on: string | null
          id: string
          position_code: string
          remark: string | null
          serial_no: string | null
          status: string
          tyre_type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          axle_label?: string | null
          brand?: string | null
          cost?: number
          created_at?: string
          current_km?: number
          fitted_km?: number
          fitted_on?: string | null
          id?: string
          position_code: string
          remark?: string | null
          serial_no?: string | null
          status?: string
          tyre_type?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          axle_label?: string | null
          brand?: string | null
          cost?: number
          created_at?: string
          current_km?: number
          fitted_km?: number
          fitted_on?: string | null
          id?: string
          position_code?: string
          remark?: string | null
          serial_no?: string | null
          status?: string
          tyre_type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tyres_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          odometer: number
          updated_at: string
          vehicle_number: string
          wheels: number
        }
        Insert: {
          created_at?: string
          id?: string
          odometer?: number
          updated_at?: string
          vehicle_number: string
          wheels?: number
        }
        Update: {
          created_at?: string
          id?: string
          odometer?: number
          updated_at?: string
          vehicle_number?: string
          wheels?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
