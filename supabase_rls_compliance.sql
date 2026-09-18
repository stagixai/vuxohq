-- VUXO Infrastructure — HIPAA/Enterprise Compliance & RLS Migration Script
-- Execute this script in your Supabase SQL Editor

-- 1. Add retention and audit columns to SynthesisLog
ALTER TABLE "SynthesisLog" 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 2. Enable Row-Level Security (RLS) on sensitive tables
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SynthesisLog" ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies: Users can ONLY see/modify their own data
DROP POLICY IF EXISTS "Users can view own sessions" ON "ChatSession";
CREATE POLICY "Users can view own sessions" 
ON "ChatSession" FOR SELECT 
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON "ChatSession";
CREATE POLICY "Users can insert own sessions" 
ON "ChatSession" FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can view own synthesis logs" ON "SynthesisLog";
CREATE POLICY "Users can view own synthesis logs" 
ON "SynthesisLog" FOR SELECT 
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "System can insert synthesis logs" ON "SynthesisLog";
CREATE POLICY "System can insert synthesis logs" 
ON "SynthesisLog" FOR INSERT 
WITH CHECK (true); -- Allow backend service role to insert

-- 4. Create a Soft-Delete Retention Policy (Auto-- Compliance soft-deletion function
CREATE OR REPLACE FUNCTION soft_delete_old_logs()
RETURNS void AS $$
BEGIN
    UPDATE "SynthesisLog"
    SET deleted_at = NOW()
    WHERE created_at < NOW() - INTERVAL '90 days'
      AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pillar 3: Beta User Onboarding & Waitlist Schema
CREATE TABLE IF NOT EXISTS "Waitlist" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "Waitlist" ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/authenticated) to join waitlist
CREATE POLICY "Anyone can join waitlist" ON "Waitlist" FOR INSERT WITH CHECK (true);

-- Allow users to read their own waitlist status by email
CREATE POLICY "Users can read own waitlist status" ON "Waitlist" FOR SELECT USING (auth.email() = email);

-- Public Telemetry RPC Function
CREATE OR REPLACE FUNCTION get_public_telemetry()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_characters', COALESCE(SUM("characterCount"), 0),
    'total_sessions', (SELECT COUNT(*) FROM "ChatSession"),
    'avg_latency_ms', COALESCE(ROUND(AVG("latencyMs")), 0),
    'total_audio_seconds', COALESCE(SUM("audioDurationSeconds"), 0)
  ) INTO result
  FROM "SynthesisLog"
  WHERE deleted_at IS NULL;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
