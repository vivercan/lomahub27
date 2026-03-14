-- 011: Índices adicionales de performance

-- Clientes
CREATE INDEX idx_clientes_ejecutivo ON clientes(ejecutivo_asignado);
CREATE INDEX idx_clientes_empresa ON clientes(empresa);
CREATE INDEX idx_clientes_tipo ON clientes(tipo);
CREATE INDEX idx_clientes_rfc ON clientes(rfc);

-- Leads
CREATE INDEX idx_leads_ejecutivo ON leads(ejecutivo_id);
CREATE INDEX idx_leads_estado ON leads(estado);
CREATE INDEX idx_leads_fecha ON leads(fecha_ultimo_mov);

-- Viajes
CREATE INDEX idx_viajes_cliente ON viajes(cliente_id);
CREATE INDEX idx_viajes_estado ON viajes(estado);
CREATE INDEX idx_viajes_fecha ON viajes(fecha_salida);
CREATE INDEX idx_viajes_cs ON viajes(cs_asignada);

-- Actividades
CREATE INDEX idx_actividades_usuario ON actividades(usuario_id);
CREATE INDEX idx_actividades_cliente ON actividades(cliente_id);
CREATE INDEX idx_actividades_fecha ON actividades(fecha);

-- WhatsApp
CREATE INDEX idx_wa_numero ON whatsapp_mensajes(numero_origen);
CREATE INDEX idx_wa_cliente ON whatsapp_mensajes(cliente_id);
CREATE INDEX idx_wa_timestamp ON whatsapp_mensajes(timestamp);
