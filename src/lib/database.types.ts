// Tipos generados manualmente para el proyecto IEP Jesús de Nazaret
// Ejecutar: npx supabase gen types typescript --project-id <id> para regenerar

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: 'admin' | 'editor' | 'viewer';
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      settings: {
        Row: {
          id: number;
          school_name: string;
          slogan: string | null;
          history: string | null;
          mission: string | null;
          vision: string | null;
          values_text: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          whatsapp: string | null;
          facebook: string | null;
          instagram: string | null;
          youtube: string | null;
          logo_url: string | null;
          hero_image_url: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
      };
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          type: 'blog' | 'news' | 'document';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      blogs: {
        Row: {
          id: number;
          title: string;
          slug: string;
          summary: string | null;
          content: string | null;
          image_url: string | null;
          category_id: number | null;
          author_id: string | null;
          status: 'draft' | 'published';
          seo_title: string | null;
          seo_description: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['blogs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['blogs']['Insert']>;
      };
      news: {
        Row: {
          id: number;
          title: string;
          slug: string;
          summary: string | null;
          content: string | null;
          image_url: string | null;
          type: string | null;
          featured: boolean;
          seo_title: string | null;
          seo_description: string | null;
          published_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['news']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['news']['Insert']>;
      };
      galleries: {
        Row: {
          id: number;
          title: string;
          slug: string;
          description: string | null;
          cover_image_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['galleries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['galleries']['Insert']>;
      };
      photos: {
        Row: {
          id: number;
          gallery_id: number;
          image_url: string;
          title: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['photos']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['photos']['Insert']>;
      };
      events: {
        Row: {
          id: number;
          title: string;
          slug: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          location: string | null;
          image_url: string | null;
          status: 'upcoming' | 'past' | 'cancelled';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      documents: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          file_url: string;
          type: string | null;
          published_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      messages: {
        Row: {
          id: number;
          name: string;
          email: string;
          phone: string | null;
          subject: string | null;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at' | 'is_read'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      ai_suggestions: {
        Row: {
          id: number;
          user_id: string | null;
          module: string;
          prompt: string;
          result: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_suggestions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ai_suggestions']['Insert']>;
      };
    };
  };
}
