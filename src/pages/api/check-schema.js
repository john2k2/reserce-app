import { supabase } from '../../lib/supabase';

export const GET = async () => {
  try {
    console.log('Checking database schema...');
    
    // Try to get a sample profile
    const { data: sampleProfile, error: sampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('Error getting sample profile:', sampleError);
      return new Response(
        JSON.stringify({ error: sampleError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Try a direct insert to see the error
    const testProfile = {
      id: 'test-id-' + Date.now(),
      user_id: 'test-user-id-' + Date.now(),
      name: 'Test User',
      email: 'test@example.com',
      user_type: 'client',
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert([testProfile]);
      
    const result = {
      sampleProfile,
      testProfile,
      insertResult: insertData,
      insertError
    };
    
    return new Response(
      JSON.stringify(result, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking schema:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 