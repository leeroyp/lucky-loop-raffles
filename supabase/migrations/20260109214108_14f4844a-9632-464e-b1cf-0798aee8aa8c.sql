-- Drop and recreate the view without SECURITY DEFINER
-- The view itself doesn't need SECURITY DEFINER - only the function does
DROP VIEW IF EXISTS public.winner_display;

-- Recreate as a simple view (not security definer)
CREATE VIEW public.winner_display AS
SELECT 
  p.id,
  CASE 
    WHEN p.full_name IS NOT NULL AND p.full_name != '' THEN
      split_part(p.full_name, ' ', 1) || 
      CASE 
        WHEN split_part(p.full_name, ' ', 2) != '' 
        THEN ' ' || left(split_part(p.full_name, ' ', 2), 1) || '.'
        ELSE ''
      END
    ELSE
      split_part(p.email, '@', 1)
  END as display_name
FROM public.profiles p
INNER JOIN public.raffles r ON r.winner_id = p.id AND r.status = 'CLOSED';

-- Grant access
GRANT SELECT ON public.winner_display TO authenticated;
GRANT SELECT ON public.winner_display TO anon;