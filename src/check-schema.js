import { supabase } from './lib/supabase';

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Get list of tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.error('Error getting tables:', tablesError);
      return;
    }
    
    console.log('Tables in the database:', tables.map(t => t.table_name));
    
    // Check profiles table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');
      
    if (columnsError) {
      console.error('Error getting columns for profiles table:', columnsError);
      return;
    }
    
    console.log('Profiles table structure:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });
    
    // Try to get a sample profile
    const { data: sampleProfile, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('Error getting sample profile:', sampleError);
    } else if (sampleProfile && sampleProfile.length > 0) {
      console.log('Sample profile structure:', Object.keys(sampleProfile[0]));
    } else {
      console.log('No profiles found in the database');
    }
    
    // Check for RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies')
      .eq('table_name', 'profiles');
      
    if (policiesError) {
      console.error('Error getting RLS policies:', policiesError);
    } else {
      console.log('RLS policies for profiles table:', policies);
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema(); 