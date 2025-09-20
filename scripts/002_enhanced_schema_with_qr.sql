-- Enhanced database schema for movie rating application with QR code support
-- This script creates all necessary tables with improved constraints and QR code functionality

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS movies CASCADE;

-- Create movies table with proper ID generation, constraints, and QR code support
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id SERIAL UNIQUE NOT NULL, -- Sequential ID for QR codes (ratingz.fun/{movie_id})
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 5),
  poster_url TEXT,
  imdb_id TEXT UNIQUE CHECK (imdb_id IS NULL OR imdb_id ~ '^tt\d{7,8}$'),
  qr_code_url TEXT, -- URL to the generated QR code image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table with enhanced user tracking and ONE-TIME rating constraint
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL CHECK (length(trim(device_id)) > 0),
  user_ip TEXT NOT NULL CHECK (length(trim(user_ip)) > 0),
  network_fingerprint TEXT,
  overall_rating DECIMAL(2,1) NOT NULL CHECK (overall_rating >= 0.5 AND overall_rating <= 5.0),
  story_rating DECIMAL(2,1) NOT NULL CHECK (story_rating >= 0.5 AND story_rating <= 5.0),
  screenplay_rating DECIMAL(2,1) NOT NULL CHECK (screenplay_rating >= 0.5 AND screenplay_rating <= 5.0),
  direction_rating DECIMAL(2,1) NOT NULL CHECK (direction_rating >= 0.5 AND direction_rating <= 5.0),
  performance_rating DECIMAL(2,1) NOT NULL CHECK (performance_rating >= 0.5 AND performance_rating <= 5.0),
  music_rating DECIMAL(2,1) NOT NULL CHECK (music_rating >= 0.5 AND music_rating <= 5.0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- STRICT constraint: ONE rating per user per movie (no updates allowed)
  UNIQUE(movie_id, device_id, user_ip)
);

-- Create reactions table with enhanced user tracking and ONE-TIME reaction constraint
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL CHECK (length(trim(device_id)) > 0),
  user_ip TEXT NOT NULL CHECK (length(trim(user_ip)) > 0),
  network_fingerprint TEXT,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('thumbs_up', 'thumbs_down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- STRICT constraint: ONE reaction per user per movie (no switching allowed)
  UNIQUE(movie_id, device_id, user_ip)
);

-- Create user_restrictions table to track user actions and prevent changes
CREATE TABLE user_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL CHECK (length(trim(device_id)) > 0),
  user_ip TEXT NOT NULL CHECK (length(trim(user_ip)) > 0),
  has_rated BOOLEAN DEFAULT FALSE,
  has_reacted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(movie_id, device_id, user_ip)
);

-- Create indexes for better performance
CREATE INDEX idx_movies_movie_id ON movies(movie_id);
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_movies_year ON movies(year);
CREATE INDEX idx_movies_imdb_id ON movies(imdb_id);
CREATE INDEX idx_movies_created_at ON movies(created_at DESC);

CREATE INDEX idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX idx_ratings_device_id ON ratings(device_id);
CREATE INDEX idx_ratings_user_ip ON ratings(user_ip);
CREATE INDEX idx_ratings_overall_rating ON ratings(overall_rating);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);

CREATE INDEX idx_reactions_movie_id ON reactions(movie_id);
CREATE INDEX idx_reactions_device_id ON reactions(device_id);
CREATE INDEX idx_reactions_user_ip ON reactions(user_ip);
CREATE INDEX idx_reactions_type ON reactions(reaction_type);
CREATE INDEX idx_reactions_created_at ON reactions(created_at DESC);

CREATE INDEX idx_user_restrictions_movie_device_ip ON user_restrictions(movie_id, device_id, user_ip);

-- Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_restrictions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
-- Movies policies
CREATE POLICY "Allow public read access to movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Allow public insert to movies" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to movies" ON movies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to movies" ON movies FOR DELETE USING (true);

