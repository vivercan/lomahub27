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
}

export interface AuthUser {
  id: string
  email: string
  rol: Rol
  empresa: string
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
  gerente_comercial: '/ventas/dashboard',
  ventas: '/ventas/mis-leads',
  cs: '/operaciones/despachos',
  supervisor_cs: '/servicio/dashboard',
  operaciones: '/operaciones/torre-control',
  gerente_ops: '/operaciones/torre-control',
  cxc: '/cxc/cartera',
  pricing: '/cotizador/tarifas',
  it: '/admin/configuracion',
}
