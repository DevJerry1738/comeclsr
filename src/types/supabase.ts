export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          email: string;
          phone: string | null;
          gender: 'male' | 'female' | 'other' | null;
          age: number | null;
          location: string | null;
          profile_photo: string | null;
          interests: string | null;
          bio: string | null;
          role: 'user' | 'admin' | 'agent';
          status: 'active' | 'suspended' | 'blocked' | 'pending';
          payment_status: 'pending' | 'approved' | 'rejected';
          kyc_status: 'pending' | 'submitted' | 'approved' | 'rejected';
          conversation_status: 'pending' | 'assigned' | 'active' | 'stopped';
          assigned_agent_id: number | null;
          avatar: string | null;
          created_at: string;
          updated_at: string;
          last_sign_in_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at' | 'last_sign_in_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      agents: {
        Row: {
          id: number;
          user_id: string;
          username: string;
          display_name: string;
          profile_photo: string | null;
          bio: string | null;
          status: 'active' | 'inactive' | 'suspended';
          assigned_user_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['agents']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['agents']['Insert']>;
      };
      conversations: {
        Row: {
          id: number;
          user_id: string;
          agent_id: number;
          status: 'pending' | 'active' | 'stopped' | 'closed';
          admin_approved: boolean;
          welcome_message_sent: boolean;
          last_message_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: number;
          conversation_id: number;
          sender_id: string;
          sender_role: 'user' | 'agent' | 'admin';
          type: 'media' | 'voice';
          content: string | null;
          media_url: string | null;
          duration: number | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      payments: {
        Row: {
          id: number;
          user_id: string;
          amount: string;
          method: string;
          status: 'pending' | 'approved' | 'rejected';
          proof_image: string | null;
          transaction_ref: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      kyc_submissions: {
        Row: {
          id: number;
          user_id: string;
          people_type: string | null;
          conversation_type: string | null;
          personality_prefs: string | null;
          expectations: string | null;
          id_document: string | null;
          selfie_photo: string | null;
          status: 'pending' | 'approved' | 'rejected';
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kyc_submissions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['kyc_submissions']['Insert']>;
      };
      tickets: {
        Row: {
          id: number;
          user_id: string;
          subject: string;
          category: 'general' | 'payment' | 'agent' | 'technical' | 'other';
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          priority: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>;
      };
      ticket_replies: {
        Row: {
          id: number;
          ticket_id: number;
          sender_id: string;
          sender_role: 'user' | 'admin';
          message: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ticket_replies']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ticket_replies']['Insert']>;
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          type: 'payment' | 'kyc' | 'agent' | 'conversation' | 'ticket' | 'system';
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      user_requests: {
        Row: {
          id: number;
          user_id: string;
          type: 'agent_change' | 'report_inactivity' | 'other';
          message: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_requests']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_requests']['Insert']>;
      };
      settings: {
        Row: {
          id: number;
          key: string;
          value: string | null;
          category: 'general' | 'payment' | 'email' | 'homepage' | 'popup';
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
