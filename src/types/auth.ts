export type Rol =
  | 'superadmin'
  | 'admin'
  | 'direccion'
  | 'gerente_comercial'
  | 'ventas'
  | 'cs'
  | 'supervisor_cs'
  | 'operaciones'
  | 'gerente_ops'
  | 'cxc'
  | 'pricing'
  | 'it'

export interface UserMetadata {
  rol: Rol
  empresa: string
  permisosCustom?: string[]
}

export interface AuthUser {
  id: string
  email: string
  rol: Rol
  empresa: string
  permisosCustom?: string[]
}

export const ROLES_LABELS: Record<Rol, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  direccion: 'Dirección',
  gerente_comercial: 'Gerente Comercial',
  ventas: 'Ejecutivo de Ventas',
  cs: 'Customer Service',
  supervisor_cs: 'Supervisor CS',
  operaciones: 'Operaciones',
  gerente_ops: 'Gerente Operaciones',
  cxc: 'CXC / Cobranza',
  pricing: 'Pricing',
  it: 'IT',
}

export const RUTAS_INICIALES: Record<Rol, string> = {
  superadmin: '/dashboard',
  admin: '/dashboard',
  direccion: '/war-room',
  gerente_comercial: '/comercial/dashboard',
  ventas: '/oportunidades/mis-leads',
  cs: '/operaciones/despachos',
  supervisor_cs: '/servicio/dashboard',
  operaciones: '/operaciones/dedicados',
  gerente_ops: '/servicio/despacho-ia',
  cxc: '/cxc/cartera',
  pricing: '/cotizador/tarifas',
  it: '/admin/configuracion',
}

// Maps permisosCustom module IDs to route path prefixes
export const PERMISOS_CUSTOM_ROUTES: Record<string, string[]> = {
  'agregar-lead': ['/oportunidades/leads/nuevo'],
  'panel-oportunidades': ['/oportunidades/mis-leads', '/comercial/dashboard', '/oportunidades/leads/'],
  'servicio-clientes': ['/servicio/dashboard', '/servicio/whatsapp', '/servicio/metricas'],
}

/**
 * Check if a user with permisosCustom has access to a given path.
 */
export function checkCustomAccess(permisosCustom: string[], path: string): boolean {
  for (const permiso of permisosCustom) {
    const routes = PERMISOS_CUSTOM_ROUTES[permiso] || []
    if (routes.some(r => path.startsWith(r))) return true
  }
  return false
}
