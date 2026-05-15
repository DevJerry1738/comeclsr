# Conversation Diagnostics

## Issue
User Messages page shows "No conversations yet" despite:
- Active subscription confirmed to exist
- Agent assignment confirmed to exist (visible in Agent Dashboard)
- No console errors

## Root Cause Analysis Needed

### 1. Database Level - Check if Conversations Exist

Run in Supabase SQL Editor:
```sql
-- Check all conversations in the database
SELECT 
  c.id,
  c.user_id,
  c.agent_id,
  c.status,
  c.created_at,
  up.full_name as user_name,
  a.display_name as agent_name,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
FROM conversations c
LEFT JOIN user_profiles up ON c.user_id = up.id
LEFT JOIN agents a ON c.agent_id = a.id
ORDER BY c.created_at DESC;
```

### 2. Check if RLS Policies Allow User to See Conversations

Run as the specific user (after logging in):
```sql
-- This should show conversations the user owns
SELECT id, user_id, agent_id, status FROM conversations 
WHERE user_id = auth.uid();
```

### 3. Check payment_confirm_and_assign Function

The function should:
1. Create a conversation with the assigned agent
2. Create initial message

Location: `supabase/migrations/20260540_create_conversation_on_payment_confirm.sql`

Key SQL should be:
```sql
-- Create conversation
INSERT INTO conversations (user_id, agent_id, status, admin_approved)
VALUES (p_user_id, v_agents_record_id, 'active', true);
```

### 4. Frontend Debugging - Add Logging to Messages.tsx

Add this to `src/pages/Messages.tsx` around line 50:
```typescript
const { data: conversations, isLoading, error } = useQuery({
  queryKey: ['conversations', 'my'],
  queryFn: async () => {
    console.log('[Messages] Fetching conversations for user:', user?.id);
    const result = await rpc.conversation.myConversations();
    console.log('[Messages] Conversations result:', result);
    return result;
  },
  enabled: !!user,
});
```

## Steps to Resolve

1. **Check Database**: Run the first SQL query to confirm conversations exist
2. **Check RLS**: Verify user can access their conversations via SQL query
3. **Check Function**: Verify payment_confirm_and_assign creates conversation
4. **Check Frontend**: Add console logging and check browser DevTools
5. **Check Agent Lookup**: Verify agent record is created properly when agent signs up

## Key Tables to Verify
- `conversations` - should have records with user_id and agent_id
- `messages` - should have initial messages if conversation was created
- `agents` - agent record should exist with user_id pointing to agent's auth.user
- `user_subscriptions` - user should have active subscription
- `agent_assignments` - should have record linking user to agent
