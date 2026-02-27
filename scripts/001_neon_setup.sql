-- Neon Database Setup for Scroll Souls
-- This migration creates the complete schema for the emotional wellness application

-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

-- Profiles table (user metadata)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  current_level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_check_in_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emotions reference table
CREATE TABLE IF NOT EXISTS emotions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color_primary TEXT NOT NULL,
  color_secondary TEXT,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert emotion reference data
INSERT INTO emotions (id, name, color_primary, color_secondary, emoji) VALUES
  ('joy', 'Joy', '#FCD34D', '#FEF3C7', '😊'),
  ('sadness', 'Sadness', '#60A5FA', '#DBEAFE', '😢'),
  ('anger', 'Anger', '#F87171', '#FEE2E2', '😠'),
  ('fear', 'Fear', '#A78BFA', '#EDE9FE', '😨'),
  ('stress', 'Stress', '#6EE7B7', '#D1FAE5', '😰'),
  ('peace', 'Peace', '#34D399', '#D1FAE5', '😌'),
  ('love', 'Love', '#F9A8D4', '#FCE7F3', '❤️'),
  ('tired', 'Tired', '#D1D5DB', '#F3F4F6', '😴')
ON CONFLICT (id) DO NOTHING;

-- Check-ins table for daily emotional tracking
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emotion_id TEXT NOT NULL REFERENCES emotions(id),
  intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  triggers TEXT[],
  org_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES check_ins(id) ON DELETE SET NULL,
  emotion_id TEXT NOT NULL REFERENCES emotions(id),
  title TEXT,
  content TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges reference table
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert badge reference data
INSERT INTO badges (id, name, description, icon, requirement_type, requirement_value) VALUES
  ('first_check_in', 'First Steps', 'Complete your first check-in', '🌱', 'check_ins', 1),
  ('week_streak', 'Week Warrior', 'Maintain a 7-day streak', '🔥', 'streak', 7),
  ('month_streak', 'Monthly Master', 'Maintain a 30-day streak', '⭐', 'streak', 30),
  ('ten_entries', 'Storyteller', 'Write 10 journal entries', '📖', 'entries', 10),
  ('fifty_entries', 'Chronicler', 'Write 50 journal entries', '📚', 'entries', 50),
  ('all_emotions', 'Emotion Explorer', 'Experience all 8 emotions', '🎭', 'unique_emotions', 8)
ON CONFLICT (id) DO NOTHING;

-- User badges table (junction table)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Mood insights table
CREATE TABLE IF NOT EXISTS mood_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_date DATE NOT NULL,
  dominant_emotion_id TEXT REFERENCES emotions(id),
  total_check_ins INTEGER DEFAULT 0,
  emotional_variety INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, insight_date)
);

-- ============================================================================
-- 2. COMMUNITY & MOOD WALL TABLES
-- ============================================================================

-- Mood posts for community sharing
CREATE TABLE IF NOT EXISTS mood_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emotion_id TEXT NOT NULL REFERENCES emotions(id),
  content TEXT NOT NULL,
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 5),
  is_anonymous BOOLEAN DEFAULT TRUE,
  reaction_count JSONB DEFAULT '{"support": 0, "relate": 0, "uplift": 0}'::jsonb,
  org_id UUID,
  anonymous_user_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post reactions for community engagement
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mood_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('support', 'relate', 'uplift')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mood_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. ORGANIZATION TABLES
-- ============================================================================

-- Organizations for team/workspace management
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'therapist', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- ============================================================================
-- 4. THERAPIST SYSTEM TABLES
-- ============================================================================

-- Therapists registration
CREATE TABLE IF NOT EXISTS therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  license_number TEXT NOT NULL,
  specialization TEXT NOT NULL,
  years_of_experience INTEGER NOT NULL,
  bio TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  approach TEXT,
  availability TEXT,
  session_rate TEXT,
  profile_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Therapist bookings
