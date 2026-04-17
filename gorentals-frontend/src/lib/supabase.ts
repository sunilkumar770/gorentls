import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (supabaseUrl === 'http://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
  console.warn(
    '[GoRentals] Missing Supabase env vars. Image uploads are disabled.\n' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local for real uploads.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
