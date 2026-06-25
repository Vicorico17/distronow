export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          website_url: string;
          domain: string;
          language: string | null;
          tone: string | null;
          audience: string | null;
          brand_name: string | null;
          brand_description: string | null;
          brand_colors: Json;
          brand_fonts: Json;
          brand_logo: string | null;
          brand_fields_status: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          website_url: string;
          domain: string;
          language?: string | null;
          tone?: string | null;
          audience?: string | null;
          brand_name?: string | null;
          brand_description?: string | null;
          brand_colors?: Json;
          brand_fonts?: Json;
          brand_logo?: string | null;
          brand_fields_status?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          website_url?: string;
          domain?: string;
          language?: string | null;
          tone?: string | null;
          audience?: string | null;
          brand_name?: string | null;
          brand_description?: string | null;
          brand_colors?: Json;
          brand_fonts?: Json;
          brand_logo?: string | null;
          brand_fields_status?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brand_extractions: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          provider: string;
          source_url: string;
          title: string | null;
          description: string | null;
          language: string | null;
          branding: Json;
          raw_metadata: Json | null;
          captured_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          provider?: string;
          source_url: string;
          title?: string | null;
          description?: string | null;
          language?: string | null;
          branding: Json;
          raw_metadata?: Json | null;
          captured_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string | null;
          provider?: string;
          source_url?: string;
          title?: string | null;
          description?: string | null;
          language?: string | null;
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
      post_drafts: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          brand_extraction_id: string | null;
          channel: string;
          intent: string;
          headline: string;
          body: string;
          cta: string | null;
          hashtags: string[];
          status: string;
          language: string | null;
          tone: string | null;
          length: string | null;
          provider: string;
          model: string | null;
          prompt_version: string | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          brand_extraction_id?: string | null;
          channel: string;
          intent: string;
          headline: string;
          body: string;
          cta?: string | null;
          hashtags?: string[];
          status?: string;
          language?: string | null;
          tone?: string | null;
          length?: string | null;
          provider?: string;
          model?: string | null;
          prompt_version?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string | null;
          brand_extraction_id?: string | null;
          channel?: string;
          intent?: string;
          headline?: string;
          body?: string;
          cta?: string | null;
          hashtags?: string[];
          status?: string;
          language?: string | null;
          tone?: string | null;
          length?: string | null;
          provider?: string;
          model?: string | null;
          prompt_version?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_drafts_brand_extraction_id_fkey";
            columns: ["brand_extraction_id"];
            isOneToOne: false;
            referencedRelation: "brand_extractions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_drafts_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      brand_audiences: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          name: string;
          summary: string;
          pain_points: string[];
          goals: string[];
          buying_triggers: string[];
          objections: string[];
          channels: string[];
          content_angles: string[];
          is_primary: boolean;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          name: string;
          summary: string;
          pain_points?: string[];
          goals?: string[];
          buying_triggers?: string[];
          objections?: string[];
          channels?: string[];
          content_angles?: string[];
          is_primary?: boolean;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string | null;
          name?: string;
          summary?: string;
          pain_points?: string[];
          goals?: string[];
          buying_triggers?: string[];
          objections?: string[];
          channels?: string[];
          content_angles?: string[];
          is_primary?: boolean;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_audiences_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      marketing_assets: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          brand_extraction_id: string | null;
          audience_id: string | null;
          asset_type: string;
          title: string;
          brief: string | null;
          prompt: string | null;
          content: Json;
          image_url: string | null;
          storage_path: string | null;
          provider: string;
          model: string | null;
          status: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          brand_extraction_id?: string | null;
          audience_id?: string | null;
          asset_type: string;
          title: string;
          brief?: string | null;
          prompt?: string | null;
          content?: Json;
          image_url?: string | null;
          storage_path?: string | null;
          provider?: string;
          model?: string | null;
          status?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string | null;
          brand_extraction_id?: string | null;
          audience_id?: string | null;
          asset_type?: string;
          title?: string;
          brief?: string | null;
          prompt?: string | null;
          content?: Json;
          image_url?: string | null;
          storage_path?: string | null;
          provider?: string;
          model?: string | null;
          status?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_assets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_assets_brand_extraction_id_fkey";
            columns: ["brand_extraction_id"];
            isOneToOne: false;
            referencedRelation: "brand_extractions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_assets_audience_id_fkey";
            columns: ["audience_id"];
            isOneToOne: false;
            referencedRelation: "brand_audiences";
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
