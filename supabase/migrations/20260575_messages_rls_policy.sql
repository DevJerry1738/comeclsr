-- Migration: Add SELECT policy to messages for Realtime support
-- Realtime requires RLS policies to evaluate who can receive the event payload.
-- Since we use RPCs for data access, the table didn't have a SELECT policy.

CREATE POLICY "Users and Agents can read their conversation messages" 
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.agents a 
        WHERE a.id = c.agent_id AND a.user_id = auth.uid()
      )
    )
  )
);
