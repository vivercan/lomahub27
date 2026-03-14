-- 012: Row Level Security — Políticas completas
-- EJECUTAR DESPUÉS de todas las tablas

-- PASO 1: Habilitar RLS en cada tabla
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tractos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cxc_cartera ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_sistema ENABLE ROW LEVEL SECURITY;

-- === CLIENTES ===
CREATE POLICY "clientes_admin_todo" ON clientes FOR ALL USING (is_direccion());
CREATE POLICY "clientes_ventas_suyos" ON clientes FOR SELECT USING (get_user_rol() = 'ventas' AND ejecutivo_asignado = auth.uid());
CREATE POLICY "clientes_gerente_com" ON clientes FOR SELECT USING (get_user_rol() = 'gerente_comercial');
CREATE POLICY "clientes_cs_empresa" ON clientes FOR SELECT USING (get_user_rol() IN ('cs', 'supervisor_cs') AND empresa = get_user_empresa());
CREATE POLICY "clientes_cxc" ON clientes FOR SELECT USING (get_user_rol() = 'cxc');
CREATE POLICY "clientes_ops" ON clientes FOR SELECT USING (get_user_rol() IN ('operaciones', 'gerente_ops'));

-- === LEADS ===
CREATE POLICY "leads_admin" ON leads FOR ALL USING (is_admin());
CREATE POLICY "leads_gerente_com" ON leads FOR SELECT USING (get_user_rol() = 'gerente_comercial');
CREATE POLICY "leads_direccion" ON leads FOR SELECT USING (get_user_rol() = 'direccion');
CREATE POLICY "leads_ventas_suyos" ON leads FOR ALL USING (get_user_rol() = 'ventas' AND ejecutivo_id = auth.uid());

-- === OPORTUNIDADES ===
CREATE POLICY "opps_admin" ON oportunidades FOR ALL USING (is_admin());
CREATE POLICY "opps_gerente" ON oportunidades FOR SELECT USING (get_user_rol() IN ('gerente_comercial', 'direccion'));
CREATE POLICY "opps_ventas_suyas" ON oportunidades FOR ALL USING (get_user_rol() = 'ventas' AND ejecutivo_id = auth.uid());

-- === COTIZACIONES ===
CREATE POLICY "cot_admin" ON cotizaciones FOR ALL USING (is_admin());
CREATE POLICY "cot_pricing" ON cotizaciones FOR ALL USING (get_user_rol() = 'pricing');
CREATE POLICY "cot_gerente" ON cotizaciones FOR SELECT USING (get_user_rol() IN ('gerente_comercial', 'direccion'));
CREATE POLICY "cot_ventas_suyas" ON cotizaciones FOR ALL USING (get_user_rol() = 'ventas' AND ejecutivo_id = auth.uid());

-- === VIAJES ===
CREATE POLICY "viajes_admin" ON viajes FOR ALL USING (is_admin());
CREATE POLICY "viajes_ops" ON viajes FOR ALL USING (get_user_rol() IN ('operaciones', 'gerente_ops'));
CREATE POLICY "viajes_cs" ON viajes FOR SELECT USING (get_user_rol() IN ('cs', 'supervisor_cs') AND cs_asignada = auth.uid());
CREATE POLICY "viajes_cs_crear" ON viajes FOR INSERT WITH CHECK (get_user_rol() IN ('cs', 'supervisor_cs', 'admin'));
CREATE POLICY "viajes_direccion" ON viajes FOR SELECT USING (get_user_rol() IN ('direccion', 'gerente_ops'));

-- === GPS TRACKING ===
CREATE POLICY "gps_lectura" ON gps_tracking FOR SELECT USING (get_user_rol() IN ('superadmin', 'admin', 'cs', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion'));

-- === CXC CARTERA ===
CREATE POLICY "cxc_admin" ON cxc_cartera FOR ALL USING (is_admin());
CREATE POLICY "cxc_ejecutivos" ON cxc_cartera FOR ALL USING (get_user_rol() = 'cxc' AND ejecutivo_cxc_id = auth.uid());
CREATE POLICY "cxc_direccion" ON cxc_cartera FOR SELECT USING (get_user_rol() = 'direccion');

-- === ACTIVIDADES ===
CREATE POLICY "act_admin" ON actividades FOR ALL USING (is_admin());
CREATE POLICY "act_propio" ON actividades FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "act_gerente" ON actividades FOR SELECT USING (get_user_rol() IN ('gerente_comercial', 'supervisor_cs', 'direccion'));

-- === PARÁMETROS SISTEMA ===
CREATE POLICY "params_lectura" ON parametros_sistema FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "params_escritura" ON parametros_sistema FOR ALL USING (is_admin());

-- === AUDITORÍA ===
CREATE POLICY "audit_admin" ON auditoria_log FOR SELECT USING (is_admin());

-- === WHATSAPP ===
CREATE POLICY "wa_admin" ON whatsapp_mensajes FOR ALL USING (is_admin());
CREATE POLICY "wa_cs" ON whatsapp_mensajes FOR SELECT USING (get_user_rol() IN ('cs', 'supervisor_cs'));
