-- Agregar la columna 'code' para servicios
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS code TEXT;

-- Crear un índice para búsquedas rápidas por código
CREATE INDEX IF NOT EXISTS services_code_idx ON public.services(code);

-- Actualizar los servicios existentes con códigos
UPDATE public.services 
SET code = '1' 
WHERE name ILIKE '%bancarios%' AND code IS NULL;

UPDATE public.services 
SET code = '2' 
WHERE name ILIKE '%deportivos%' AND code IS NULL;

UPDATE public.services 
SET code = '3' 
WHERE name ILIKE '%conciertos%' AND code IS NULL;

UPDATE public.services 
SET code = '4' 
WHERE name ILIKE '%gubernamentales%' AND code IS NULL;

UPDATE public.services 
SET code = '5' 
WHERE name ILIKE '%públicos%' AND code IS NULL;

-- Insertar servicios si no existen
INSERT INTO public.services (name, description, category, code)
SELECT 'Trámites bancarios', 'Representación para gestiones en entidades bancarias y financieras', 'Trámites', '1'
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE code = '1');

INSERT INTO public.services (name, description, category, code)
SELECT 'Eventos deportivos', 'Representación para adquisición de entradas a eventos deportivos', 'Eventos', '2'
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE code = '2');

INSERT INTO public.services (name, description, category, code)
SELECT 'Conciertos', 'Representación para adquisición de entradas a conciertos y espectáculos', 'Eventos', '3'
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE code = '3');

INSERT INTO public.services (name, description, category, code)
SELECT 'Trámites gubernamentales', 'Representación para gestiones en entidades gubernamentales', 'Trámites', '4'
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE code = '4');

INSERT INTO public.services (name, description, category, code)
SELECT 'Servicios públicos', 'Representación para gestiones relacionadas con servicios públicos', 'Trámites', '5'
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE code = '5'); 