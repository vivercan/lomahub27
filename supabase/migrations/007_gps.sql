-- 007: GPS Tracking
CREATE TABLE gps_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  economico TEXT NOT NULL UNIQUE,
  empresa TEXT,
  segmento TEXT,
  latitud NUMERIC(10,6),
  longitud NUMERIC(10,6),
  velocidad NUMERIC(6,2) DEFAULT 0,
  ubicacion TEXT,
  estatus TEXT,
  ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  estado_geo TEXT,
  municipio_geo TEXT
);

CREATE INDEX idx_gps_economico ON gps_tracking(economico);
CREATE INDEX idx_gps_empresa ON gps_tracking(empresa);
CREATE INDEX idx_gps_segmento ON gps_tracking(segmento);

CREATE TABLE gps_historial (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  economico TEXT NOT NULL,
  latitud NUMERIC(10,6),
  longitud NUMERIC(10,6),
  velocidad NUMERIC(6,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gps_hist_economico ON gps_historial(economico);
CREATE INDEX idx_gps_hist_timestamp ON gps_historial(timestamp);
