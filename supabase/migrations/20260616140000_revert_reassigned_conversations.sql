-- 20260615d_revert_reassigned_conversations.sql
-- Revert any conversations that were incorrectly reassigned back to their original agents.
-- We identify the original agent by looking at who sent the agent messages in each conversation.

UPDATE public.conversations c
SET agent_id = a.id
FROM public.messages m
JOIN public.agents a ON m.sender_id = a.user_id
WHERE m.conversation_id = c.id
  AND m.sender_role = 'agent'
  AND c.agent_id != a.id;
