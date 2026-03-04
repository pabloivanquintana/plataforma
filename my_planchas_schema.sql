-- SCRIPT PARA HABILITAR "MIS PLANCHAS"
-- Permite que los hermanos suban y gestionen sus propios trabajos.

-- 1. Añadir columna de propietario
ALTER TABLE public.planchas ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Actualizar políticas de RLS
-- La política existente "Admins CRUD Planchas" ya cubre a los administradores.
-- Añadimos una nueva para que los usuarios gestionen las suyas:

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'planchas' AND policyname = 'Users Manage Own Planchas'
    ) THEN
        CREATE POLICY "Users Manage Own Planchas" ON public.planchas
        FOR ALL TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
