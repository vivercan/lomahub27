-- =====================================================
-- MIGRACIÓN V28 — Tablas nuevas para Arquitectura 9 Módulos
-- Fecha: 22/Mar/2026
-- Referencia: Notion página 35 (Arquitectura V28)
-- EJECUTAR EN: Supabase SQL Editor
-- =====================================================

-- ─── 1. COTIZACION_RUTAS (detalle de rutas por cotización) ───
CREATE TABLE IF NOT EXISTS cotizacion_rutas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  tipo_operacion TEXT NOT NULL CHECK (tipo_operacion IN ('NAC_MX','IMPO','EXPO','TRANSBORDO','DOM_USA','DTD')),
  distancia_km NUMERIC(10,2),
  distancia_millas NUMERIC(10,2),
  cruce TEXT,
  tarifa_tramo_mx NUMERIC(15,2) DEFAULT 0,
  tarifa_cruce NUMERIC(15,2) DEFAULT 0,
  tarifa_tramo_usa NUMERIC(15,2) DEFAULT 0,
  accesoriales_total NUMERIC(15,2) DEFAULT 0,
  subtotal NUMERIC(15,2) DEFAULT 0,
  moneda TEXT DEFAULT 'USD' CHECK (moneda IN ('MXN','USD')),
  hazmat BOOLEAN DEFAULT false,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_rutas_cotizacion ON cotizacion_rutas(cotizacion_id);

