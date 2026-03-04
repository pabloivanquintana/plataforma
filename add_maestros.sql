-- SCRIPT REPARADO PARA AGREGAR MAESTROS (LIMPIEZA Y RE-CREACIÓN)
-- Password: moabon

DO $$
DECLARE
  maestro_grade_id uuid;
  new_user_id uuid;
  pwd_hash text := crypt('moabon', gen_salt('bf'));
  
  -- Datos de los usuarios
  emails text[] := ARRAY['juanpaidon@caelum.com', 'manuelcrespo@caelum.com', 'matiassalas@caelum.com'];
  names text[] := ARRAY['Juan Pai Don', 'Manuel Crespo', 'Matias Salas'];
  i int;
BEGIN
  -- Obtener el ID del grado Maestro
  SELECT id INTO maestro_grade_id FROM public.grades WHERE slug = 'maestro';

  FOR i IN 1..3 LOOP
    -- 1. LIMPIEZA: Eliminar si ya existen para evitar estados inconsistentes
    -- El DELETE en auth.users borra en cascada perfiles e identidades
    DELETE FROM auth.users WHERE email = emails[i];

    -- 2. RE-CREACIÓN: Siguiendo EXACTAMENTE el patrón de seed_admins.sql
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

    -- 3. Al insertar en auth.users, el trigger 'handle_new_user' crea el perfil.
    --    Ahora lo configuramos correctamente como maestro (no admin).
    UPDATE public.profiles 
    SET 
      role = 'student', -- No es administrador
      grade_id = maestro_grade_id,
      full_name = names[i]
    WHERE id = new_user_id;
    
    RAISE NOTICE 'Maestro configurado correctamente: %', emails[i];
  END LOOP;
END $$;
