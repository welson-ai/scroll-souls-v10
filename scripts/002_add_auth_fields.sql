-- Add authentication fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add unique constraint for email
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS unique_profiles_email UNIQUE(email);

-- Optional: Add password_changed_at field for tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at timestamp with time zone;
