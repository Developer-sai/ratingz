const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to check if movies table exists by attempting to query it
    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('id')
      .limit(1);
    
    if (!moviesError) {
      console.log('✅ Database connection successful!');
      console.log('✅ Movies table exists!');
      
      // Check other tables
      const { error: ratingsError } = await supabase.from('ratings').select('id').limit(1);
      const { error: reactionsError } = await supabase.from('reactions').select('id').limit(1);
      
      if (!ratingsError && !reactionsError) {
        console.log('✅ All required tables exist!');
        console.log('Database is ready for the application.');
        return;
      }
    }
    
    console.log('⚠️  Database tables need to be created.');
    console.log('');
    console.log('Please follow these steps to set up the database:');
    console.log('1. Go to: https://supabase.com/dashboard/project/htswobvtqtfmytmlfhjt/sql');
    console.log('2. Copy the entire contents of scripts/001_create_tables.sql');
    console.log('3. Paste it into the SQL Editor');
    console.log('4. Click "Run" to execute the migration');
    console.log('');
    console.log('The migration will create:');
    console.log('- movies table (for storing movie information)');
    console.log('- ratings table (for user ratings)');
    console.log('- reactions table (for thumbs up/down)');
    console.log('- Row Level Security policies');
    console.log('- Performance indexes');
    console.log('');
    console.log('After running the migration, restart this script to verify.');
    
  } catch (err) {
    console.error('Error during database check:', err.message);
    console.log('');
    console.log('Please ensure your Supabase credentials are correct in .env.local');
    process.exit(1);
  }
}

runMigration();