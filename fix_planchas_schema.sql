-- SCRIPT PARA HACER OPCIONAL EL ORDEN EN PLANCHAS
-- Permite guardar planchas sin especificar un orden manual.

ALTER TABLE public.planchas ALTER COLUMN order_index DROP NOT NULL;
ALTER TABLE public.planchas ALTER COLUMN order_index SET DEFAULT NULL;
