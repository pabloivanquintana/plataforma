-- SCRIPT PARA ARREGLAR PERFILES (V3.1 - FIX GENERATED COLUMNS)
-- Este script borra y recrea los usuarios usando EXACTAMENTE las columnas del seed.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  maestro_id uuid;
  companero_id uuid;
  new_user_id uuid;
  user_email text;
  user_full_name text;
  user_role text;
  user_grade_slug text;
  user_grade_id uuid;
  user_password_hash text;
  
  -- Array de usuarios a procesar
  users_data text[][] := ARRAY[
    ['pabloquintana@caelum.com', 'Pablo Quintana', 'admin', 'maestro', 'caelum671'],
    ['diegoobregon@caelum.com', 'Diego Obregon', 'student', 'companero', 'jakin'],
    ['rodrigocortiglia@caelum.com', 'Rodrigo Cortiglia', 'student', 'companero', 'jakin'],
    ['federicotorres@caelum.com', 'Federico Torres', 'student', 'companero', 'jakin'],
    ['werfilibañez@caelum.com', 'Werfil Ibañez', 'student', 'companero', 'jakin'],
    ['stefanocordoba@caelum.com', 'Stefano Cordoba', 'student', 'companero', 'jakin']
  ];
  
  i integer;
BEGIN
  -- Obtener IDs de grados
  SELECT id INTO maestro_id FROM public.grades WHERE slug = 'maestro';
  SELECT id INTO companero_id FROM public.grades WHERE slug = 'companero';

  FOR i IN 1..array_length(users_data, 1) LOOP
    user_email := users_data[i][1];
    user_full_name := users_data[i][2];
    user_role := users_data[i][3];
    user_grade_slug := users_data[i][4];
    user_password_hash := crypt(users_data[i][5], gen_salt('bf'));
    
    -- Determinar ID de grado
    IF user_grade_slug = 'maestro' THEN
      user_grade_id := maestro_id;
    ELSE
      user_grade_id := companero_id;
    END IF;

    -- LIMPIEZA TOTAL PARA ESTE EMAIL
    DELETE FROM auth.users WHERE email = user_email;

    -- INSERTAR USUARIO (Mismo listado que full_reset_and_seed.sql)
    new_user_id := gen_random_uuid();
    
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
      new_user_id,
      'authenticated',
      'authenticated',
      user_email,
      user_password_hash,
      now(),
      NULL,
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', user_full_name, 'role', user_role, 'grade_slug', user_grade_slug),
      now(),
      now(),
      '',
      '',
      '',
      '',
      false,
      now()
    );

    -- INSERTAR IDENTIDAD
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), 
      new_user_id, 
      jsonb_build_object('sub', new_user_id, 'email', user_email, 'email_verified', true), 
      'email', 
      user_email, 
      now(), 
      now(), 
      now()
    );

    -- INSERTAR PERFIL
    INSERT INTO public.profiles (id, full_name, role, grade_id)
    VALUES (new_user_id, user_full_name, user_role, user_grade_id)
    ON CONFLICT (id) DO UPDATE SET 
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      grade_id = EXCLUDED.grade_id;

    RAISE NOTICE 'Procesado: % (%)', user_full_name, user_email;
  END LOOP;

  RAISE NOTICE 'Fix aplicado con éxito.';
END $$;
