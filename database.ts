export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      actions: {
        Row: {
          caption: string | null
          category_id: string
          created_at: string
          date: string
          date_to_post: string | null
          description: string | null
          files: string[] | null
          id: string
          partner_id: string
          priority_id: string
          responsibles: string[]
          state_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          category_id: string
          created_at: string
          date: string
          date_to_post?: string | null
          description?: string | null
          files?: string[] | null
          id?: string
          partner_id: string
          priority_id: string
          responsibles: string[]
          state_id: string
          title: string
          updated_at: string
          user_id?: string
        }
        Update: {
          caption?: string | null
          category_id?: string
          created_at?: string
          date?: string
          date_to_post?: string | null
          description?: string | null
          files?: string[] | null
          id?: string
          partner_id?: string
          priority_id?: string
          responsibles?: string[]
          state_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          created_at: string
          id: string
          order: number
          role: number
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          order: number
          role?: number
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          role?: number
          slug?: string
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          area_id: string
          created_at: string
          id: string
          order: number
          shortcut: string
          slug: string
          title: string
        }
        Insert: {
          area_id: string
          created_at?: string
          id?: string
          order: number
          shortcut?: string
          slug: string
          title: string
        }
        Update: {
          area_id?: string
          created_at?: string
          id?: string
          order?: number
          shortcut?: string
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      particulars: {
        Row: {
          action_id: string | null
          created_at: string
          description: string
          id: number
        }
        Insert: {
          action_id?: string | null
          created_at?: string
          description: string
          id?: number
        }
        Update: {
          action_id?: string | null
          created_at?: string
          description?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "particulars_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "particulars_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "get_full_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          bg: string
          created_at: string
          fg: string
          id: string
          short: string
          slug: string
          title: string
          users_ids: string[] | null
        }
        Insert: {
          bg?: string
          created_at?: string
          fg?: string
          id?: string
          short: string
          slug: string
          title: string
          users_ids?: string[] | null
        }
        Update: {
          bg?: string
          created_at?: string
          fg?: string
          id?: string
          short?: string
          slug?: string
          title?: string
          users_ids?: string[] | null
        }
        Relationships: []
      }
      people: {
        Row: {
          admin: boolean
          created_at: string
          email: string | null
          id: string
          image: string | null
          initials: string | null
          name: string
          role: number
          short: string | null
          surname: string | null
          user_id: string
        }
        Insert: {
          admin?: boolean
          created_at?: string
          email?: string | null
          id?: string
          image?: string | null
          initials?: string | null
          name: string
          role?: number
          short?: string | null
          surname?: string | null
          user_id: string
        }
        Update: {
          admin?: boolean
          created_at?: string
          email?: string | null
          id?: string
          image?: string | null
          initials?: string | null
          name?: string
          role?: number
          short?: string | null
          surname?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      priorities: {
        Row: {
          created_at: string
          id: string
          order: number
          shortcut: string
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          order: number
          shortcut?: string
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          shortcut?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      states: {
        Row: {
          created_at: string
          id: string
          order: number
          shortcut: string
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          order: number
          shortcut?: string
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          shortcut?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      get_full_actions: {
        Row: {
          caption: string | null
          category: Json | null
          category_id: string | null
          created_at: string | null
          date: string | null
          date_to_post: string | null
          description: string | null
          files: string[] | null
          id: string | null
          partner: Json | null
          partner_id: string | null
          priority: Json | null
          priority_id: string | null
          responsibles: string[] | null
          slug: string | null
          state: Json | null
          state_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
