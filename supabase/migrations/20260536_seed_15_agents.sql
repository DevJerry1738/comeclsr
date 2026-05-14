-- 20260536_seed_15_agents.sql
-- Seed 15 pre-generated agent profiles ready for login

INSERT INTO public.user_profiles (
  id,
  username,
  email,
  full_name,
  role,
  status,
  payment_status,
  kyc_status,
  created_at,
  updated_at
) VALUES
  (gen_random_uuid(), 'agent_001', 'agent_001@comeclsr.com', 'Agent 001', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_002', 'agent_002@comeclsr.com', 'Agent 002', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_003', 'agent_003@comeclsr.com', 'Agent 003', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_004', 'agent_004@comeclsr.com', 'Agent 004', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_005', 'agent_005@comeclsr.com', 'Agent 005', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_006', 'agent_006@comeclsr.com', 'Agent 006', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_007', 'agent_007@comeclsr.com', 'Agent 007', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_008', 'agent_008@comeclsr.com', 'Agent 008', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_009', 'agent_009@comeclsr.com', 'Agent 009', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_010', 'agent_010@comeclsr.com', 'Agent 010', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_011', 'agent_011@comeclsr.com', 'Agent 011', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_012', 'agent_012@comeclsr.com', 'Agent 012', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_013', 'agent_013@comeclsr.com', 'Agent 013', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_014', 'agent_014@comeclsr.com', 'Agent 014', 'agent', 'active', 'approved', 'approved', NOW(), NOW()),
  (gen_random_uuid(), 'agent_015', 'agent_015@comeclsr.com', 'Agent 015', 'agent', 'active', 'approved', 'approved', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
