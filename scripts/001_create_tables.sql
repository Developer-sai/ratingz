-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  year INTEGER,
  poster_url TEXT,
  imdb_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  overall_rating DECIMAL(2,1) CHECK (overall_rating >= 0 AND overall_rating <= 5),
  story_rating DECIMAL(2,1) CHECK (story_rating >= 0 AND story_rating <= 5),
  screenplay_rating DECIMAL(2,1) CHECK (screenplay_rating >= 0 AND screenplay_rating <= 5),
  direction_rating DECIMAL(2,1) CHECK (direction_rating >= 0 AND direction_rating <= 5),
  performance_rating DECIMAL(2,1) CHECK (performance_rating >= 0 AND performance_rating <= 5),
  music_rating DECIMAL(2,1) CHECK (music_rating >= 0 AND music_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(movie_id, device_id)
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('thumbs_up', 'thumbs_down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(movie_id, device_id)
);

-- Enable RLS on all tables (public access for this app)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access and device-based write access
CREATE POLICY "Allow public read access to movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Allow public insert to movies" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to movies" ON movies FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Allow device-based insert to ratings" ON ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow device-based update to ratings" ON ratings FOR UPDATE USING (true);
CREATE POLICY "Allow device-based delete to ratings" ON ratings FOR DELETE USING (true);

CREATE POLICY "Allow public read access to reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Allow device-based insert to reactions" ON reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow device-based update to reactions" ON reactions FOR UPDATE USING (true);
CREATE POLICY "Allow device-based delete to reactions" ON reactions FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_device_id ON ratings(device_id);
CREATE INDEX IF NOT EXISTS idx_reactions_movie_id ON reactions(movie_id);
CREATE INDEX IF NOT EXISTS idx_reactions_device_id ON reactions(device_id);
CREATE INDEX IF NOT EXISTS idx_movies_imdb_id ON movies(imdb_id);
