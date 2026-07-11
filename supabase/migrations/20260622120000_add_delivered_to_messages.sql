-- Migration: Add delivered column to messages table to track if a message has been delivered to an online agent
-- This column defaults to FALSE and will be set to TRUE when the message is successfully sent

ALTER TABLE public.messages
ADD COLUMN delivered BOOLEAN NOT NULL DEFAULT FALSE;
