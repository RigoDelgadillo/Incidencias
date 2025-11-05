import { createClient } from "@supabase/supabase-js";
import "expo-sqlite/localStorage/install";

const supabaseUrl = "https://fapzvbtqhwajizesonhx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhcHp2YnRxaHdhaml6ZXNvbmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NDAwOTUsImV4cCI6MjA3MzMxNjA5NX0.U3qbanMAFToBuRABhMKPKNPHM_SB4RVbPqcrXxhYUe0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
