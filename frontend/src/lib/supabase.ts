import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gbpfakcmiwyugsmicrej.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_cQF5YTi7ad2dnQ3N6w__pA_1psKz9hX";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

