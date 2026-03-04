-- ==========================================
-- SCRIPT DE REINICIO TOTAL Y SEMILLA (ROBUSTO)
-- ==========================================
-- Este script borra todo y recrea la base de datos asegurando que los logins funcionen.

-- 1. LIMPIEZA TOTAL
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.planchas CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.media_items CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;

DELETE FROM auth.users;

-- 2. ESQUEMA
CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);

INSERT INTO public.grades (name, slug) VALUES
  ('Aprendiz', 'aprendiz'),
  ('Compañero', 'companero'),
  ('Maestro', 'maestro');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  grade_id uuid REFERENCES public.grades(id),
  role text NOT NULL DEFAULT 'student'
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, grade_id)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    (SELECT id FROM public.grades WHERE slug = COALESCE(NEW.raw_user_meta_data->>'grade_slug', 'aprendiz'))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  url text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_type text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.planchas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text NOT NULL,
  description text,
  date date NOT NULL,
  tags text[] DEFAULT '{}',
  resource_url text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planchas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Select Grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Users Select Own Profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin Select All Profiles" ON public.profiles FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Public Select Topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Admins CRUD Topics" ON public.topics FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Public Select Resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Admins CRUD Resources" ON public.resources FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Public Select Media" ON public.media_items FOR SELECT USING (true);
CREATE POLICY "Admins CRUD Media" ON public.media_items FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Public Select Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins CRUD Events" ON public.events FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Public Select Planchas" ON public.planchas FOR SELECT USING (true);
CREATE POLICY "Admins CRUD Planchas" ON public.planchas FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 3. SEMILLA
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  aprendiz_id uuid;
  companero_id uuid;
  maestro_id uuid;
  topic_id uuid;
  admin_uid uuid;
  admin_email text := 'admin@test.com';
  admin_name text := 'Administrador Test';
  pwd_hash text := crypt('caelum671', gen_salt('bf'));
BEGIN
  SELECT id INTO aprendiz_id FROM public.grades WHERE slug = 'aprendiz';
  SELECT id INTO companero_id FROM public.grades WHERE slug = 'companero';
  SELECT id INTO maestro_id FROM public.grades WHERE slug = 'maestro';

  -- Topics
  INSERT INTO public.topics (grade_id, title, description, "order")
  VALUES (aprendiz_id, 'Iniciación Literaria', 'El primer paso en el conocimiento.', 1)
  RETURNING id INTO topic_id;

  INSERT INTO public.resources (topic_id, title, description, type, url, "order")
  VALUES (topic_id, 'Guía del Recién Llegado', 'Documento base.', 'pdf', 'https://example.com/guia.pdf', 1);

  -- Events
  INSERT INTO public.events (grade_id, title, event_date, event_type)
  VALUES (aprendiz_id, 'Encuentro Mensual', CURRENT_DATE + 3, 'ritual');

  -- Planchas
  INSERT INTO public.planchas (grade_id, title, author, date, tags, resource_url, order_index)
  VALUES (aprendiz_id, 'La Piedra en Bruto', 'Hermano Inicial', '2026-03-01', ARRAY['filosofia', 'simbolismo'], 'https://example.com/plancha1', 1);

  -- Admin User
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    is_super_admin,
    phone_confirmed_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    admin_email,
    pwd_hash,
    now(),
    NULL,
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', admin_name, 'role', 'admin', 'grade_slug', 'maestro'),
    now(),
    now(),
    '',
    '',
    '',
    '',
    false,
    now()
  ) RETURNING id INTO admin_uid;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), admin_uid, jsonb_build_object('sub', admin_uid, 'email', admin_email, 'email_verified', true), 'email', admin_email, now(), now(), now());

  INSERT INTO public.profiles (id, full_name, role, grade_id)
  VALUES (admin_uid, admin_name, 'admin', maestro_id)
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, grade_id = EXCLUDED.grade_id;

  RAISE NOTICE 'Sistema reiniciado y sembrado con éxito total.';
END $$;
