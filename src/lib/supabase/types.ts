export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string | null;
          website_url: string;
          domain: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          website_url: string;
          domain: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          website_url?: string;
          domain?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brand_extractions: {
        Row: {
          id: string;
          project_id: string;
          provider: string;
          source_url: string;
          title: string | null;
          description: string | null;
          branding: Json;
          raw_metadata: Json | null;
          captured_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          provider?: string;
          source_url: string;
          title?: string | null;
          description?: string | null;
          branding: Json;
          raw_metadata?: Json | null;
          captured_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          provider?: string;
          source_url?: string;
          title?: string | null;
          description?: string | null;
          branding?: Json;
          raw_metadata?: Json | null;
          captured_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_extractions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
