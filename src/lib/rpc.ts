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
      if (error) {
        console.error('RPC Error - agent_get_assigned_users:', error.message, error.details, error.code);
        throw new Error(`Failed to load assigned users: ${error.message}`);
      }
      return data as any;
    },

    getSelf: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('agent_get_self');
      if (error) {
        console.error('RPC Error - agent_get_self:', error.message, error.details, error.code);
        throw new Error(`Failed to load agent record: ${error.message}`);
      }
      return data?.[0];
    },

    deleteAgent: async (agentId: string): Promise<any> => {
      const { data, error } = await supabase.rpc('admin_delete_user', { p_user_id: agentId });
      if (error) throw error;
      return data as any;
    },

    updateAgent: async (agentId: string, updates: { full_name?: string; status?: string; profile_photo?: string; location_time_difference_hours?: number | null }): Promise<any> => {
      const { data, error } = await supabase.rpc('update_agent_profile', {
        p_agent_id: agentId,
        p_full_name: updates.full_name || null,
        p_profile_photo: updates.profile_photo || null,
        p_status: updates.status || null,
        p_location_time_difference_hours: updates.location_time_difference_hours ?? null,
      });
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

    getConversationWithUser: async (userId: string): Promise<any> => {
      const { data, error } = await supabase.rpc('agent_get_conversation_with_user', { p_user_id: userId });
      if (error) {
        console.error('RPC Error - agent_get_conversation_with_user:', error.message, error.details, error.code);
        throw new Error(`Failed to load conversation: ${error.message}`);
      }
      return data;
    },

    getUserNotes: async (userId: string): Promise<any> => {
      const { data, error } = await supabase.rpc('agent_get_user_notes', { p_user_id: userId });
      if (error) {
        console.error('RPC Error - agent_get_user_notes:', error.message, error.details, error.code);
        throw new Error(`Failed to load agent notes: ${error.message}`);
      }
      return data as any;
    },

    addUserNote: async (userId: string, content: string): Promise<any> => {
      const { data, error } = await supabase.rpc('agent_add_user_note', { p_user_id: userId, p_content: content });
      if (error) {
        console.error('RPC Error - agent_add_user_note:', error.message, error.details, error.code);
        throw new Error(`Failed to save agent note: ${error.message}`);
      }
      return data as any;
    },

    heartbeat: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('agent_heartbeat');
      if (error) {
        console.error('RPC Error - agent_heartbeat:', error.message, error.details, error.code);
        throw new Error(`Heartbeat failed: ${error.message}`);
      }
      return data;
    },

    updateSelfProfile: async (updates: { full_name?: string; profile_photo?: string; age?: number; location?: string; bio?: string; interests?: string }): Promise<any> => {
      const { data, error } = await supabase.rpc('agent_update_self_profile', {
        p_full_name: updates.full_name,
        p_profile_photo: updates.profile_photo,
        p_age: updates.age,
        p_location: updates.location,
        p_bio: updates.bio,
        p_interests: updates.interests,
      });
      if (error) throw error;
      return data;
    },
  },

  // Conversation functions
  conversation: {
    myConversations: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('conversation_my_conversations', { p_limit: limit, p_offset: offset });
      if (error) {
        console.error('RPC Error - conversation_my_conversations:', error.message, error.details, error.code);
        throw new Error(`Failed to load conversations: ${error.message}`);
      }
      return data;
    },

    allConversations: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('conversation_all_conversations', { p_limit: limit, p_offset: offset });
      if (error) {
        console.error('RPC Error - conversation_all_conversations:', error.message, error.details, error.code);
        throw new Error(`Failed to load all conversations: ${error.message}`);
      }
      return data;
    },

    getMessages: async (conversationId: number) => {
      const { data, error } = await supabase.rpc('conversation_get_messages', { p_conversation_id: conversationId });
      if (error) {
        console.error('RPC Error - conversation_get_messages:', error.message, error.details, error.code);
        throw new Error(`Failed to load messages: ${error.message}`);
      }
      return data;
    },

    sendMessage: async (conversationId: number, content?: string, messageType = 'media', mediaUrl?: string, duration?: number) => {
      const { data, error } = await supabase.rpc('user_send_message', {
        p_conversation_id: conversationId,
        p_content: content,
        p_type: messageType,
        p_media_url: mediaUrl,
        p_duration: duration,
      });
      if (error) {
        console.error('RPC Error - user_send_message:', error.message, error.details, error.code);
        throw new Error(`Failed to send message: ${error.message}`);
      }
      return data;
    },

    deleteMessage: async (messageId: number) => {
      const { data, error } = await supabase.rpc('user_delete_message', { p_message_id: messageId });
      if (error) {
        console.error('RPC Error - user_delete_message:', error.message, error.details, error.code);
        throw new Error(`Failed to delete message: ${error.message}`);
      }
      return data;
    },

    markRead: async (conversationId: number) => {
      const { data, error } = await supabase.rpc('conversation_mark_read', { p_conversation_id: conversationId });
      if (error) throw error;
      return data;
    },

    getOnlineAgents: async (): Promise<Array<{
      agent_id: number;
      display_name: string;
      profile_photo: string | null;
    }>> => {
      const { data, error } = await supabase.rpc('get_online_agents');
      if (error) {
        console.error('RPC Error - get_online_agents:', error.message, error.details, error.code);
        throw new Error(`Failed to load online agents: ${error.message}`);
      }
      return data || [];
    },

    reassignToActiveAgent: async (conversationId: number, targetAgentId?: number): Promise<{
      success: boolean;
      conversation_id?: number;
      new_agent_id?: number;
      new_agent_name?: string;
      new_agent_photo?: string;
      error?: string;
    }> => {
      const { data, error } = await supabase.rpc('conversation_reassign_to_active_agent', { 
        p_conversation_id: conversationId,
        p_target_agent_id: targetAgentId || null
      });
      if (error) {
        console.error('RPC Error - conversation_reassign_to_active_agent:', error.message, error.details, error.code);
        throw new Error(`Reassignment failed: ${error.message}`);
      }
      return data as any;
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

    getAdminSettings: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('admin_settings_get');
      if (error) throw error;
      return data?.[0];
    },

    updateAdminSettings: async (messageCostRate?: number, minimumDepositAmount?: number): Promise<any> => {
      const { data, error } = await supabase.rpc('admin_settings_update', {
        p_message_cost_rate: messageCostRate,
        p_minimum_deposit_amount: minimumDepositAmount,
      });
      if (error) {
        console.error('RPC Error - admin_settings_update:', error.message, error.details, error.code);
        throw new Error(`Failed to update admin settings: ${error.message}`);
      }
      return data as any;
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

    // Credit system functions
    getCreditPackages: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('credit_packages_get_all');
      if (error) throw error;
      return data as any;
    },

    getUserCreditsBalance: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('user_credits_get_balance');
      if (error) throw error;
      return data as any;
    },

    createDepositRequest: async (creditPackageId: string, paymentMethod: string): Promise<any> => {
      const { data, error } = await supabase.rpc('payment_create_request', {
        p_credit_package_id: creditPackageId,
        p_payment_method: paymentMethod,
      });
      if (error) throw error;

      // Fire admin notification email
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const user = sessionData.session?.user;

        if (token && user) {
          const requestId = (data as any)?.requestId ?? (data as any)?.id;
          const amount = (data as any)?.amount ?? 0;
          const displayName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Unknown User';

          await fetch(
            'https://uyuecdtiupucoixnpwbz.supabase.co/functions/v1/send-payment-request',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                userName: displayName,
                userEmail: user.email ?? '',
                amount,
                paymentMethod,
                requestId: String(requestId),
              }),
            }
          );
        }
      } catch (emailErr) {
        console.error('send-payment-request email failed (non-fatal):', emailErr);
      }

      return data as any;
    },

    approveDeposit: async (paymentRequestId: string, creditsToGrant?: number, adminNotes?: string): Promise<any> => {
      const { data, error } = await supabase.rpc('payment_approve_deposit', {
        p_request_id: paymentRequestId,
        p_credits_to_grant: creditsToGrant,
        p_admin_notes: adminNotes,
      });
      if (error) {
        console.error('RPC Error - payment_approve_deposit:', error.message, error.details, error.code);
        throw new Error(`Failed to approve deposit: ${error.message}`);
      }
      return data as any;
    },

    getCreditTransactions: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('credit_transactions_get_user');
      if (error) throw error;
      return data as any;
    },

    createRequest: async (planId: string, paymentMethod: string): Promise<any> => {
      // 1. Insert payment request into DB
      const { data, error } = await supabase.rpc('payment_create_request', {
        p_plan_id: planId,
        p_payment_method: paymentMethod,
      });
      if (error) throw error;

      // 2. Fire the admin notification email (non-fatal — DB record already saved)
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const user = sessionData.session?.user;

        if (token && user) {
          const requestId = (data as any)?.id ?? (data as any)?.request_id ?? planId;
          const requestAmount = (data as any)?.amount ?? 0;
          const displayName =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email ??
            'Unknown User';

          await fetch(
            'https://uyuecdtiupucoixnpwbz.supabase.co/functions/v1/send-payment-request',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                userName: displayName,
                userEmail: user.email ?? '',
                amount: requestAmount,
                paymentMethod,
                requestId: String(requestId),
              }),
            }
          );
        }
      } catch (emailErr) {
        // Log but don't throw — payment request was already created successfully
        console.error('send-payment-request email failed (non-fatal):', emailErr);
      }

      return data as any;
    },

    createCustomDeposit: async (amount: number, paymentMethod: string): Promise<any> => {
      const { data, error } = await supabase.rpc('payment_create_custom_deposit', {
        p_amount: amount,
        p_payment_method: paymentMethod,
      });
      if (error) throw error;

      // Fire admin notification email (non-fatal)
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const user = sessionData.session?.user;

        if (token && user) {
          const requestId = (data as any)?.id ?? (data as any)?.request_id;
          const displayName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Unknown User';

          await fetch(
            'https://uyuecdtiupucoixnpwbz.supabase.co/functions/v1/send-payment-request',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                userName: displayName,
                userEmail: user.email ?? '',
                amount,
                paymentMethod,
                requestId: String(requestId),
                isCustomDeposit: true,
              }),
            }
          );
        }
      } catch (emailErr) {
        console.error('send-payment-request email failed (non-fatal):', emailErr);
      }

      return data as any;
    },

    getPending: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('payment_get_pending', {});
      if (error) {
        console.error('RPC Error - payment_get_pending:', error.message, error.details, error.code);
        throw new Error(`Failed to load pending payments: ${error.message}`);
      }
      return data as any;
    },

    confirmAndAssign: async (paymentRequestId: string, agentId: string, adminNotes?: string): Promise<any> => {
      const { data, error } = await supabase.rpc('payment_confirm_and_assign', {
        p_payment_request_id: paymentRequestId,
        p_agent_id: agentId,
        p_admin_notes: adminNotes,
      });
      if (error) {
        console.error('RPC Error - payment_confirm_and_assign:', error.message, error.details, error.code);
        throw new Error(`Failed to confirm and assign payment: ${error.message}`);
      }
      return data as any;
    },

    getAll: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase.rpc('payment_get_all', { p_limit: limit, p_offset: offset });
      if (error) {
        console.error('RPC Error - payment_get_all:', error.message, error.details, error.code);
        throw new Error(`Failed to load all payments: ${error.message}`);
      }
      return data;
    },

    updateStatus: async (paymentId: number, status: string, adminNotes?: string) => {
      const { data, error } = await supabase.rpc('payment_update_status', { p_payment_id: paymentId, p_status: status, p_admin_notes: adminNotes });
      if (error) {
        console.error('RPC Error - payment_update_status:', error.message, error.details, error.code);
        throw new Error(`Failed to update payment status: ${error.message}`);
      }
      return data;
    },
  },

  // KYC functions
  kyc: {
    getAll: async () => {
      const { data, error } = await supabase.rpc('kyc_get_all');
      if (error) throw error;
      return data;
    },

    updateStatus: async (kycId: number, status: string, adminNotes?: string) => {
      const { data, error } = await supabase.rpc('kyc_update_status', { p_kyc_id: kycId, p_status: status, p_admin_notes: adminNotes });
      if (error) throw error;
      return data;
    },
  },

  // Agent profiles functions
  agentProfiles: {
    getAll: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('agent_profiles_get_all');
      if (error) throw error;
      return data as any;
    },

    updateProfile: async (agentProfileId: string, displayName?: string, profilePhoto?: string, bio?: string): Promise<any> => {
      const { data, error } = await supabase
        .from('agent_profiles')
        .update({
          ...(displayName && { display_name: displayName }),
          ...(profilePhoto && { profile_photo: profilePhoto }),
          ...(bio && { bio }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentProfileId)
        .select();
      if (error) throw error;
      return data;
    },
  },

  // Profile media functions
  profile: {
    getMedia: async (userId: string): Promise<any[]> => {
      const { data, error } = await supabase
        .from('profile_media')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    addMedia: async (userId: string, mediaUrl: string): Promise<any> => {
      const { data, error } = await supabase
        .from('profile_media')
        .insert({ user_id: userId, media_url: mediaUrl })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    deleteMedia: async (mediaId: number): Promise<any> => {
      const { error } = await supabase
        .from('profile_media')
        .delete()
        .eq('id', mediaId);
      if (error) throw error;
      return true;
    }
  },
};
