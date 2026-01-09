-- Fix profiles RLS policies to use PERMISSIVE instead of RESTRICTIVE
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate as PERMISSIVE policies (default behavior, OR logic)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure no anonymous/public access to profiles
-- By only granting policies to 'authenticated' role, anonymous users cannot access

-- For winner_display VIEW: Recreate with security_invoker to inherit RLS from underlying tables
-- First drop the existing view
DROP VIEW IF EXISTS public.winner_display;

-- Recreate with explicit security_invoker = true
CREATE VIEW public.winner_display
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  CASE 
    WHEN p.full_name IS NOT NULL AND p.full_name != '' 
    THEN CONCAT(LEFT(p.full_name, 1), '***')
    ELSE CONCAT(LEFT(p.email, 2), '***')
  END as display_name
FROM public.profiles p;

-- Grant SELECT on the view to authenticated users only
REVOKE ALL ON public.winner_display FROM anon;
REVOKE ALL ON public.winner_display FROM public;
GRANT SELECT ON public.winner_display TO authenticated;