-- Fix the view to use security_invoker (runs with caller's permissions, respects RLS)
ALTER VIEW public.winner_display SET (security_invoker = true);