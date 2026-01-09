-- Create a secure view for public winner display with anonymized data
CREATE OR REPLACE VIEW public.winner_display AS
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
WHERE EXISTS (
  SELECT 1 FROM public.raffles r 
  WHERE r.winner_id = p.id 
  AND r.status = 'CLOSED'
);

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.winner_display TO authenticated;
GRANT SELECT ON public.winner_display TO anon;

-- Add a comment explaining the view's purpose
COMMENT ON VIEW public.winner_display IS 'Anonymized winner information for public display. Only shows first name + last initial.';

-- Create a helper function to get winner display name securely
CREATE OR REPLACE FUNCTION public.get_winner_display_name(winner_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_name FROM public.winner_display WHERE id = winner_user_id;
$$;