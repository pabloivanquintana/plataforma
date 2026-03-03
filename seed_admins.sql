-- Script para insertar los 3 Vigilantes (Admin) en Supabase
-- Ejecutar este script en el SQL EDITOR de Supabase

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  maestro_grade_id uuid;
  new_user_id uuid;
  -- Lista de correos y nombres
  emails text[] := ARRAY['pabloquintana@caelum.com', 'tomastiranti@caelum.com', 'luismonti@caelum.com'];
  names text[] := ARRAY['Pablo Quintana', 'Tomas Tiranti', 'Luis Monti'];
  pwd_hash text;
BEGIN
  -- 1. Obtener el ID del grado Maestro (máximo nivel para vigilantes)
  SELECT id INTO maestro_grade_id FROM public.grades WHERE slug = 'maestro';

  -- 2. Generar el hash de la contraseña 'caelum461' usando bcrypt (BF)
  -- Supabase Auth usa BF para las contraseñas
  pwd_hash := crypt('caelum461', gen_salt('bf'));

  -- 3. Bucle para insertar cada usuario
  FOR i IN 1..3 LOOP
    -- Insertar en auth.users (Tabla interna de Supabase)
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      emails[i],
      pwd_hash,
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', names[i]),
      now(),
      now(),
      '',
      ''
    ) RETURNING id INTO new_user_id;

    -- 4. El trigger 'handle_new_user' ya habrá creado un perfil básico.
    -- Lo actualizamos con el rol de admin y el grado de Maestro.
    UPDATE public.profiles 
    SET 
      role = 'admin',
      grade_id = maestro_grade_id,
      full_name = names[i]
    WHERE id = new_user_id;
    
    RAISE NOTICE 'Usuario creado: %', emails[i];
  END LOOP;
END $$;
