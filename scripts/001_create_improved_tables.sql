-- Enhanced database schema for movie rating application
-- This script creates all necessary tables with improved constraints and indexing

-- Create movies table with proper ID generation and constraints
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 5),
  poster_url TEXT,
  imdb_id TEXT UNIQUE CHECK (imdb_id IS NULL OR imdb_id ~ '^tt\d{7,8}$'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table with enhanced user tracking and constraints
CREATE TABLE IF NOT EXISTS ratings (
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
  -- Ensure one rating per user per movie (using multiple identifiers for better restriction)
  UNIQUE(movie_id, device_id, user_ip)
);

-- Create reactions table with enhanced user tracking
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL CHECK (length(trim(device_id)) > 0),
  user_ip TEXT NOT NULL CHECK (length(trim(user_ip)) > 0),
  network_fingerprint TEXT,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('thumbs_up', 'thumbs_down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one reaction per user per movie
  UNIQUE(movie_id, device_id, user_ip)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
CREATE INDEX IF NOT EXISTS idx_movies_imdb_id ON movies(imdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_device_id ON ratings(device_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_ip ON ratings(user_ip);
CREATE INDEX IF NOT EXISTS idx_ratings_overall_rating ON ratings(overall_rating);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reactions_movie_id ON reactions(movie_id);
CREATE INDEX IF NOT EXISTS idx_reactions_device_id ON reactions(device_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_ip ON reactions(user_ip);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON reactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (suitable for this application)
-- Movies policies
CREATE POLICY "Allow public read access to movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Allow public insert to movies" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to movies" ON movies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to movies" ON movies FOR DELETE USING (true);

-- Ratings policies
CREATE POLICY "Allow public read access to ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Allow public insert to ratings" ON ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to ratings" ON ratings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to ratings" ON ratings FOR DELETE USING (true);

-- Reactions policies
CREATE POLICY "Allow public read access to reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to reactions" ON reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to reactions" ON reactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to reactions" ON reactions FOR DELETE USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();