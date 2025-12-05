-- Create enums for roles, raffle status, and entry source
CREATE TYPE public.app_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE public.raffle_status AS ENUM ('DRAFT', 'LIVE', 'CLOSED');
CREATE TYPE public.entry_source AS ENUM ('SUBSCRIPTION', 'NPN');
CREATE TYPE public.subscription_tier AS ENUM ('BRONZE', 'SILVER', 'GOLD');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_tier subscription_tier,
  entries_remaining INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create raffles table
CREATE TABLE public.raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status raffle_status NOT NULL DEFAULT 'DRAFT',
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  seed TEXT NOT NULL,
  seed_hash TEXT NOT NULL,
  draw_hash TEXT,
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create entries table
CREATE TABLE public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source entry_source NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_logs table for tracking events
CREATE TABLE public.event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- Raffles policies - everyone can view LIVE and CLOSED raffles
CREATE POLICY "Anyone can view live and closed raffles"
  ON public.raffles FOR SELECT
  USING (status IN ('LIVE', 'CLOSED'));

CREATE POLICY "Admins can view all raffles"
  ON public.raffles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can create raffles"
  ON public.raffles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can update raffles"
  ON public.raffles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- Entries policies
CREATE POLICY "Users can view their own entries"
  ON public.entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create entries"
  ON public.entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all entries"
  ON public.entries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- Event logs - only admins
CREATE POLICY "Admins can view event logs"
  ON public.event_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can create event logs"
  ON public.event_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Assign default USER role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'USER');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_raffles_updated_at
  BEFORE UPDATE ON public.raffles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();