-- Grant SELECT permission on public_raffles view to all users (including anonymous)
GRANT SELECT ON public.public_raffles TO anon, authenticated;