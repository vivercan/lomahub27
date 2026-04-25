import { supabase } from '../../lib/supabase'
import { ModuleDashboardGrid } from '../../components/dashboard/ModuleDashboardGrid'
import type { CardDef } from '../../components/dashboard/ModuleDashboardGrid'

/* ──────────────────────────────────────────────────────────────
   CONFIGURACIÓN — Landing Page V4.3 (patrón Catálogos, 25/Abr/2026)
   8 cards con subtítulo descriptivo. Fusionado AI Rate Settings.
   ────────────────────────────────────────────────────────────── */

const CARDS: CardDef[] = [
  { id: 'usuarios',      label: 'Usuarios',            route: '/admin/configuracion/usuarios',      kpiLabel: 'Autorizados', iconSet: 'hugeicons', iconName: 'user-multiple-03',           subtitle: 'Equipo y permisos por rol' },
  { id: 'catalogos',     label: 'Catálogos',           route: '/admin/configuracion/catalogos',     kpiLabel: 'Tipos',       iconSet: 'hugeicons', iconName: 'grid-view',                  subtitle: 'Empresas, plazas, operadores y más' },
  { id: 'tarifas_ia',    label: 'AI Rate Settings',    route: '/admin/configuracion/tarifas-ia',    kpiLabel: 'Reglas',      iconSet: 'hugeicons', iconName: 'artificial-intelligence-04', subtitle: 'Cerebro tarifario y parámetros' },
  { id: 'integraciones', label: 'Integraciones',       route: '/admin/configuracion/integraciones', kpiLabel: 'Activas',     iconSet: 'hugeicons', iconName: 'plug-socket',                subtitle: 'GPS, ANODOS, WhatsApp, Mail' },
  { id: 'documentos',    label: 'Documentos',          route: '/admin/configuracion/documentos',    kpiLabel: 'Legales',     iconSet: 'hugeicons', iconName: 'file-01',                    subtitle: 'Contratos, pólizas y manuales' },
  { id: 'terminales',    label: 'Terminales',          route: '/admin/configuracion/terminales',    kpiLabel: 'Geocercas',   iconSet: 'hugeicons', iconName: 'maps-location-01',           subtitle: 'Patios, naves y geocercas' },
  { id: 'inventario',    label: 'Inventario Terminal', route: '/admin/configuracion/inventario',    kpiLabel: 'Objetivo',    iconSet: 'hugeicons', iconName: 'package',                    subtitle: 'Objetivos por terminal y equipo' },
  { id: 'flota',         label: 'Flota Master',        route: '/admin/configuracion/flota-master',  kpiLabel: 'Unidades',    iconSet: 'hugeicons', iconName: 'truck',                      subtitle: 'Tractos, cajas y termos' },
]

async function fallbackFetch(): Promise<Record<string, number>> {
  const [usuarios, parametros, terminales, objetivos] = await Promise.all([
    supabase.from('usuarios_autorizados').select('*', { count: 'exact', head: true }),
    supabase.from('parametros_sistema').select('*', { count: 'exact', head: true }),
    supabase.from('terminales').select('*', { count: 'exact', head: true }).eq('activa', true),
    supabase.from('terminal_inventario_objetivo').select('*', { count: 'exact', head: true }),
  ])
  const out: Record<string, number> = {}
  CARDS.forEach(c => { out[c.id] = 0 })
  out.usuarios = usuarios.count ?? 0
  out.tarifas_ia = parametros.count ?? 0
  out.integraciones = 7  // Supabase, GPS, WA, Resend, Anthropic, Maps, ANODOS
  out.terminales = terminales.count ?? 0
  out.inventario = objetivos.count ?? 0
  return out
}

export default function Configuracion() {
  return (
    <ModuleDashboardGrid
      titulo="Configuración"
      modulo="configuracion"
      cards={CARDS}
      fallbackFetch={fallbackFetch}
    />
  )
}
