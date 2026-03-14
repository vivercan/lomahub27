// Tipos base del sistema LomaHUB27

export interface Cliente {
  id: string
  razon_social: string
  rfc: string | null
  tipo: 'prospecto' | 'activo' | 'corporativo' | 'estrategico' | 'bloqueado'
  segmento: string | null
  prioridad: 'normal' | 'alta' | 'estrategica'
  empresa: string | null
  ejecutivo_asignado: string | null
  ejecutiva_cs: string | null
  fecha_alta: string
  notas: string | null
  activo: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  empresa: string
  contacto: string | null
  telefono: string | null
  email: string | null
  ciudad: string | null
  ruta_interes: string | null
  tipo_carga: string | null
  fuente: string
  ejecutivo_id: string | null
  estado: 'nuevo' | 'contactado' | 'cotizacion' | 'negociacion' | 'ganado' | 'perdido' | 'congelado'
  motivo_perdida: string | null
  fecha_creacion: string
  fecha_ultimo_mov: string
  deleted_at: string | null
}

export interface Viaje {
  id: string
  cliente_id: string
  formato_venta_id: string | null
  tracto_id: string | null
  caja_id: string | null
  operador_id: string | null
  cs_asignada: string | null
  origen: string
  destino: string
  tipo: 'IMPO' | 'EXPO' | 'NAC'
  fecha_salida: string | null
  cita_carga: string | null
  cita_descarga: string
  eta_calculado: string | null
  estado: string
  notas: string | null
  created_at: string
  updated_at: string
}

export interface GPSTracking {
  id: string
  economico: string
  empresa: string | null
  segmento: string | null
  latitud: number | null
  longitud: number | null
  velocidad: number
  ubicacion: string | null
  estatus: string | null
  ultima_actualizacion: string
  estado_geo: string | null
  municipio_geo: string | null
}

export interface Tracto {
  id: string
  numero_economico: string
  empresa: string
  segmento: string | null
  estado_operativo: string
  operador_actual_id: string | null
  km_acumulados: number
  activo: boolean
  created_at: string
}

export interface Caja {
  id: string
  numero_economico: string
  empresa: string
  tipo: 'seco' | 'refrigerado'
  estado: string
  ubicacion_actual: string | null
  activo: boolean
  created_at: string
}

export interface Cotizacion {
  id: string
  cliente_id: string | null
  ejecutivo_id: string
  oportunidad_id: string | null
  ruta_origen: string | null
  ruta_destino: string | null
  tipo_equipo: string | null
  tipo_servicio: string | null
  tarifa: number | null
  costo_base: number | null
  margen_pct: number | null
  estado: 'borrador' | 'enviada' | 'vista' | 'aceptada' | 'rechazada' | 'vencida'
  version: number
  created_at: string
}

export interface Actividad {
  id: string
  tipo: 'llamada' | 'visita' | 'correo' | 'whatsapp' | 'reunion' | 'nota'
  usuario_id: string
  cliente_id: string | null
  lead_id: string | null
  oportunidad_id: string | null
  fecha: string
  duracion_min: number | null
  resultado: string | null
  notas: string | null
}
