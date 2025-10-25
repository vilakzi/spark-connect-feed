import { supabase } from './client';

async function testSupabaseConnection() {
  // Try to fetch a small public table (activity_tracking is a safe bet)
  const { data, error } = await supabase
    .from('activity_tracking')
    .select('*')
    .limit(1);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('Supabase connection error:', error.message);
    return false;
  }
  // eslint-disable-next-line no-console
  console.log('Supabase connection success:', data);
  return true;
}

// Only run if executed directly (not imported)
if (typeof window !== 'undefined') {
  testSupabaseConnection();
}

export default testSupabaseConnection;
