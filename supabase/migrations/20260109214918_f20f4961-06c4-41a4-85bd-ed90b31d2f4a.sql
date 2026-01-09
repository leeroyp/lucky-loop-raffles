-- Create a secure view for public raffle access that hides seed until draw is complete
CREATE OR REPLACE VIEW public.public_raffles WITH (security_invoker = true) AS
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
  seed_hash,  -- Always show the committed hash for verification
  -- Only reveal seed and draw_hash after raffle is CLOSED with a winner
  CASE 
    WHEN status = 'CLOSED' AND winner_id IS NOT NULL THEN seed
    ELSE NULL
  END as seed,
  CASE 
    WHEN status = 'CLOSED' AND winner_id IS NOT NULL THEN draw_hash
    ELSE NULL
  END as draw_hash
FROM public.raffles
WHERE status IN ('LIVE', 'CLOSED');

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public.public_raffles TO authenticated;
GRANT SELECT ON public.public_raffles TO anon;

-- Add comment explaining the view
COMMENT ON VIEW public.public_raffles IS 'Public-facing view of raffles that hides the cryptographic seed until the draw is complete to prevent manipulation.';