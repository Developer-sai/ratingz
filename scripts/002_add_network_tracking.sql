-- Add network tracking fields to ratings table for enhanced restriction
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS user_ip TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS network_fingerprint TEXT;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_ratings_user_ip ON ratings(user_ip);
CREATE INDEX IF NOT EXISTS idx_ratings_network_fingerprint ON ratings(network_fingerprint);

-- Add composite unique constraint to prevent multiple ratings from same IP
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_movie_id_device_id_key;
ALTER TABLE ratings ADD CONSTRAINT ratings_unique_per_movie UNIQUE(movie_id, device_id, user_ip);

-- Add the same fields to reactions table for consistency
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS user_ip TEXT;
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS network_fingerprint TEXT;

-- Create indexes for reactions
CREATE INDEX IF NOT EXISTS idx_reactions_user_ip ON reactions(user_ip);
CREATE INDEX IF NOT EXISTS idx_reactions_network_fingerprint ON reactions(network_fingerprint);

-- Update reactions unique constraint
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_movie_id_device_id_key;
ALTER TABLE reactions ADD CONSTRAINT reactions_unique_per_movie UNIQUE(movie_id, device_id, user_ip);