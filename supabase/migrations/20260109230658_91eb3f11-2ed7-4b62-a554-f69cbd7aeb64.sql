-- Fix profiles table: Convert restrictive SELECT policies to permissive
-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate as PERMISSIVE policies (default behavior grants access)
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

-- Fix raffles table: Remove policy that exposes seed to public
-- The seed field should NEVER be visible to non-admins
DROP POLICY IF EXISTS "Anyone can view live and closed raffles" ON public.raffles;

-- Users should access public raffle data through the public_raffles view (which excludes seed)
-- Only admins can directly access the raffles table
-- Revoke direct table access from anon role
REVOKE ALL ON public.raffles FROM anon;
REVOKE ALL ON public.raffles FROM public;

-- Ensure public_raffles view is accessible to everyone (it already excludes the seed)
GRANT SELECT ON public.public_raffles TO anon;
GRANT SELECT ON public.public_raffles TO authenticated;