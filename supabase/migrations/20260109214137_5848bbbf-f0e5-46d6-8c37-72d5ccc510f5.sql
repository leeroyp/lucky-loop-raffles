-- Drop the security definer function as we'll use the view directly
DROP FUNCTION IF EXISTS public.get_winner_display_name(uuid);