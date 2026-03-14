-- 001: Extensiones y helpers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS TEXT AS $$
  SELECT raw_app_meta_data->>'rol'
  FROM auth.users
  WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: obtener empresa del usuario actual
CREATE OR REPLACE FUNCTION get_user_empresa()
RETURNS TEXT AS $$
  SELECT raw_app_meta_data->>'empresa'
  FROM auth.users
  WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_rol() IN ('superadmin', 'admin')
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: verificar si es dirección o superior
CREATE OR REPLACE FUNCTION is_direccion()
RETURNS BOOLEAN AS $$
  SELECT get_user_rol() IN ('superadmin', 'admin', 'direccion')
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
