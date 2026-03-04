-- SCRIPT PARA ACTUALIZAR CONTRASEÑAS A 'jakin'
-- Ejecutar este script en el SQL Editor de Supabase

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  target_emails text[] := ARRAY[
    'diegoobregon@caelum.com',
    'rodrigocortiglia@caelum.com',
    'federicotorres@caelum.com',
    'werfilibañez@caelum.com',
    'stefanocordoba@caelum.com'
  ];
  new_pwd_hash text := crypt('jakin', gen_salt('bf'));
  target_email text;
BEGIN
  FOREACH target_email IN ARRAY target_emails LOOP
    UPDATE auth.users 
    SET 
      encrypted_password = new_pwd_hash,
      updated_at = now()
    WHERE auth.users.email = target_email;
    
    RAISE NOTICE 'Password actualizada para: %', target_email;
  END LOOP;
END $$;