CREATE TABLE IF NOT EXISTS therapist_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('video', 'audio', 'chat', 'in-person')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Therapist messages
CREATE TABLE IF NOT EXISTS therapist_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('therapist', 'user')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. CHALLENGES & GAMIFICATION TABLES
-- ============================================================================

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emotion_id TEXT REFERENCES emotions(id) ON DELETE SET NULL,
  target_count INTEGER NOT NULL,
  reward_points INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenge progress
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- ============================================================================
-- 6. FRIENDSHIP/SOCIAL TABLES
-- ============================================================================

-- Friendships for social connections
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Check-ins indexes
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at ON check_ins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_emotion_id ON check_ins(emotion_id);

-- Journal entries indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);

-- Mood posts indexes
CREATE INDEX IF NOT EXISTS idx_mood_posts_created_at ON mood_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_posts_emotion_id ON mood_posts(emotion_id);
CREATE INDEX IF NOT EXISTS idx_mood_posts_org_id ON mood_posts(org_id);
CREATE INDEX IF NOT EXISTS idx_mood_posts_user_id ON mood_posts(user_id);

-- Post reactions indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);

-- Post comments indexes
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

-- Therapist indexes
CREATE INDEX IF NOT EXISTS idx_therapists_status ON therapists(status);
CREATE INDEX IF NOT EXISTS idx_therapists_user_id ON therapists(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_therapist_id ON therapist_bookings(therapist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON therapist_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_therapist_user ON therapist_messages(therapist_id, user_id);

-- Challenge indexes
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);

-- Friendship indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);

-- ============================================================================
-- 8. FUNCTIONS
-- ============================================================================

-- Function to update post reaction counts
CREATE OR REPLACE FUNCTION update_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE mood_posts
    SET reaction_count = jsonb_set(
      reaction_count,
      array[new.reaction_type],
      to_jsonb((reaction_count->>new.reaction_type)::int + 1)
    )
    WHERE id = new.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE mood_posts
    SET reaction_count = jsonb_set(
      reaction_count,
      array[old.reaction_type],
      to_jsonb(greatest((reaction_count->>old.reaction_type)::int - 1, 0))
    )
    WHERE id = old.post_id;
  END IF;
  RETURN COALESCE(new, old);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id TEXT)
RETURNS TABLE(streak INT, level_up BOOLEAN) AS $$
DECLARE
  v_last_check_in_date DATE;
  v_new_streak INT;
  v_old_xp INT;
  v_new_xp INT;
  v_old_level INT;
  v_new_level INT;
BEGIN
  SELECT last_check_in_date, streak_days INTO v_last_check_in_date, v_new_streak
  FROM profiles WHERE id = p_user_id;

  IF v_last_check_in_date IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last_check_in_date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_new_streak + 1;
  ELSIF v_last_check_in_date < CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := 1;
  ELSE
    RETURN QUERY SELECT v_new_streak::INT, FALSE::BOOLEAN;
    RETURN;
  END IF;

  UPDATE profiles
  SET last_check_in_date = CURRENT_DATE,
      streak_days = v_new_streak
  WHERE id = p_user_id;

  RETURN QUERY SELECT v_new_streak::INT, FALSE::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add user XP
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id TEXT, p_xp_amount INT)
RETURNS TABLE(new_xp INT, level_up BOOLEAN) AS $$
DECLARE
  v_old_xp INT;
  v_new_xp INT;
  v_old_level INT;
  v_new_level INT;
BEGIN
  SELECT total_xp, current_level INTO v_old_xp, v_old_level
  FROM profiles WHERE id = p_user_id;

  v_new_xp := v_old_xp + p_xp_amount;
  v_new_level := (v_new_xp / 100) + 1;

  UPDATE profiles
  SET total_xp = v_new_xp,
      current_level = v_new_level
  WHERE id = p_user_id;

  RETURN QUERY SELECT v_new_xp::INT, (v_new_level > v_old_level)::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- Trigger to update reaction counts
CREATE TRIGGER on_reaction_change
  AFTER INSERT OR DELETE ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reaction_count();
