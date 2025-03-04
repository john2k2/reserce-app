-- Eliminar la política existente para inserción
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON public.profiles;

-- Crear una nueva política que permita la inserción desde la API
CREATE POLICY "Permitir inserción de perfiles" ON public.profiles
  FOR INSERT TO authenticated, anon, service_role
  WITH CHECK (true);

-- Opcional: Si quieres mantener la seguridad pero permitir la inserción desde la API
-- CREATE POLICY "Permitir inserción de perfiles" ON public.profiles
--   FOR INSERT TO authenticated, anon, service_role
--   WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon');

-- Asegurarse de que la política de selección también permite a usuarios anónimos
DROP POLICY IF EXISTS "Perfiles visibles para todos" ON public.profiles;
CREATE POLICY "Perfiles visibles para todos" ON public.profiles
  FOR SELECT TO authenticated, anon, service_role
  USING (true); 