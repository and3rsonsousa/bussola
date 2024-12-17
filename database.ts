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
          archived: boolean | null
          caption: string | null
          category: string
          color: string
          created_at: string
          date: string
          description: string | null
          files: string[] | null
          id: string
          instagram_date: string
          partners: string[]
          priority: string
          responsibles: string[]
          state: string
          time: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          caption?: string | null
          category: string
          color?: string
          created_at: string
          date: string
          description?: string | null
          files?: string[] | null
          id?: string
          instagram_date: string
          partners: string[]
          priority: string
          responsibles: string[]
          state: string
          time?: number
          title: string
          updated_at: string
          user_id?: string
        }
        Update: {
          archived?: boolean | null
          caption?: string | null
          category?: string
          color?: string
          created_at?: string
          date?: string
          description?: string | null
          files?: string[] | null
          id?: string
          instagram_date?: string
          partners?: string[]
          priority?: string
          responsibles?: string[]
          state?: string
          time?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          area: string
          color: string
          created_at: string
          id: string
          order: number
          shortcut: string
          slug: string
          title: string
        }
        Insert: {
          area: string
          color?: string
          created_at?: string
          id?: string
          order: number
          shortcut?: string
          slug: string
          title: string
        }
        Update: {
          area?: string
          color?: string
          created_at?: string
          id?: string
          order?: number
          shortcut?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      celebrations: {
        Row: {
          created_at: string
          date: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          account: string | null
          adm: string | null
          created_at: string
          creative: string | null
          id: number
        }
        Insert: {
          account?: string | null
          adm?: string | null
          created_at?: string
          creative?: string | null
          id?: number
        }
        Update: {
          account?: string | null
          adm?: string | null
          created_at?: string
          creative?: string | null
          id?: number
        }
        Relationships: []
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
        ]
      }
      partners: {
        Row: {
          archived: boolean
          colors: string[]
          context: string | null
          created_at: string
          id: string
          img: string | null
          short: string
          slug: string
          sow: Database["public"]["Enums"]["sow"]
          title: string
          users_ids: string[]
          voice: number[] | null
        }
        Insert: {
          archived?: boolean
          colors: string[]
          context?: string | null
          created_at?: string
          id?: string
          img?: string | null
          short: string
          slug: string
          sow?: Database["public"]["Enums"]["sow"]
          title: string
          users_ids: string[]
          voice?: number[] | null
        }
        Update: {
          archived?: boolean
          colors?: string[]
          context?: string | null
          created_at?: string
          id?: string
          img?: string | null
          short?: string
          slug?: string
          sow?: Database["public"]["Enums"]["sow"]
          title?: string
          users_ids?: string[]
          voice?: number[] | null
        }
        Relationships: []
      }
      people: {
        Row: {
          admin: boolean
          areas: string[]
          created_at: string
          email: string | null
          id: string
          image: string | null
          initials: string
          name: string
          role: number
          short: string
          surname: string
          user_id: string
        }
        Insert: {
          admin?: boolean
          areas: string[]
          created_at?: string
          email?: string | null
          id?: string
          image?: string | null
          initials: string
          name: string
          role?: number
          short: string
          surname: string
          user_id: string
        }
        Update: {
          admin?: boolean
          areas?: string[]
          created_at?: string
          email?: string | null
          id?: string
          image?: string | null
          initials?: string
          name?: string
          role?: number
          short?: string
          surname?: string
          user_id?: string
        }
        Relationships: []
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
      sprints: {
        Row: {
          action_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          color: string
          created_at: string
          id: string
          order: number
          shortcut: string
          slug: string
          title: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          order: number
          shortcut?: string
          slug: string
          title: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          order?: number
          shortcut?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      voices: {
        Row: {
          created_at: string
          description: string
          id: number
          n1: string
          n2: string
          n3: string
          name: string
          p1: string
          p2: string
          p3: string
          priority: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: number
          n1: string
          n2: string
          n3: string
          name: string
          p1: string
          p2: string
          p3: string
          priority: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: number
          n1?: string
          n2?: string
          n3?: string
          name?: string
          p1?: string
          p2?: string
          p3?: string
          priority?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      sow: "marketing" | "socialmedia" | "demand"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
