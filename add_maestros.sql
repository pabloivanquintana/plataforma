-- SCRIPT DEFINITIVO PARA AGREGAR MAESTROS (BORRADO Y RE-CREACIÓN COMPLETA)
-- Esto soluciona el Error 500 al asegurar que existan las identidades y todas las columnas de auth.
-- Password: moabon

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    -- 1. LIMPIEZA: Eliminar si ya existen (borra cascada perfiles e identidades)
    DELETE FROM auth.users WHERE email = emails[i];

    -- 2. INSERTAR EN AUTH.USERS (Con todas las columnas del fix_profiles_v3.sql)
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, recovery_sent_at, last_sign_in_at, 
      raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, 
      email_change, email_change_token_new, recovery_token, 
      is_super_admin, phone_confirmed_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      emails[i],
      pwd_hash,
      now(),
      NULL,
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', names[i], 'role', 'student', 'grade_slug', 'maestro'),
      now(),
      now(),
      '',
      '',
      '',
      '',
      false,
      now()
    );

    -- 3. INSERTAR IDENTIDAD (Crucial para evitar Error 500 en el login)
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), 
      new_user_id, 
      jsonb_build_object('sub', new_user_id, 'email', emails[i], 'email_verified', true), 
      'email', 
      emails[i], 
      now(), 
      now(), 
      now()
    );

    -- 4. El trigger 'handle_new_user' ya insertó el perfil.
    --    Lo actualizamos para asegurar que tenga el grado correcto.
    UPDATE public.profiles 
    SET 
      role = 'student',
      grade_id = maestro_grade_id,
      full_name = names[i]
    WHERE id = new_user_id;
    
    RAISE NOTICE 'Maestro creado y vinculado: %', emails[i];
  END LOOP;
END $$;