-- Ratings policies (INSERT only - no updates to enforce one-time rating)
CREATE POLICY "Allow public read access to ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Allow public insert to ratings" ON ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Prevent rating updates" ON ratings FOR UPDATE USING (false);
CREATE POLICY "Allow public delete to ratings" ON ratings FOR DELETE USING (true);

-- Reactions policies (INSERT only - no updates to enforce one-time reaction)
CREATE POLICY "Allow public read access to reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to reactions" ON reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Prevent reaction updates" ON reactions FOR UPDATE USING (false);
CREATE POLICY "Allow public delete to reactions" ON reactions FOR DELETE USING (true);

-- User restrictions policies
CREATE POLICY "Allow public read access to user_restrictions" ON user_restrictions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to user_restrictions" ON user_restrictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to user_restrictions" ON user_restrictions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to user_restrictions" ON user_restrictions FOR DELETE USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update user restrictions when rating is inserted
CREATE OR REPLACE FUNCTION update_user_restrictions_on_rating()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_restrictions (movie_id, device_id, user_ip, has_rated, has_reacted)
    VALUES (NEW.movie_id, NEW.device_id, NEW.user_ip, true, false)
    ON CONFLICT (movie_id, device_id, user_ip)
    DO UPDATE SET has_rated = true, updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update user restrictions when reaction is inserted
CREATE OR REPLACE FUNCTION update_user_restrictions_on_reaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_restrictions (movie_id, device_id, user_ip, has_rated, has_reacted)
    VALUES (NEW.movie_id, NEW.device_id, NEW.user_ip, false, true)
    ON CONFLICT (movie_id, device_id, user_ip)
    DO UPDATE SET has_reacted = true, updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to prevent duplicate ratings
CREATE OR REPLACE FUNCTION prevent_duplicate_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM user_restrictions 
        WHERE movie_id = NEW.movie_id 
        AND device_id = NEW.device_id 
        AND user_ip = NEW.user_ip 
        AND has_rated = true
    ) THEN
        RAISE EXCEPTION 'User has already rated this movie. Only one rating per user is allowed.';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to prevent duplicate reactions
CREATE OR REPLACE FUNCTION prevent_duplicate_reaction()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM user_restrictions 
        WHERE movie_id = NEW.movie_id 
        AND device_id = NEW.device_id 
        AND user_ip = NEW.user_ip 
        AND has_reacted = true
    ) THEN
        RAISE EXCEPTION 'User has already reacted to this movie. Only one reaction per user is allowed.';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_restrictions_updated_at BEFORE UPDATE ON user_restrictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers to prevent duplicate ratings and reactions
CREATE TRIGGER prevent_duplicate_rating_trigger BEFORE INSERT ON ratings
    FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_rating();

CREATE TRIGGER prevent_duplicate_reaction_trigger BEFORE INSERT ON reactions
    FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_reaction();

-- Create triggers to update user restrictions
CREATE TRIGGER update_restrictions_on_rating AFTER INSERT ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_user_restrictions_on_rating();

CREATE TRIGGER update_restrictions_on_reaction AFTER INSERT ON reactions
    FOR EACH ROW EXECUTE FUNCTION update_user_restrictions_on_reaction();

-- Insert sample data for testing (optional)
INSERT INTO movies (title, year, poster_url, imdb_id) VALUES
('Demon Slayer: Kimetsu no Yaiba - Infinity Castle', 2025, 'https://example.com/demon-slayer.jpg', 'tt1234567'),
('Kishkindhapur', 2024, 'https://example.com/kishkindhapur.jpg', 'tt2345678'),
('Mirai', 2025, 'https://example.com/mirai.jpg', 'tt3456789'),
('OG', 2024, 'https://example.com/og.jpg', 'tt4567890');

-- Create view for easy movie access with QR URLs
CREATE OR REPLACE VIEW movies_with_qr AS
SELECT 
    id,
    movie_id,
    title,
    year,
    poster_url,
    imdb_id,
    COALESCE(qr_code_url, 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ratingz.fun/' || movie_id) as qr_code_url,
    created_at,
    updated_at
FROM movies;