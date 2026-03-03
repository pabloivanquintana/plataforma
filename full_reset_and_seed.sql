-- ==========================================
-- SCRIPT DE REINICIO TOTAL Y SEMILLA (ROBUSTO)
-- ==========================================
-- Este script borra todo y recrea la base de datos asegurando que los logins funcionen.

-- 1. LIMPIEZA TOTAL
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.media_items CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;

-- Limpiar TODOS los usuarios previos para empezar de cero
DELETE FROM auth.users;

-- 2. ESQUEMA
CREATE TABLE public.grades (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);

INSERT INTO public.grades (name, slug) VALUES
  ('Aprendiz',  'aprendiz'),
  ('Compañero', 'companero'),
  ('Maestro',   'maestro');

CREATE TABLE public.profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  grade_id  uuid REFERENCES public.grades(id),
  role      text NOT NULL DEFAULT 'student'
);

-- Trigger mejorado para perfiles
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tablas de contenido
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

-- RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Select Grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Users Select Own Profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- FIX: Evitar recursión infinita usando el JWT metadata en lugar de consultar la propia tabla profiles
CREATE POLICY "Admin Select All Profiles" ON public.profiles FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Public Select Topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Public Select Resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Public Select Media" ON public.media_items FOR SELECT USING (true);
CREATE POLICY "Public Select Events" ON public.events FOR SELECT USING (true);

-- Permisos de esquema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- 3. SEMILLA DE CONTENIDO Y VIGILANTES
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  aprendiz_id uuid;
  companero_id uuid;
  maestro_id uuid;
  topic_id uuid;
  new_uid uuid;
  admin_email text := 'admin@test.com';
  admin_name text := 'Administrador Test';
  pwd_hash text := crypt('caelum671', gen_salt('bf'));
BEGIN
  -- Obtener IDs de grados
  SELECT id INTO aprendiz_id FROM public.grades WHERE slug = 'aprendiz';
  SELECT id INTO companero_id FROM public.grades WHERE slug = 'companero';
  SELECT id INTO maestro_id FROM public.grades WHERE slug = 'maestro';

  -- A. TEMAS Y RECURSOS
  -- Tema 1
  INSERT INTO public.topics (grade_id, title, description, "order")
  VALUES (aprendiz_id, 'Introducción al Primer Grado', 'Conceptos fundamentales del inicio del camino.', 1)
  RETURNING id INTO topic_id;

  INSERT INTO public.resources (topic_id, title, description, type, url, "order")
  VALUES 
    (topic_id, 'Manual del Aprendiz', 'Guía de estudio oficial.', 'pdf', 'https://example.com/manual-aprendiz.pdf', 1),
    (topic_id, 'Video: El Primer Paso', 'Audiovisual introductorio.', 'video', 'https://youtube.com/watch?v=123', 2);

  -- Tema 2
  INSERT INTO public.topics (grade_id, title, description, "order")
  VALUES (aprendiz_id, 'Simbología y Herramientas', 'Estudio de los símbolos básicos.', 2)
  RETURNING id INTO topic_id;

  INSERT INTO public.resources (topic_id, title, description, type, url, "order")
  VALUES 
    (topic_id, 'Plancha de Arquitectura', 'Estudio sobre la piedra bruta.', 'pdf', 'https://example.com/simbolos.pdf', 1);

  -- B. EXHIBICIÓN (BIBLIOTECA)
  INSERT INTO public.media_items (grade_id, title, description, type, url)
  VALUES 
    (aprendiz_id, 'Documental: Historia de la Orden', 'Relato sobre los orígenes.', 'video', 'https://example.com/video1'),
    (companero_id, 'Conferencia: El Segundo Grado', 'Análisis profundo.', 'video', 'https://example.com/video2'),
    (aprendiz_id, 'Libro: Ritos y Costumbres', 'Referencia histórica.', 'pdf', 'https://example.com/pdf1');

  -- C. EVENTOS (CALENDARIO)
  INSERT INTO public.events (grade_id, title, description, event_date, event_type)
  VALUES 
    (aprendiz_id, 'Tenida Ordinaria de Aprendices', 'Trabajo especial mensual.', CURRENT_DATE + interval '2 days', 'ritual'),
    (maestro_id, 'Junta de Dignatarios', 'Reunión de planificación.', CURRENT_DATE + interval '5 days', 'general'),
    (aprendiz_id, 'Taller de Instrucción', 'Formación para Hermanos.', CURRENT_DATE + interval '7 days', 'taller');

  -- D. VIGILANTE (ADMIN)
  -- 1. Crear usuario en auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, 
    confirmation_token, recovery_token, email_change_token_new, email_change,
    is_super_admin, phone_confirmed_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    admin_email,
    pwd_hash,
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', admin_name, 'role', 'admin', 'grade_slug', 'maestro'),
    now(),
    now(),
    '', '', '', '', false, now()
  ) RETURNING id INTO new_uid;

  -- 2. Crear la identidad en auth.identities
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_uid, jsonb_build_object('sub', new_uid, 'email', admin_email, 'email_verified', true), 'email', admin_email, now(), now(), now());

  -- 3. Crear o actualizar el perfil
  INSERT INTO public.profiles (id, full_name, role, grade_id)
  VALUES (new_uid, admin_name, 'admin', maestro_id)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    grade_id = EXCLUDED.grade_id;

  RAISE NOTICE 'Admin, Contenido y Perfil procesados con ÉXITO.';
END $$;
