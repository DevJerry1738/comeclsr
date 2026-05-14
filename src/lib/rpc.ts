import { supabase as supabaseClient } from './supabase';
const supabase = supabaseClient as any;

/**
 * Helper functions to call Supabase RPC functions with proper error handling
 */

export const rpc = {
  // Admin functions
  admin: {
    dashboardStats: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('admin_dashboard_stats');
      if (error) throw error;
      return data as any;
    },

    getUsers: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('admin_get_users', { p_limit: limit, p_offset: offset });
      if (error) throw error;
      return data;
    },

    updateUser: async (userId: string, updates: { role?: string; status?: string; kyc_status?: string; payment_status?: string }) => {
      const { data, error } = await supabase.rpc('admin_update_user', {
        p_user_id: userId,
        p_role: updates.role,
        p_status: updates.status,
        p_kyc_status: updates.kyc_status,
        p_payment_status: updates.payment_status,
      });
      if (error) throw error;
      return data;
    },

    deleteUser: async (userId: string) => {
      const { data, error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
      if (error) throw error;
      return data;
    },

    resetPassword: async (userId: string, newPassword: string) => {
      const { data, error } = await supabase.rpc('admin_reset_password', { p_user_id: userId, p_new_password: newPassword });
      if (error) throw error;
      return data;
    },

    createNotification: async (userId: string, title: string, message: string, type: string) => {
      const { data, error } = await supabase.rpc('admin_create_notification', {
        p_user_id: userId,
        p_title: title,
        p_message: message,
        p_type: type,
      });
      if (error) throw error;
      return data;
    },

    getUserRequests: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('admin_get_user_requests', { p_limit: limit, p_offset: offset });
      if (error) throw error;
      return data;
    },

    updateRequestStatus: async (requestId: number, status: string) => {
      const { data, error } = await supabase.rpc('admin_update_request_status', { p_request_id: requestId, p_status: status });
      if (error) throw error;
      return data;
    },
  },

  // Agent functions
  agent: {
    list: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('agent_list', { p_limit: limit, p_offset: offset });
      if (error) throw error;
      return data;
    },

    create: async (userId: string, username: string, displayName: string, bio?: string, profilePhoto?: string) => {
      const { data, error } = await supabase.rpc('agent_create', {
        p_user_id: userId,
        p_username: username,
        p_display_name: displayName,
        p_bio: bio,
        p_profile_photo: profilePhoto,
      });
      if (error) throw error;
      return data;
    },

    assignToUser: async (agentId: number, userId: string) => {
      const { data, error } = await supabase.rpc('agent_assign_to_user', { p_agent_id: agentId, p_user_id: userId });
      if (error) throw error;
      return data;
    },

    approveConversation: async (conversationId: number) => {
      const { data, error } = await supabase.rpc('agent_approve_conversation', { p_conversation_id: conversationId });
      if (error) throw error;
      return data;
    },

    stopConversation: async (conversationId: number) => {
      const { data, error } = await supabase.rpc('agent_stop_conversation', { p_conversation_id: conversationId });
      if (error) throw error;
      return data;
    },

    setWelcomeMessage: async (agentId: number, message: string) => {
      const { data, error } = await supabase.rpc('agent_set_welcome_message', { p_agent_id: agentId, p_message: message });
      if (error) throw error;
      return data;
    },

    getWelcomeMessages: async () => {
      const { data, error } = await supabase.rpc('agent_get_welcome_messages');
      if (error) throw error;
      return data;
    },

    createAccount: async (fullName: string, email: string): Promise<any> => {
      try {
        const { data, error } = await supabase.rpc('agent_create_account', {
          p_full_name: fullName,
          p_email: email,
        });
        if (error) {
          console.error('RPC error details:', error);
          throw new Error(error.message || 'Failed to create agent account');
        }
        return data as any;
      } catch (err: any) {
        console.error('Agent creation error:', err.message, err);
        throw err;
      }
    },

    getAssignedUsers: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('agent_get_assigned_users');
      if (error) throw error;
      return data as any;
    },

    deleteAgent: async (agentId: string): Promise<any> => {
      const { data, error } = await supabase.rpc('admin_delete_user', { p_user_id: agentId });
      if (error) throw error;
      return data as any;
    },

    updateAgent: async (agentId: string, updates: { full_name?: string; status?: string }): Promise<any> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...(updates.full_name && { full_name: updates.full_name }),
          ...(updates.status && { status: updates.status }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentId)
        .select();
      if (error) throw error;
      return data;
    },

    seedAuthUsers: async (): Promise<any> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        'https://uyuecdtiupucoixnpwbz.supabase.co/functions/v1/seed-agent-auth',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to seed agent auth users: ${response.status}`);
      }

      return await response.json();
    },
  },

  // Conversation functions
  conversation: {
    myConversations: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('conversation_my_conversations', { p_limit: limit, p_offset: offset });
      if (error) throw error;
      return data;
    },

    allConversations: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('conversation_all_conversations', { p_limit: limit, p_offset: offset });
      if (error) throw error;
      return data;
    },

    getMessages: async (conversationId: number) => {
      const { data, error } = await supabase.rpc('conversation_get_messages', { p_conversation_id: conversationId });
      if (error) throw error;
      return data;
    },

    sendMessage: async (conversationId: number, content?: string, messageType = 'media', mediaUrl?: string, duration?: number) => {
      const { data, error } = await supabase.rpc('conversation_send_message', {
        p_conversation_id: conversationId,
        p_content: content,
        p_message_type: messageType,
        p_media_url: mediaUrl,
        p_duration: duration,
      });
      if (error) throw error;
      return data;
    },

    markRead: async (conversationId: number) => {
      const { data, error } = await supabase.rpc('conversation_mark_read', { p_conversation_id: conversationId });
      if (error) throw error;
      return data;
    },
  },

  // Ticket functions
  ticket: {
    myTickets: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('ticket_my_tickets', { p_limit: limit, p_offset: offset });
      if (error) throw error;
      return data;
    },

    allTickets: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('ticket_all_tickets', { p_limit: limit, p_offset: offset });
      if (error) throw error;
      return data;
    },

    create: async (subject: string, description?: string, category = 'general', priority = 'medium') => {
      const { data, error } = await supabase.rpc('ticket_create', {
        p_subject: subject,
        p_description: description,
        p_category: category,
        p_priority: priority,
      });
      if (error) throw error;
      return data;
    },

    reply: async (ticketId: number, replyText: string) => {
      const { data, error } = await supabase.rpc('ticket_reply', { p_ticket_id: ticketId, p_reply_text: replyText });
      if (error) throw error;
      return data;
    },

    updateStatus: async (ticketId: number, status: string) => {
      const { data, error } = await supabase.rpc('ticket_update_status', { p_ticket_id: ticketId, p_status: status });
      if (error) throw error;
      return data;
    },
  },

  // Settings functions
  settings: {
    getAll: async () => {
      const { data, error } = await supabase.rpc('settings_get_all');
      if (error) throw error;
      return data;
    },

    update: async (key: string, value: string, category = 'general') => {
      const { data, error } = await supabase.rpc('settings_update', { p_key: key, p_value: value, p_category: category });
      if (error) throw error;
      return data;
    },
  },

  // Payment functions
  payment: {
    getCurrentPlan: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('subscription_get_current_plan');
      if (error) throw error;
      return data as any;
    },

    getUserStatus: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('subscription_get_user_status');
      if (error) throw error;
      return data as any;
    },

    createRequest: async (planId: string, paymentMethod: string): Promise<any> => {
      const { data, error } = await supabase.rpc('payment_create_request', {
        p_plan_id: planId,
        p_payment_method: paymentMethod,
      });
      if (error) throw error;
      return data as any;
    },

    getPending: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('payment_get_pending', {});
      if (error) throw error;
      return data as any;
    },

    confirmAndAssign: async (paymentRequestId: string, agentId: string, adminNotes?: string): Promise<any> => {
      const { data, error } = await supabase.rpc('payment_confirm_and_assign', {
        p_payment_request_id: paymentRequestId,
        p_agent_id: agentId,
        p_admin_notes: adminNotes,
      });
      if (error) throw error;
      return data as any;
    },

    getAll: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('payment_get_all', { p_limit: limit, p_offset: offset });
      if (error) throw error;
      return data;
    },

    updateStatus: async (paymentId: number, status: string, adminNotes?: string) => {
      const { data, error } = await supabase.rpc('payment_update_status', { p_payment_id: paymentId, p_status: status, p_admin_notes: adminNotes });
      if (error) throw error;
      return data;
    },
  },

  // KYC functions
  kyc: {
    getAll: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('kyc_get_all', { p_limit: limit, p_offset: offset });
      if (error) throw error;
      return data;
    },

    updateStatus: async (kycId: number, status: string, adminNotes?: string) => {
      const { data, error } = await supabase.rpc('kyc_update_status', { p_kyc_id: kycId, p_status: status, p_admin_notes: adminNotes });
      if (error) throw error;
      return data;
    },
  },
};
