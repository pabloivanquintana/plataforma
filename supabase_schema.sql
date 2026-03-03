-- Esquema de Base de Datos para Plataforma Caelum 671

-- 1. Tabla grades
CREATE TABLE public.grades (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);

INSERT INTO public.grades (name, slug) VALUES
  ('Aprendiz',  'aprendiz'),
  ('Compañero', 'companero'),
  ('Maestro',   'maestro');

-- 2. Tabla profiles
CREATE TABLE public.profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  grade_id  uuid REFERENCES public.grades(id),
  role      text NOT NULL DEFAULT 'student'
);

-- Trigger para perfiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Tabla topics
CREATE TABLE public.topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id    uuid NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  "order"     integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- 4. Tabla resources
CREATE TABLE public.resources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id    uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  type        text NOT NULL,
  url         text NOT NULL,
  "order"     integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- 5. Tabla media_items
CREATE TABLE public.media_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id    uuid NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  type        text NOT NULL,
  url         text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- 6. Tabla events
CREATE TABLE public.events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id    uuid NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  event_date  date NOT NULL,
  event_type  text NOT NULL DEFAULT 'general',
  created_at  timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.grades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events      ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (puedes refinarlas en el Dashboard de Supabase)
CREATE POLICY "Public Select Grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Users Select Own Profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public Select Topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Public Select Resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Public Select Media" ON public.media_items FOR SELECT USING (true);
CREATE POLICY "Public Select Events" ON public.events FOR SELECT USING (true);

-- Nota: Para administración completa, se recomienda usar el dashboard de Supabase 
-- o agregar políticas específicas de 'admin' basadas en la columna profiles.role.
