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
      artikel: {
        Row: {
          abschlusstext: string | null
          beschreibung: string | null
          created_at: string
          details: string | null
          ebay_angebot_id: string | null
          ebay_kategorie_id: string | null
          ebay_url: string | null
          erkannte_daten: Json
          fehlende_angaben: string[]
          id: string
          ist_neu: boolean
          kategorie: string | null
          maengel: string | null
          marke: string | null
          marktanalyse: Json
          modell: string | null
          notizen: string | null
          originalverpackung: boolean
          preis_begruendung: string | null
          preis_empfehlung: number | null
          preis_erklaerungen: Json
          preis_maximum: number | null
          preis_schnell: number | null
          preis_start: number | null
          preis_vertrauen: string | null
          status: Database["public"]["Enums"]["artikel_status"]
          suchbegriffe: string[]
          technische_daten: Json
          titel: string | null
          updated_at: string
          user_id: string
          verkaufsgeschwindigkeit: string | null
          veroeffentlicht_am: string | null
          versandempfehlung: string | null
          zubehoer: string | null
          zustand: Database["public"]["Enums"]["artikel_zustand"] | null
          zustandsbeschreibung: string | null
        }
        Insert: {
          abschlusstext?: string | null
          beschreibung?: string | null
          created_at?: string
          details?: string | null
          ebay_angebot_id?: string | null
          ebay_kategorie_id?: string | null
          ebay_url?: string | null
          erkannte_daten?: Json
          fehlende_angaben?: string[]
          id?: string
          ist_neu?: boolean
          kategorie?: string | null
          maengel?: string | null
          marke?: string | null
          marktanalyse?: Json
          modell?: string | null
          notizen?: string | null
          originalverpackung?: boolean
          preis_begruendung?: string | null
          preis_empfehlung?: number | null
          preis_erklaerungen?: Json
          preis_maximum?: number | null
          preis_schnell?: number | null
          preis_start?: number | null
          preis_vertrauen?: string | null
          status?: Database["public"]["Enums"]["artikel_status"]
          suchbegriffe?: string[]
          technische_daten?: Json
          titel?: string | null
          updated_at?: string
          user_id: string
          verkaufsgeschwindigkeit?: string | null
          veroeffentlicht_am?: string | null
          versandempfehlung?: string | null
          zubehoer?: string | null
          zustand?: Database["public"]["Enums"]["artikel_zustand"] | null
          zustandsbeschreibung?: string | null
        }
        Update: {
          abschlusstext?: string | null
          beschreibung?: string | null
          created_at?: string
          details?: string | null
          ebay_angebot_id?: string | null
          ebay_kategorie_id?: string | null
          ebay_url?: string | null
          erkannte_daten?: Json
          fehlende_angaben?: string[]
          id?: string
          ist_neu?: boolean
          kategorie?: string | null
          maengel?: string | null
          marke?: string | null
          marktanalyse?: Json
          modell?: string | null
          notizen?: string | null
          originalverpackung?: boolean
          preis_begruendung?: string | null
          preis_empfehlung?: number | null
          preis_erklaerungen?: Json
          preis_maximum?: number | null
          preis_schnell?: number | null
          preis_start?: number | null
          preis_vertrauen?: string | null
          status?: Database["public"]["Enums"]["artikel_status"]
          suchbegriffe?: string[]
          technische_daten?: Json
          titel?: string | null
          updated_at?: string
          user_id?: string
          verkaufsgeschwindigkeit?: string | null
          veroeffentlicht_am?: string | null
          versandempfehlung?: string | null
          zubehoer?: string | null
          zustand?: Database["public"]["Enums"]["artikel_zustand"] | null
          zustandsbeschreibung?: string | null
        }
        Relationships: []
      }
      artikel_bilder: {
        Row: {
          artikel_id: string
          created_at: string
          id: string
          optimierung: Json
          pfad: string
          pfad_original: string | null
          reihenfolge: number
          typ: string
          user_id: string
        }
        Insert: {
          artikel_id: string
          created_at?: string
          id?: string
          optimierung?: Json
          pfad: string
          pfad_original?: string | null
          reihenfolge?: number
          typ?: string
          user_id: string
        }
        Update: {
          artikel_id?: string
          created_at?: string
          id?: string
          optimierung?: Json
          pfad?: string
          pfad_original?: string | null
          reihenfolge?: number
          typ?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artikel_bilder_artikel_id_fkey"
            columns: ["artikel_id"]
            isOneToOne: false
            referencedRelation: "artikel"
            referencedColumns: ["id"]
          },
        ]
      }
      artikel_feedback: {
        Row: {
          artikel_id: string
          created_at: string
          feedback: string
          id: string
          user_id: string
        }
        Insert: {
          artikel_id: string
          created_at?: string
          feedback: string
          id?: string
          user_id: string
        }
        Update: {
          artikel_id?: string
          created_at?: string
          feedback?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artikel_feedback_artikel_id_fkey"
            columns: ["artikel_id"]
            isOneToOne: false
            referencedRelation: "artikel"
            referencedColumns: ["id"]
          },
        ]
      }
      artikel_veroeffentlichungen: {
        Row: {
          artikel_id: string
          created_at: string
          externe_id: string | null
          fehler: string | null
          id: string
          marktplatz: string
          plattform_daten: Json
          status: string
          updated_at: string
          url: string | null
          user_id: string
          veroeffentlicht_am: string | null
        }
        Insert: {
          artikel_id: string
          created_at?: string
          externe_id?: string | null
          fehler?: string | null
          id?: string
          marktplatz: string
          plattform_daten?: Json
          status?: string
          updated_at?: string
          url?: string | null
          user_id: string
          veroeffentlicht_am?: string | null
        }
        Update: {
          artikel_id?: string
          created_at?: string
          externe_id?: string | null
          fehler?: string | null
          id?: string
          marktplatz?: string
          plattform_daten?: Json
          status?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          veroeffentlicht_am?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artikel_veroeffentlichungen_artikel_id_fkey"
            columns: ["artikel_id"]
            isOneToOne: false
            referencedRelation: "artikel"
            referencedColumns: ["id"]
          },
        ]
      }
      ki_regeln: {
        Row: {
          aktiv: boolean
          bereich: string
          created_at: string
          id: string
          regel: string
          user_id: string
        }
        Insert: {
          aktiv?: boolean
          bereich?: string
          created_at?: string
          id?: string
          regel: string
          user_id: string
        }
        Update: {
          aktiv?: boolean
          bereich?: string
          created_at?: string
          id?: string
          regel?: string
          user_id?: string
        }
        Relationships: []
      }
      kontakt_nachrichten: {
        Row: {
          betreff: string
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          nachricht: string
          name: string
          user_agent: string | null
        }
        Insert: {
          betreff: string
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          nachricht: string
          name: string
          user_agent?: string | null
        }
        Update: {
          betreff?: string
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          nachricht?: string
          name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      marktplatz_verbindungen: {
        Row: {
          access_token: string | null
          aktiv: boolean
          created_at: string
          gueltig_bis: string | null
          id: string
          konto_name: string | null
          marktplatz: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          aktiv?: boolean
          created_at?: string
          gueltig_bis?: string | null
          id?: string
          konto_name?: string | null
          marktplatz: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          aktiv?: boolean
          created_at?: string
          gueltig_bis?: string | null
          id?: string
          konto_name?: string | null
          marktplatz?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutzung_ereignisse: {
        Row: {
          art: string
          artikel_id: string | null
          created_at: string
          details: Json
          id: string
          menge: number
          user_id: string
        }
        Insert: {
          art: string
          artikel_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          menge?: number
          user_id: string
        }
        Update: {
          art?: string
          artikel_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          menge?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutzung_ereignisse_artikel_id_fkey"
            columns: ["artikel_id"]
            isOneToOne: false
            referencedRelation: "artikel"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          abschlusstext: string | null
          anzeigename: string | null
          created_at: string
          firmenname: string | null
          id: string
          land: string
          standard_versand: string | null
          tarif: string
          updated_at: string
          verkaeufer_status: Database["public"]["Enums"]["verkaeufer_status"]
        }
        Insert: {
          abschlusstext?: string | null
          anzeigename?: string | null
          created_at?: string
          firmenname?: string | null
          id: string
          land?: string
          standard_versand?: string | null
          tarif?: string
          updated_at?: string
          verkaeufer_status?: Database["public"]["Enums"]["verkaeufer_status"]
        }
        Update: {
          abschlusstext?: string | null
          anzeigename?: string | null
          created_at?: string
          firmenname?: string | null
          id?: string
          land?: string
          standard_versand?: string | null
          tarif?: string
          updated_at?: string
          verkaeufer_status?: Database["public"]["Enums"]["verkaeufer_status"]
        }
        Relationships: []
      }
      uebergabe_token: {
        Row: {
          artikel_id: string
          created_at: string
          gueltig_bis: string
          id: string
          marktplatz: string
          token: string
          user_id: string
          verwendet_am: string | null
          widerrufen: boolean
        }
        Insert: {
          artikel_id: string
          created_at?: string
          gueltig_bis: string
          id?: string
          marktplatz: string
          token: string
          user_id: string
          verwendet_am?: string | null
          widerrufen?: boolean
        }
        Update: {
          artikel_id?: string
          created_at?: string
          gueltig_bis?: string
          id?: string
          marktplatz?: string
          token?: string
          user_id?: string
          verwendet_am?: string | null
          widerrufen?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "uebergabe_token_artikel_id_fkey"
            columns: ["artikel_id"]
            isOneToOne: false
            referencedRelation: "artikel"
            referencedColumns: ["id"]
          },
        ]
      }
      verkaufsverlauf: {
        Row: {
          anfragen: number
          artikel_id: string | null
          created_at: string
          einschaetzung: string | null
          id: string
          notiz: string | null
          preis_gesenkt: boolean
          tage_bis_verkauf: number | null
          user_id: string
          verkaufspreis: number | null
        }
        Insert: {
          anfragen?: number
          artikel_id?: string | null
          created_at?: string
          einschaetzung?: string | null
          id?: string
          notiz?: string | null
          preis_gesenkt?: boolean
          tage_bis_verkauf?: number | null
          user_id: string
          verkaufspreis?: number | null
        }
        Update: {
          anfragen?: number
          artikel_id?: string | null
          created_at?: string
          einschaetzung?: string | null
          id?: string
          notiz?: string | null
          preis_gesenkt?: boolean
          tage_bis_verkauf?: number | null
          user_id?: string
          verkaufspreis?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "verkaufsverlauf_artikel_id_fkey"
            columns: ["artikel_id"]
            isOneToOne: false
            referencedRelation: "artikel"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nutzung_anzahl: {
        Args: { _art: string; _user_id: string }
        Returns: number
      }
    }
    Enums: {
      artikel_status: "entwurf" | "analysiert" | "veroeffentlicht" | "verkauft"
      artikel_zustand:
        | "neu"
        | "neu_sonstige"
        | "wie_neu"
        | "sehr_gut"
        | "gut"
        | "akzeptabel"
        | "defekt"
      verkaeufer_status: "privat" | "kleinunternehmer" | "gewerblich"
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
      artikel_status: ["entwurf", "analysiert", "veroeffentlicht", "verkauft"],
      artikel_zustand: [
        "neu",
        "neu_sonstige",
        "wie_neu",
        "sehr_gut",
        "gut",
        "akzeptabel",
        "defekt",
      ],
      verkaeufer_status: ["privat", "kleinunternehmer", "gewerblich"],
    },
  },
} as const