-- ─── 2. TARIFAS_MX (tarifas por km México) ───
CREATE TABLE IF NOT EXISTS tarifas_mx (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rango_km_min NUMERIC(10,2) NOT NULL,
  rango_km_max NUMERIC(10,2) NOT NULL,
  tarifa_por_km NUMERIC(10,4) NOT NULL,
  tipo_equipo TEXT DEFAULT 'seco' CHECK (tipo_equipo IN ('seco','refrigerado','plataforma','lowboy')),
  empresa TEXT,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Datos iniciales tarifas MX (referencia página 35: corta <500km = +20%)
INSERT INTO tarifas_mx (rango_km_min, rango_km_max, tarifa_por_km, tipo_equipo, descripcion) VALUES
  (0, 500, 36.00, 'seco', 'Corta distancia MX (+20% premium)'),
  (500, 2000, 30.00, 'seco', 'Larga distancia MX estándar'),
  (2000, 99999, 28.00, 'seco', 'Ultra larga distancia MX'),
  (0, 500, 42.00, 'refrigerado', 'Corta distancia MX refrigerado'),
  (500, 2000, 35.00, 'refrigerado', 'Larga distancia MX refrigerado'),
  (2000, 99999, 33.00, 'refrigerado', 'Ultra larga MX refrigerado');

-- ─── 3. TARIFAS_USA (tarifas por milla USA) ───
CREATE TABLE IF NOT EXISTS tarifas_usa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rango_millas_min NUMERIC(10,2) NOT NULL,
  rango_millas_max NUMERIC(10,2) NOT NULL,
  tarifa_por_milla NUMERIC(10,4) NOT NULL,
  tipo_equipo TEXT DEFAULT 'seco' CHECK (tipo_equipo IN ('seco','refrigerado','plataforma','lowboy')),
  empresa TEXT,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Datos iniciales tarifas USA (referencia página 35: corta <1000mi=$5.50, larga=$2.50)
INSERT INTO tarifas_usa (rango_millas_min, rango_millas_max, tarifa_por_milla, tipo_equipo, descripcion) VALUES
  (0, 500, 6.50, 'seco', 'Muy corta USA premium'),
  (500, 1000, 5.50, 'seco', 'Corta distancia USA'),
  (1000, 2500, 3.50, 'seco', 'Media distancia USA'),
  (2500, 99999, 2.50, 'seco', 'Larga distancia USA'),
  (0, 500, 7.50, 'refrigerado', 'Muy corta USA refrigerado'),
  (500, 1000, 6.50, 'refrigerado', 'Corta USA refrigerado'),
  (1000, 2500, 4.50, 'refrigerado', 'Media USA refrigerado'),
  (2500, 99999, 3.50, 'refrigerado', 'Larga USA refrigerado');

-- ─── 4. CRUCES (cruces fronterizos con precios) ───
CREATE TABLE IF NOT EXISTS cruces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  ciudad_mx TEXT NOT NULL,
  ciudad_usa TEXT NOT NULL,
  estado_mx TEXT,
  estado_usa TEXT,
  tarifa_cruce NUMERIC(15,2) NOT NULL DEFAULT 0,
  tarifa_cruce_hazmat NUMERIC(15,2) DEFAULT 0,
  tiempo_promedio_hrs NUMERIC(5,2) DEFAULT 4,
  restricciones TEXT,
  activo BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales cruces (referencia página 35)
INSERT INTO cruces (nombre, ciudad_mx, ciudad_usa, estado_mx, estado_usa, tarifa_cruce, tarifa_cruce_hazmat) VALUES
  ('Laredo', 'Nuevo Laredo', 'Laredo', 'Tamaulipas', 'Texas', 450.00, 650.00),
  ('Colombia', 'Colombia', 'Laredo', 'Nuevo León', 'Texas', 400.00, 600.00),
  ('McAllen/Reynosa', 'Reynosa', 'McAllen', 'Tamaulipas', 'Texas', 425.00, 625.00),
  ('Nogales', 'Nogales', 'Nogales', 'Sonora', 'Arizona', 500.00, 700.00),
  ('El Paso/Juárez', 'Ciudad Juárez', 'El Paso', 'Chihuahua', 'Texas', 475.00, 675.00),
  ('Tijuana/San Diego', 'Tijuana', 'San Diego', 'Baja California', 'California', 550.00, 750.00);

-- ─── 5. ACCESORIALES (catálogo ~40 conceptos editables) ───
CREATE TABLE IF NOT EXISTS accesoriales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  monto_default NUMERIC(15,2) DEFAULT 0,
  moneda TEXT DEFAULT 'USD' CHECK (moneda IN ('MXN','USD')),
  tipo TEXT DEFAULT 'fijo' CHECK (tipo IN ('fijo','por_hora','por_dia','porcentaje')),
  aplica_a TEXT DEFAULT 'todos' CHECK (aplica_a IN ('todos','impo','expo','nac','dedicado','usa')),
  activo BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales accesoriales comunes
INSERT INTO accesoriales (codigo, nombre, monto_default, moneda, tipo) VALUES
  ('STOPOFF', 'Stop Off / Parada adicional', 150.00, 'USD', 'fijo'),
  ('DEMORA_CARGA', 'Demora en carga (por hora)', 75.00, 'USD', 'por_hora'),
  ('DEMORA_DESCARGA', 'Demora en descarga (por hora)', 75.00, 'USD', 'por_hora'),
  ('DETENTION', 'Detention (por día)', 350.00, 'USD', 'por_dia'),
  ('LAYOVER', 'Layover / Pernocta', 250.00, 'USD', 'fijo'),
  ('ESCORT', 'Escolta de seguridad', 500.00, 'USD', 'fijo'),
  ('TEAM_DRIVER', 'Team driver (doble operador)', 800.00, 'USD', 'fijo'),
  ('LUMPER', 'Lumper / Descarga manual', 200.00, 'USD', 'fijo'),
  ('PALLET_JACK', 'Pallet jack eléctrico', 100.00, 'USD', 'fijo'),
  ('INSPECCION_USDA', 'Inspección USDA', 125.00, 'USD', 'fijo'),
  ('INSPECCION_FDA', 'Inspección FDA', 150.00, 'USD', 'fijo'),
  ('FUMIGACION', 'Fumigación', 180.00, 'USD', 'fijo'),
  ('SEGURO_EXTRA', 'Seguro adicional de carga', 0.00, 'USD', 'porcentaje'),
  ('TARP', 'Lona / Tarp', 100.00, 'USD', 'fijo'),
  ('CHAINS', 'Cadenas / Straps extra', 75.00, 'USD', 'fijo'),
  ('OVERWEIGHT', 'Sobrepeso permiso', 300.00, 'USD', 'fijo'),
  ('OVERSIZE', 'Sobredimensión permiso', 500.00, 'USD', 'fijo'),
  ('PRE_COOL', 'Pre-enfriamiento refrigerado', 150.00, 'USD', 'fijo'),
  ('TEMP_RECORDER', 'Registrador de temperatura', 50.00, 'USD', 'fijo'),
  ('BOB_TAIL', 'Movimiento bob tail', 200.00, 'USD', 'fijo'),
  ('CROSSDOCK', 'Crossdock / Transloading', 350.00, 'USD', 'fijo'),
  ('STORAGE', 'Almacenaje (por día)', 100.00, 'USD', 'por_dia'),
  ('REEFER_FUEL', 'Combustible reefer surcharge', 125.00, 'USD', 'fijo'),
  ('TOLL_SURCHARGE', 'Casetas / Toll surcharge', 0.00, 'MXN', 'fijo'),
  ('HAZMAT_FEE', 'Hazmat handling fee', 250.00, 'USD', 'fijo');

-- ─── 6. VACIOS_REPOSICIONES (lógica de vacíos por estado) ───
CREATE TABLE IF NOT EXISTS vacios_reposiciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estado_origen TEXT NOT NULL,
  base_operativa TEXT NOT NULL,
  distancia_km NUMERIC(10,2),
  costo_reposicion NUMERIC(15,2) DEFAULT 0,
  tiempo_estimado_hrs NUMERIC(5,2),
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. PRESUPUESTOS_CLIENTE (presupuestos por empresa/segmento/cliente) ───
CREATE TABLE IF NOT EXISTS presupuestos_cliente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  empresa TEXT,
  segmento TEXT,
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  meta_viajes INTEGER DEFAULT 0,
  meta_monto NUMERIC(15,2) DEFAULT 0,
  moneda TEXT DEFAULT 'MXN' CHECK (moneda IN ('MXN','USD')),
  real_viajes INTEGER DEFAULT 0,
  real_monto NUMERIC(15,2) DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente ON presupuestos_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_anio_mes ON presupuestos_cliente(anio, mes);

-- ─── 8. TICKETS (sistema de quejas/sugerencias) ───
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  viaje_id UUID REFERENCES viajes(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('queja','sugerencia','incidencia','solicitud')),
  prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja','media','alta','urgente')),
  asunto TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto','en_proceso','pendiente_cliente','resuelto','cerrado')),
  asignado_a UUID REFERENCES auth.users(id),
  creado_por UUID REFERENCES auth.users(id),
  fecha_limite TIMESTAMPTZ,
  fecha_resolucion TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_cliente ON tickets(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_asignado ON tickets(asignado_a);

-- ─── 9. DOCUMENTOS (repositorio de archivos) ───
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT CHECK (categoria IN ('contrato','poliza','sct','formato','plantilla','cotizacion','factura','otro')),
  archivo_url TEXT NOT NULL,
  archivo_nombre TEXT,
  archivo_size INTEGER,
  mime_type TEXT,
  cliente_id UUID REFERENCES clientes(id),
  viaje_id UUID REFERENCES viajes(id),
  subido_por UUID REFERENCES auth.users(id),
  permisos TEXT DEFAULT 'todos' CHECK (permisos IN ('todos','admin','cs','ventas','operaciones')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_categoria ON documentos(categoria);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente ON documentos(cliente_id);

-- ─── 10. ALTA_CLIENTES (proceso 5 estados) ───
CREATE TABLE IF NOT EXISTS alta_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token UUID DEFAULT uuid_generate_v4() UNIQUE,
  lead_id UUID REFERENCES leads(id),
  cliente_id UUID REFERENCES clientes(id),
  estado TEXT DEFAULT 'ENVIADA' CHECK (estado IN ('ENVIADA','PENDIENTE_CSR','PENDIENTE_CXC','PENDIENTE_CONFIRMACION','COMPLETADA','RECHAZADA')),
  -- Datos empresa
  razon_social TEXT,
  rfc TEXT,
  direccion_fiscal TEXT,
  regimen_fiscal TEXT,
  -- Documentos IA-validados
  constancia_fiscal_url TEXT,
  constancia_fiscal_valida BOOLEAN,
  ine_url TEXT,
  ine_valida BOOLEAN,
  acta_constitutiva_url TEXT,
  acta_valida BOOLEAN,
  caratula_bancaria_url TEXT,
  caratula_valida BOOLEAN,
  -- Asignaciones
  csr_asignada UUID REFERENCES auth.users(id),
  cxc_asignado UUID REFERENCES auth.users(id),
  vendedor_id UUID REFERENCES auth.users(id),
  -- Firma digital
  firma_ip TEXT,
  firma_hash TEXT,
  firma_timestamp TIMESTAMPTZ,
  firma_user_agent TEXT,
  -- Tracking
  notas_rechazo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alta_clientes_token ON alta_clientes(token);
CREATE INDEX IF NOT EXISTS idx_alta_clientes_estado ON alta_clientes(estado);

-- ─── 11. COTIZACIONES UPDATE (agregar campos cross-border) ───
-- Solo agregar columnas si no existen
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cotizaciones' AND column_name='tipo_operacion') THEN
    ALTER TABLE cotizaciones ADD COLUMN tipo_operacion TEXT CHECK (tipo_operacion IN ('NAC_MX','IMPO','EXPO','TRANSBORDO','DOM_USA','DTD'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cotizaciones' AND column_name='moneda') THEN
    ALTER TABLE cotizaciones ADD COLUMN moneda TEXT DEFAULT 'USD' CHECK (moneda IN ('MXN','USD'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cotizaciones' AND column_name='total') THEN
    ALTER TABLE cotizaciones ADD COLUMN total NUMERIC(15,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cotizaciones' AND column_name='hazmat') THEN
    ALTER TABLE cotizaciones ADD COLUMN hazmat BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cotizaciones' AND column_name='pdf_url') THEN
    ALTER TABLE cotizaciones ADD COLUMN pdf_url TEXT;
  END IF;
END $$;

-- ─── 12. RLS POLICIES para tablas nuevas ───
ALTER TABLE cotizacion_rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas_mx ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas_usa ENABLE ROW LEVEL SECURITY;
ALTER TABLE cruces ENABLE ROW LEVEL SECURITY;
ALTER TABLE accesoriales ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacios_reposiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alta_clientes ENABLE ROW LEVEL SECURITY;

-- Policies: lectura para autenticados, escritura para admin
CREATE POLICY "Lectura autenticados" ON cotizacion_rutas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura admin" ON cotizacion_rutas FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Lectura autenticados" ON tarifas_mx FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura admin" ON tarifas_mx FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Lectura autenticados" ON tarifas_usa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura admin" ON tarifas_usa FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Lectura autenticados" ON cruces FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura admin" ON cruces FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Lectura autenticados" ON accesoriales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura admin" ON accesoriales FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Lectura autenticados" ON vacios_reposiciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura admin" ON vacios_reposiciones FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Lectura autenticados" ON presupuestos_cliente FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura admin" ON presupuestos_cliente FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Lectura autenticados" ON tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura usuarios" ON tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update asignado" ON tickets FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Lectura autenticados" ON documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura usuarios" ON documentos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Lectura publica" ON alta_clientes FOR SELECT USING (true);
CREATE POLICY "Escritura publica" ON alta_clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Update publico" ON alta_clientes FOR UPDATE USING (true);

-- =====================================================
-- FIN MIGRACIÓN V28
-- Ejecutar en Supabase SQL Editor como superadmin
-- =====================================================
