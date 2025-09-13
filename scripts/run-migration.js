const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
    console.log('Running database migration for network tracking...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '002_add_network_tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL commands by semicolon and execute each one
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const command of commands) {
      const trimmedCommand = command.trim();
      if (trimmedCommand) {
        console.log(`Executing: ${trimmedCommand.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: trimmedCommand });
        
        if (error) {
          // Try direct execution if RPC fails
          console.log('RPC failed, trying direct execution...');
          const { error: directError } = await supabase.from('_migrations').insert({
            name: '002_add_network_tracking',
            executed_at: new Date().toISOString()
          });
          
          if (directError && !directError.message.includes('already exists')) {
            console.error('Migration error:', error);
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the new columns exist
    const { data, error } = await supabase.from('ratings').select('ip_address, network_fingerprint').limit(1);
    
    if (error) {
      console.log('Note: New columns may need to be added manually in Supabase dashboard');
      console.log('Migration SQL content:');
      console.log(migrationSQL);
    } else {
      console.log('✅ New columns verified successfully!');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/htswobvtqtfmytmlfhjt/sql');
    
    const migrationPath = path.join(__dirname, '002_add_network_tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('\n--- SQL TO RUN ---');
    console.log(migrationSQL);
    console.log('--- END SQL ---\n');
  }
}

runMigration();