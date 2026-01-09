-- Ensure RLS is ENABLED on profiles table (this is idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (extra security)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Revoke any default public/anon access to profiles table
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Ensure only authenticated role has access through RLS policies
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- For winner_display VIEW - ensure it's properly secured
-- (It's a VIEW not a table, so RLS doesn't apply directly - we use security_invoker and grants)
REVOKE ALL ON public.winner_display FROM anon;
REVOKE ALL ON public.winner_display FROM public;
GRANT SELECT ON public.winner_display TO authenticated;