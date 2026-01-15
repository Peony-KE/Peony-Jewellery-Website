import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Using untyped client to avoid build-time type inference issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
