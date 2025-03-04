-- Crear extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar los esquemas
CREATE SCHEMA IF NOT EXISTS public;

-- Perfiles (extiende la tabla auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'queuer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  city TEXT,
  address TEXT,
  
  -- Campos específicos para representantes (queuers)
  speciality TEXT,
  rating DECIMAL(3,2),
  completed_queues INTEGER DEFAULT 0,
  availability TEXT[], -- días/horas disponibles como array
  rate_per_hour DECIMAL(10,2),
  description TEXT,
  is_verified BOOLEAN DEFAULT FALSE
);

-- Índice para búsqueda de representantes
CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS profiles_city_idx ON public.profiles(city);
CREATE INDEX IF NOT EXISTS profiles_speciality_idx ON public.profiles(speciality);

-- Servicios
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  average_time INTEGER, -- en minutos
  price_range TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reservas
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  queuer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT NOT NULL,
  details TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Campos para seguimiento
  current_position INTEGER,
  estimated_wait_time INTEGER, -- en minutos
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_review TEXT,
  queuer_notes TEXT
);

-- Índices para consultas comunes
CREATE INDEX IF NOT EXISTS reservations_client_id_idx ON public.reservations(client_id);
CREATE INDEX IF NOT EXISTS reservations_queuer_id_idx ON public.reservations(queuer_id);
CREATE INDEX IF NOT EXISTS reservations_date_idx ON public.reservations(date);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON public.reservations(status);

-- Mensajes
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS messages_reservation_id_idx ON public.messages(reservation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON public.messages(recipient_id);

-- Funciones y triggers

-- Trigger para actualizar el campo updated_at en reservations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar el completed_queues cuando se completa una reserva
CREATE OR REPLACE FUNCTION increment_completed_queues()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.profiles 
    SET completed_queues = completed_queues + 1
    WHERE id = NEW.queuer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_completed_queues
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION increment_completed_queues();

-- Trigger para actualizar el rating del queuer cuando recibe una valoración
CREATE OR REPLACE FUNCTION update_queuer_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  IF NEW.client_rating IS NOT NULL AND 
     (OLD.client_rating IS NULL OR OLD.client_rating != NEW.client_rating) THEN
    
    -- Calcular el nuevo rating promedio
    SELECT AVG(client_rating)::DECIMAL(3,2) INTO avg_rating
    FROM public.reservations
    WHERE queuer_id = NEW.queuer_id AND client_rating IS NOT NULL;
    
    -- Actualizar el rating del queuer
    UPDATE public.profiles 
    SET rating = avg_rating
    WHERE id = NEW.queuer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_queuer_rating
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION update_queuer_rating();

-- Políticas de seguridad basadas en Row Level Security (RLS)

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles
CREATE POLICY "Perfiles públicos visibles para todos"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Los usuarios pueden editar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para servicios
CREATE POLICY "Servicios visibles para todos"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Solo administradores pueden modificar servicios"
  ON public.services FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Políticas para reservas
CREATE POLICY "Los usuarios pueden ver sus propias reservas"
  ON public.reservations FOR SELECT
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR
    queuer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Los clientes pueden crear reservas"
  ON public.reservations FOR INSERT
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Los usuarios pueden actualizar sus propias reservas"
  ON public.reservations FOR UPDATE
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR
    queuer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Políticas para mensajes
CREATE POLICY "Los usuarios pueden ver mensajes donde son remitentes o destinatarios"
  ON public.messages FOR SELECT
  USING (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR
    recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Los usuarios pueden enviar mensajes"
  ON public.messages FOR INSERT
  USING (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Los destinatarios pueden marcar mensajes como leídos"
  ON public.messages FOR UPDATE
  USING (
    recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND
    (OLD.read = FALSE AND NEW.read = TRUE) -- Solo permitir cambiar de no leído a leído
    AND
    (OLD.content = NEW.content) -- No permitir modificar el contenido
  );

-- Datos de ejemplo (opcional)

-- Insertar algunos servicios de ejemplo
INSERT INTO public.services (name, description, category, average_time, price_range)
VALUES
('Trámites bancarios', 'Servicio de representación para trámites en bancos y entidades financieras', 'Trámites', 120, '$10-30'),
('Eventos deportivos', 'Servicio de fila para compra de entradas a eventos deportivos', 'Eventos', 180, '$15-40'),
('Conciertos', 'Servicio de fila para compra de entradas a conciertos', 'Eventos', 240, '$20-50'),
('Trámites gubernamentales', 'Servicio de representación para trámites en oficinas gubernamentales', 'Trámites', 180, '$15-45'),
('Servicios públicos', 'Representación para trámites de servicios públicos', 'Servicios', 90, '$10-25'); 