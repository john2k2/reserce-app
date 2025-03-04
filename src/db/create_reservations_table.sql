-- Crear la tabla de servicios primero (necesaria para las reservas)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear la tabla de reservas
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  queuer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  details TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  client_rating INTEGER,
  client_review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS reservations_client_id_idx ON public.reservations(client_id);
CREATE INDEX IF NOT EXISTS reservations_queuer_id_idx ON public.reservations(queuer_id);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON public.reservations(status);
CREATE INDEX IF NOT EXISTS reservations_date_idx ON public.reservations(date);

-- Configurar políticas de seguridad (RLS)
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla de servicios
CREATE POLICY "Servicios visibles para todos" ON public.services
  FOR SELECT USING (true);

-- Políticas para la tabla de reservas
CREATE POLICY "Reservas visibles para clientes" ON public.reservations
  FOR SELECT TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = client_id
  ));

CREATE POLICY "Reservas visibles para representantes" ON public.reservations
  FOR SELECT TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = queuer_id
  ));

CREATE POLICY "Clientes pueden crear reservas" ON public.reservations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = client_id
  ));

CREATE POLICY "Representantes pueden actualizar reservas" ON public.reservations
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = queuer_id
  ));

-- Función para actualizar el timestamp de actualización
CREATE OR REPLACE FUNCTION update_reservations_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp automáticamente
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION update_reservations_updated_at_column(); 