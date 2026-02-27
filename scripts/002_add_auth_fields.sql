-- Add authentication fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add password_changed_at field for tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at timestamp with time zone;

-- Add email verification fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified_at timestamp with time zone;
