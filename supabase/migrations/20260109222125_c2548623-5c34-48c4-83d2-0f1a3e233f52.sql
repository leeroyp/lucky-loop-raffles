-- Fix #1: Recreate public_raffles view WITHOUT the seed field to prevent manipulation
DROP VIEW IF EXISTS public.public_raffles;

CREATE VIEW public.public_raffles
WITH (security_invoker = true)
AS
SELECT 
  id,
  title,
  description,
  image_url,
  status,
  end_at,
  winner_id,
  created_at,
  updated_at,
  min_entries,
  seed_hash,  -- Only expose the hash, not the seed itself
  -- seed is intentionally excluded to prevent manipulation
  CASE 
    WHEN status = 'CLOSED' THEN draw_hash 
    ELSE NULL 
  END as draw_hash  -- Only show draw_hash after raffle is closed
FROM public.raffles
WHERE status IN ('LIVE', 'CLOSED');

-- Grant access to authenticated users only
REVOKE ALL ON public.public_raffles FROM anon;
REVOKE ALL ON public.public_raffles FROM public;
GRANT SELECT ON public.public_raffles TO authenticated;

-- Fix #2: Ensure winner_display view has proper access controls (recreate if needed)
DROP VIEW IF EXISTS public.winner_display;

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

-- Revoke all access from anonymous and public, only authenticated can view
REVOKE ALL ON public.winner_display FROM anon;
REVOKE ALL ON public.winner_display FROM public;
GRANT SELECT ON public.winner_display TO authenticated;

-- Fix #3: Ensure profiles table blocks anonymous access completely
-- Revoke any default permissions that might exist
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;