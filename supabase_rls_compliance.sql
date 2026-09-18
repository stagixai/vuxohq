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

-- Pillar 4: VUXO Content Studio (B2B Recurring Revenue Service Engine)
CREATE TABLE IF NOT EXISTS "ContentPost" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL,
  raw_transcript TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  gbp_post JSONB NOT NULL,
  linkedin_post JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "ContentPost" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own content posts" ON "ContentPost";
CREATE POLICY "Users can view own content posts" ON "ContentPost" FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert own content posts" ON "ContentPost";
CREATE POLICY "Users can insert own content posts" ON "ContentPost" FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own content posts" ON "ContentPost";
CREATE POLICY "Users can update own content posts" ON "ContentPost" FOR UPDATE USING (auth.uid() = profile_id);

-- Pillar 5: Master Remediation Engine Schemas & RPCs
CREATE TABLE IF NOT EXISTS "VoiceProfile" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'training' CHECK (status IN ('training', 'ready', 'failed')),
  embeddings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "VoiceProfile" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own voice profile" ON "VoiceProfile";
CREATE POLICY "Users can manage own voice profile" ON "VoiceProfile" FOR ALL USING (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS "PostComment" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES "ContentPost"(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  comment_hash TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  ai_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "PostComment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own post comments" ON "PostComment";
CREATE POLICY "Users can manage own post comments" ON "PostComment" FOR ALL USING (auth.uid() = profile_id);

-- SEC-3: Atomic Database Transaction for Post Approval
CREATE OR REPLACE FUNCTION approve_content_post_tx(
  p_post_id UUID,
  p_profile_id UUID,
  p_status TEXT,
  p_feedback TEXT DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  updated_post json;
BEGIN
  UPDATE "ContentPost"
  SET status = p_status,
      feedback = p_feedback
  WHERE id = p_post_id
    AND profile_id = p_profile_id
  RETURNING json_build_object('id', id, 'status', status, 'feedback', feedback) INTO updated_post;

  IF updated_post IS NULL THEN
    RAISE EXCEPTION 'Post not found or user lacks permission to modify post %', p_post_id;
  END IF;

  RETURN updated_post;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMPLIANCE-1: Automated Data Retention Cleanup Procedure
CREATE OR REPLACE FUNCTION cleanup_expired_content_posts()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM "ContentPost"
  WHERE status = 'rejected'
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Update: VoiceProfile table columns for post ownership validation and notifications
ALTER TABLE "VoiceProfile"
ADD COLUMN IF NOT EXISTS linkedin_profile_url TEXT,
ADD COLUMN IF NOT EXISTS notification_email TEXT;

-- Create: CommentDraft table for reply automation and approval workflow
CREATE TABLE IF NOT EXISTS "CommentDraft" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL,
  platform TEXT DEFAULT 'linkedin',
  post_id TEXT,
  post_url TEXT,
  commenter_name TEXT,
  original_comment TEXT NOT NULL,
  comment_sentiment TEXT,
  strategy TEXT,
  reply_draft TEXT NOT NULL,
  alternative_replies JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'edited', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "CommentDraft" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own comment drafts" ON "CommentDraft";
CREATE POLICY "Users can manage own comment drafts" ON "CommentDraft" FOR ALL USING (auth.uid() = profile_id);
