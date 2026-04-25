import { useState, useEffect } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import {
  Users, ChevronDown, ChevronRight, Check, X, Shield, Clock,
  ToggleLeft, ToggleRight, Plus, Edit2, Power, AlertCircle
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   USUARIOS & PERMISOS — Panel de Control de Accesos
   Tree-based module/submodule permissions + last access
   ═══════════════════════════════════════════════════════════════ */

interface SubModulo {
  id: string
  label: string
  ruta: string
}

interface Modulo {
  id: string
  label: string
  icon: string
  submodulos: SubModulo[]
}

const MODULOS: Modulo[] = [
  {
    id: 'comercial', label: 'Comercial', icon: '💼',
    submodulos: [
      { id: 'dashboard_ventas', label: 'Dashboard Ventas', ruta: '/ventas' },
      { id: 'leads', label: 'Panel de Oportunidades', ruta: '/ventas/leads' },
      { id: 'nuevo_lead', label: 'Nuevo Lead', ruta: '/ventas/nuevo-lead' },
      { id: 'programa_semanal', label: 'Programa Semanal', ruta: '/ventas/programa-semanal' },
      { id: 'prospeccion', label: 'Prospección Externa', ruta: '/ventas/prospeccion-externa' },
      { id: 'cotizador', label: 'Cotizador', ruta: '/cotizador' },
      { id: 'comisiones', label: 'Comisiones', ruta: '/ventas/comisiones' },
    ],
  },
  {
    id: 'operaciones', label: 'Operaciones', icon: '🚛',
    submodulos: [
      { id: 'torre_control', label: 'Despacho IA', ruta: '/operaciones/torre-control' },
      { id: 'despachos', label: 'Despachos', ruta: '/operaciones/despachos' },
      { id: 'mapa_gps', label: 'Mapa GPS', ruta: '/operaciones/mapa-gps' },
      { id: 'disponibilidad', label: 'Disponibilidad', ruta: '/operaciones/disponibilidad' },
      { id: 'control_tractos', label: 'Control Tractos', ruta: '/operaciones/control-tractos' },
      { id: 'control_cajas', label: 'Control Cajas', ruta: '/operaciones/control-cajas' },
      { id: 'dedicados', label: 'Dedicados', ruta: '/operaciones/dedicados' },
      { id: 'cruce_fronterizo', label: 'Cruce Fronterizo', ruta: '/operaciones/cruce-fronterizo' },
      { id: 'trazabilidad', label: 'Trazabilidad', ruta: '/operaciones/trazabilidad' },
      { id: 'rentabilidad', label: 'Rentabilidad', ruta: '/operaciones/rentabilidad' },
    ],
  },
  {
    id: 'servicio', label: 'Servicio a Clientes', icon: '🎧',
    submodulos: [
      { id: 'dashboard_cs', label: 'Dashboard CS', ruta: '/servicio/dashboard' },
      { id: 'whatsapp', label: 'WhatsApp', ruta: '/servicio/whatsapp' },
      { id: 'metricas', label: 'Métricas', ruta: '/servicio/metricas' },
      { id: 'tickets', label: 'Tickets', ruta: '/servicio/tickets' },
    ],
  },
  {
    id: 'clientes', label: 'Clientes', icon: '👥',
    submodulos: [
      { id: 'alta_cliente', label: 'Alta de Cliente', ruta: '/clientes/alta' },
      { id: 'ficha_cliente', label: 'Ficha 360°', ruta: '/clientes/ficha' },
      { id: 'portal_docs', label: 'Portal Documentos', ruta: '/clientes/portal-documentos' },
      { id: 'corporativos', label: 'Corporativos', ruta: '/clientes/corporativos' },
      { id: 'radiografia', label: 'Radiografía Financiera', ruta: '/clientes/radiografia' },
    ],
  },
  {
    id: 'cobranza', label: 'Cobranza', icon: '💰',
    submodulos: [
      { id: 'cartera', label: 'Cartera', ruta: '/cxc/cartera' },
      { id: 'aging', label: 'Aging Report', ruta: '/cxc/aging' },
      { id: 'acciones_cobro', label: 'Acciones de Cobro', ruta: '/cxc/acciones' },
    ],
  },
  {
    id: 'comunicaciones', label: 'Comunicaciones', icon: '📡',
    submodulos: [
      { id: 'chief_of_staff', label: 'Chief of Staff', ruta: '/comunicaciones/chief-of-staff' },
      { id: 'correos', label: 'Correos Automatizados', ruta: '/comunicaciones/correos' },
      { id: 'notificaciones', label: 'Notificaciones', ruta: '/comunicaciones/notificaciones' },
    ],
  },
  {
    id: 'inteligencia', label: 'Inteligencia', icon: '📊',
    submodulos: [
      { id: 'analisis_8020', label: 'Análisis 80/20', ruta: '/inteligencia/8020' },
      { id: 'presupuesto', label: 'Presupuesto Mensual', ruta: '/inteligencia/presupuesto' },
      { id: 'rankings', label: 'Rankings', ruta: '/inteligencia/rankings' },
    ],
  },
  {
    id: 'configuracion', label: 'Configuración', icon: '⚙️',
    submodulos: [
      { id: 'usuarios', label: 'Usuarios', ruta: '/admin/configuracion/usuarios' },
      { id: 'catalogos', label: 'Catálogos', ruta: '/admin/configuracion/catalogos' },
      { id: 'parametros', label: 'Parámetros', ruta: '/admin/configuracion/parametros' },
      { id: 'integraciones_cfg', label: 'Integraciones', ruta: '/admin/configuracion/integraciones' },
    ],
  },
]

interface UsuarioAutorizado {
  id: string
  email: string
  nombre: string
  rol: string
  empresa: string
  activo: boolean
  ultimo_acceso: string | null
}

type PermisoMap = Record<string, Record<string, boolean>>

const ROLE_COLORS: Record<string, string> = {
  superadmin: '#DC2626',
  admin: '#7C3AED',
  cs: '#059669',
  ventas: '#2563EB',
  operaciones: '#D97706',
  pricing: '#0891B2',
  direccion: '#BE185D',
  supervisor_cs: '#059669',
  cxc: '#B8860B',
  gerente_comercial: '#2563EB',
  gerente_ops: '#D97706',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Justo ahora'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `Hace ${diffD}d`
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function UsuariosPermisos() {
  const [usuarios, setUsuarios] = useState<UsuarioAutorizado[]>([])
  const [permisos, setPermisos] = useState<Record<string, PermisoMap>>({})
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const { data: users, error } = await supabase
        .from('usuarios_autorizados')
        .select('*')
        .order('rol', { ascending: true })

      if (error) throw error
      setUsuarios(users || [])

      // Load permissions
      const { data: permsData } = await supabase
        .from('permisos_modulo')
        .select('*')

      const permMap: Record<string, PermisoMap> = {}
      if (permsData) {
        for (const p of permsData) {
          if (!permMap[p.usuario_id]) permMap[p.usuario_id] = {}
          if (!permMap[p.usuario_id][p.modulo]) permMap[p.usuario_id][p.modulo] = {}
          permMap[p.usuario_id][p.modulo][p.submodulo || '_all'] = p.habilitado
        }
      }
      setPermisos(permMap)

      if (users && users.length > 0) {
        setSelectedUser(users[0].id)
      }
    } catch (err) {
      console.error('Error loading users:', err)
      // If permisos_modulo table doesn't exist, just load users
      const { data: users } = await supabase
        .from('usuarios_autorizados')
        .select('*')
        .order('rol', { ascending: true })
      setUsuarios(users || [])
      if (users && users.length > 0) setSelectedUser(users[0].id)
    } finally {
      setLoading(false)
    }
  }

  function isModuleEnabled(userId: string, moduloId: string): boolean {
    return permisos[userId]?.[moduloId]?.['_all'] !== false
  }

  function isSubModuleEnabled(userId: string, moduloId: string, subId: string): boolean {
    const userPerms = permisos[userId]
    if (!userPerms) return true
    if (userPerms[moduloId]?.['_all'] === false) return false
    return userPerms[moduloId]?.[subId] !== false
  }

  function toggleModule(userId: string, moduloId: string) {
    const current = isModuleEnabled(userId, moduloId)
    setPermisos(prev => {
      const next = { ...prev }
      if (!next[userId]) next[userId] = {}
      if (!next[userId][moduloId]) next[userId][moduloId] = {}
      next[userId][moduloId] = { '_all': !current }
      // If disabling, disable all submodules too
      if (current) {
        const mod = MODULOS.find(m => m.id === moduloId)
        if (mod) {
          for (const sub of mod.submodulos) {
            next[userId][moduloId][sub.id] = false
          }
        }
      }
      return { ...next }
    })
  }

  function toggleSubModule(userId: string, moduloId: string, subId: string) {
    const current = isSubModuleEnabled(userId, moduloId, subId)
    setPermisos(prev => {
      const next = { ...prev }
      if (!next[userId]) next[userId] = {}
      if (!next[userId][moduloId]) next[userId][moduloId] = {}
      next[userId][moduloId][subId] = !current
      return { ...next }
    })
  }

  function toggleExpand(moduloId: string) {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduloId)) next.delete(moduloId)
      else next.add(moduloId)
      return next
    })
  }

  async function handleSave() {
    if (!selectedUser) return
    setSaving(true)
    setMsg(null)
    try {
      const userPerms = permisos[selectedUser] || {}
      const rows: { usuario_id: string; modulo: string; submodulo: string | null; habilitado: boolean }[] = []

      for (const [modulo, subs] of Object.entries(userPerms)) {
        for (const [sub, enabled] of Object.entries(subs)) {
          rows.push({
            usuario_id: selectedUser,
            modulo,
            submodulo: sub === '_all' ? null : sub,
            habilitado: enabled,
          })
        }
      }

      // Delete existing permissions for this user
      await supabase.from('permisos_modulo').delete().eq('usuario_id', selectedUser)

      // Insert new permissions
      if (rows.length > 0) {
        const { error } = await supabase.from('permisos_modulo').insert(rows)
        if (error) throw error
      }

      setMsg({ type: 'ok', text: 'Permisos guardados correctamente' })
      setTimeout(() => setMsg(null), 3000)
    } catch (err) {
      console.error('Save error:', err)
      setMsg({ type: 'err', text: 'Error al guardar. Verifica que la tabla permisos_modulo exista.' })
    } finally {
      setSaving(false)
    }
  }

  // ══════════════ CRUD usuarios_autorizados ══════════════
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingUser, setEditingUser] = useState<UsuarioAutorizado | null>(null)
  const [formData, setFormData] = useState({
    email: '', nombre: '', rol: 'ventas', empresa: 'todas', activo: true
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSaving, setFormSaving] = useState(false)

  const ROLES_DISPONIBLES = ['superadmin', 'admin', 'cs', 'ventas', 'operaciones']
  const EMPRESAS_DISPONIBLES = ['todas', 'trob', 'wexpress', 'speedyhaul', 'trob_usa']

  const MATRIZ_ROL: Record<string, string[]> = {
    superadmin: MODULOS.map(m => m.id),
    admin: MODULOS.map(m => m.id),
    cs: ['servicio', 'operaciones', 'comunicaciones', 'clientes'],
    ventas: ['comercial', 'clientes'],
    operaciones: ['operaciones', 'comunicaciones'],
  }

  function resetForm() {
    setFormData({ email: '', nombre: '', rol: 'ventas', empresa: 'todas', activo: true })
    setFormError(null)
    setEditingUser(null)
  }

  function openCreateModal() {
    resetForm()
    setModalMode('create')
    setModalOpen(true)
  }

  function openEditModal(user: UsuarioAutorizado) {
    setModalMode('edit')
    setEditingUser(user)
    setFormData({
      email: user.email,
      nombre: user.nombre || '',
      rol: user.rol,
      empresa: user.empresa || 'todas',
      activo: user.activo !== false,
    })
    setFormError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    resetForm()
  }

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function seedPermisosForRol(userId: string, rol: string) {
    const modulosHabilitados = MATRIZ_ROL[rol] || []
    const rows: any[] = []
    for (const mod of MODULOS) {
      const habMod = modulosHabilitados.includes(mod.id)
      rows.push({ usuario_id: userId, modulo: mod.id, submodulo: null, habilitado: habMod })
      for (const sub of mod.submodulos) {
        rows.push({ usuario_id: userId, modulo: mod.id, submodulo: sub.id, habilitado: habMod })
      }
    }
    if (rows.length === 0) return
    const { error } = await supabase.from('permisos_modulo').upsert(rows, {
      onConflict: 'usuario_id,modulo,submodulo'
    })
    if (error) throw error
  }

  async function resetPermisosForRol(userId: string, rol: string) {
    const { error: delErr } = await supabase.from('permisos_modulo').delete().eq('usuario_id', userId)
    if (delErr) throw delErr
    await seedPermisosForRol(userId, rol)
  }

  async function handleSaveUser() {
    setFormError(null)
    const email = formData.email.trim().toLowerCase()
    const nombre = formData.nombre.trim()
    const { rol, empresa, activo } = formData

    if (!email) { setFormError('Email obligatorio'); return }
    if (!validateEmail(email)) { setFormError('Formato de email inválido'); return }
    if (!ROLES_DISPONIBLES.includes(rol)) { setFormError('Rol inválido'); return }
    if (!EMPRESAS_DISPONIBLES.includes(empresa)) { setFormError('Empresa inválida'); return }

    if (modalMode === 'create') {
      const dup = usuarios.find(u => u.email.toLowerCase() === email)
      if (dup) { setFormError('Ese email ya existe'); return }
    }

    if (modalMode === 'edit' && editingUser) {
      const wasSuperadmin = editingUser.rol === 'superadmin' && editingUser.activo !== false
      const willBeActiveSuperadmin = rol === 'superadmin' && activo
      if (wasSuperadmin && !willBeActiveSuperadmin) {
        const otrosSuperadminsActivos = usuarios.filter(u =>
          u.id !== editingUser.id && u.rol === 'superadmin' && u.activo !== false
        )
        if (otrosSuperadminsActivos.length === 0) {
          setFormError('No puedes desactivar o degradar al único superadmin activo')
          return
        }
      }
    }

    setFormSaving(true)
    try {
      if (modalMode === 'create') {
        const { data: inserted, error } = await supabase
          .from('usuarios_autorizados')
          .insert({ email, nombre: nombre || null, rol, empresa, activo })
          .select()
          .single()
        if (error) throw error
        if (inserted?.id) {
          await seedPermisosForRol(inserted.id, rol)
        }
        setMsg({ type: 'ok', text: 'Usuario creado' })
      } else if (editingUser) {
        const rolChanged = editingUser.rol !== rol
        const { error } = await supabase
          .from('usuarios_autorizados')
          .update({ email, nombre: nombre || null, rol, empresa, activo })
          .eq('id', editingUser.id)
        if (error) throw error
        if (rolChanged) {
          await resetPermisosForRol(editingUser.id, rol)
        }
        setMsg({ type: 'ok', text: 'Usuario actualizado' })
      }
      setTimeout(() => setMsg(null), 3000)
      closeModal()
      await loadData()
    } catch (err: any) {
      console.error('handleSaveUser:', err)
      setFormError(err?.message || 'Error al guardar usuario')
    } finally {
      setFormSaving(false)
    }
  }

  async function handleToggleActivo(user: UsuarioAutorizado) {
    const nuevoActivo = !(user.activo !== false)
    if (!nuevoActivo && user.rol === 'superadmin') {
      const otros = usuarios.filter(u =>
        u.id !== user.id && u.rol === 'superadmin' && u.activo !== false
      )
      if (otros.length === 0) {
        setMsg({ type: 'err', text: 'No puedes desactivar al único superadmin activo' })
        setTimeout(() => setMsg(null), 3000)
        return
      }
    }
    const { error } = await supabase
      .from('usuarios_autorizados')
      .update({ activo: nuevoActivo })
      .eq('id', user.id)
    if (error) {
      console.error('toggle activo:', error)
      setMsg({ type: 'err', text: 'Error al cambiar estado' })
    } else {
      setMsg({ type: 'ok', text: nuevoActivo ? 'Usuario activado' : 'Usuario desactivado' })
      await loadData()
    }
    setTimeout(() => setMsg(null), 3000)
  }

  const selectedUserData = usuarios.find(u => u.id === selectedUser)

  if (loading) {
    return (
      <ModuleLayout titulo="Usuarios y Permisos" moduloPadre={{ nombre: 'Configuración', ruta: '/admin/configuracion' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 'calc(100vh - 140px)', fontFamily: 'Montserrat, sans-serif',
          color: tokens.colors.textSecondary,
        }}>
          Cargando usuarios...
        </div>
      </ModuleLayout>
    )
  }

  return (
    <ModuleLayout titulo="Usuarios y Permisos" moduloPadre={{ nombre: 'Configuración', ruta: '/admin/configuracion' }}>
      <div style={{
        display: 'flex', height: 'calc(100vh - 140px)', fontFamily: 'Montserrat, sans-serif',
        background: '#F3F4F8', overflow: 'hidden',
      }}>
        {/* Left Panel — User List */}
        <div style={{
          width: '320px', minWidth: '320px', background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px', borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <Users size={20} color={tokens.colors.primary} />
            <span style={{ fontWeight: 600, fontSize: '1rem', color: '#0F172A', flex: 1 }}>
              Usuarios ({usuarios.length})
            </span>
            <button
              onClick={openCreateModal}
              title="Agregar usuario"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '6px',
                border: 'none', cursor: 'pointer',
                background: tokens.colors.primary, color: '#FFFFFF',
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {usuarios.map(user => {
              const isSelected = selectedUser === user.id
              const roleColor = ROLE_COLORS[user.rol] || '#6B7280'
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user.id)}
                  style={{
                    padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                    marginBottom: '4px', transition: 'all 0.15s ease',
                    background: isSelected ? `${tokens.colors.primary}10` : 'transparent',
                    border: isSelected ? `1px solid ${tokens.colors.primary}30` : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
                        {user.nombre || user.email.split('@')[0]}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                        {user.email}
                      </div>
                    </div>
                    <div style={{
                      padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem',
                      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: `${roleColor}15`, color: roleColor,
                    }}>
                      {user.rol}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginTop: '8px', fontSize: '0.75rem', color: '#94A3B8',
                  }}>
                    <Clock size={12} />
                    <span>{formatDate(user.ultimo_acceso)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(user) }}
                      title="Editar usuario"
                      style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '22px', height: '22px', borderRadius: '4px',
                        border: '1px solid #E2E8F0', background: '#FFFFFF',
                        cursor: 'pointer', color: '#64748B',
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActivo(user) }}
                      title={user.activo !== false ? 'Desactivar' : 'Activar'}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '22px', height: '22px', borderRadius: '4px',
                        border: '1px solid #E2E8F0', background: '#FFFFFF',
                        cursor: 'pointer', color: user.activo !== false ? '#0D9668' : '#C53030',
                      }}
                    >
                      <Power size={12} />
                    </button>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: user.activo !== false ? '#0D9668' : '#C53030',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Panel — Permissions Tree */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>
                <Shield size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                Permisos de Módulos
              </div>
              {selectedUserData && (
                <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                  {selectedUserData.nombre || selectedUserData.email} — {selectedUserData.rol}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {msg && (
                <div style={{
                  padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500,
                  background: msg.type === 'ok' ? '#ECFDF5' : '#FEF2F2',
                  color: msg.type === 'ok' ? '#059669' : '#DC2626',
                  border: `1px solid ${msg.type === 'ok' ? '#A7F3D0' : '#FECACA'}`,
                }}>
                  {msg.text}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !selectedUser}
                style={{
                  padding: '9px 22px', borderRadius: '8px', border: 'none',
                  background: `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 50%, #2F5BC4 100%)`, color: '#FFFFFF',
                  fontWeight: 600, fontSize: '0.9rem', cursor: saving ? 'wait' : 'pointer',
                  fontFamily: 'Montserrat, sans-serif', opacity: saving ? 0.7 : 1,
                  transition: 'all 0.18s ease',
                  boxShadow: '0 2px 4px rgba(59,108,231,0.30), 0 6px 14px -3px rgba(59,108,231,0.25), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.20)',
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Permisos'}
              </button>
            </div>
          </div>

          {/* Tree Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {selectedUser ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MODULOS.map(modulo => {
                  const isExpanded = expandedModules.has(modulo.id)
                  const moduleOn = isModuleEnabled(selectedUser, modulo.id)
                  const enabledSubs = modulo.submodulos.filter(s => isSubModuleEnabled(selectedUser, modulo.id, s.id)).length
                  const totalSubs = modulo.submodulos.length

                  return (
                    <div key={modulo.id} style={{
                      background: '#FFFFFF', borderRadius: '12px',
                      border: '1px solid #E2E8F0', overflow: 'hidden',
                    }}>
                      {/* Module Header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', padding: '14px 18px',
                        cursor: 'pointer', gap: '12px',
                        background: isExpanded ? '#F8FAFC' : '#FFFFFF',
                        transition: 'background 0.15s ease',
                      }}
                        onClick={() => toggleExpand(modulo.id)}
                      >
                        <span style={{ fontSize: '1.2rem', width: '28px', textAlign: 'center' }}>
                          {modulo.icon}
                        </span>

                        {isExpanded
                          ? <ChevronDown size={16} color="#64748B" />
                          : <ChevronRight size={16} color="#64748B" />
                        }

                        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', color: '#0F172A' }}>
                          {modulo.label}
                        </span>

                        <span style={{
                          fontSize: '0.78rem', color: '#94A3B8', marginRight: '12px',
                        }}>
                          {enabledSubs}/{totalSubs}
                        </span>

                        <div
                          onClick={(e) => { e.stopPropagation(); toggleModule(selectedUser, modulo.id) }}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          {moduleOn
                            ? <ToggleRight size={28} color={tokens.colors.primary} />
                            : <ToggleLeft size={28} color="#CBD5E1" />
                          }
                        </div>
                      </div>

                      {/* Submodules */}
                      {isExpanded && (
                        <div style={{
                          borderTop: '1px solid #E2E8F0', padding: '8px 0',
                          background: '#FAFBFC',
                        }}>
                          {modulo.submodulos.map(sub => {
                            const subOn = isSubModuleEnabled(selectedUser, modulo.id, sub.id)
                            return (
                              <div
                                key={sub.id}
                                style={{
                                  display: 'flex', alignItems: 'center',
                                  padding: '10px 18px 10px 58px', gap: '12px',
                                  cursor: moduleOn ? 'pointer' : 'not-allowed',
                                  opacity: moduleOn ? 1 : 0.4,
                                  transition: 'background 0.1s ease',
                                }}
                                onClick={() => moduleOn && toggleSubModule(selectedUser, modulo.id, sub.id)}
                              >
                                <div style={{
                                  width: '22px', height: '22px', borderRadius: '6px',
                                  border: subOn ? 'none' : '2px solid #CBD5E1',
                                  background: subOn ? tokens.colors.primary : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.15s ease', flexShrink: 0,
                                }}>
                                  {subOn && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                                </div>

                                <span style={{
                                  flex: 1, fontSize: '0.88rem',
                                  color: subOn ? '#0F172A' : '#94A3B8',
                                  fontWeight: subOn ? 500 : 400,
                                }}>
                                  {sub.label}
                                </span>

                                <span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                                  {sub.ruta}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: '#94A3B8', fontSize: '1rem',
              }}>
                Selecciona un usuario para ver sus permisos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═════ Modal CRUD usuarios ═════ */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '480px', maxWidth: '94vw', background: '#FFFFFF',
              borderRadius: '14px', padding: '26px 28px 22px',
              boxShadow: '0 20px 50px rgba(15,23,42,0.25)',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '18px',
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                {modalMode === 'create' ? 'Agregar usuario' : 'Editar usuario'}
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#94A3B8', padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', borderRadius: '8px',
                background: '#FEF2F2', color: '#B91C1C',
                fontSize: '0.85rem', marginBottom: '14px',
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@dominio.com"
                  disabled={modalMode === 'edit'}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1px solid #E2E8F0', fontSize: '0.9rem',
                    fontFamily: 'inherit', color: '#0F172A',
                    background: modalMode === 'edit' ? '#F8FAFC' : '#FFFFFF',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1px solid #E2E8F0', fontSize: '0.9rem',
                    fontFamily: 'inherit', color: '#0F172A',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Rol *
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #E2E8F0', fontSize: '0.9rem',
                      fontFamily: 'inherit', color: '#0F172A', background: '#FFFFFF',
                    }}
                  >
                    {ROLES_DISPONIBLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                    Empresa *
                  </label>
                  <select
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #E2E8F0', fontSize: '0.9rem',
                      fontFamily: 'inherit', color: '#0F172A', background: '#FFFFFF',
                    }}
                  >
                    {EMPRESAS_DISPONIBLES.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.9rem', color: '#0F172A', cursor: 'pointer',
                marginTop: '4px',
              }}>
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Usuario activo
              </label>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: '10px',
              marginTop: '22px', paddingTop: '16px', borderTop: '1px solid #F1F5F9',
            }}>
              <button
                onClick={closeModal}
                disabled={formSaving}
                style={{
                  padding: '9px 18px', borderRadius: '8px',
                  border: '1px solid #E2E8F0', background: '#FFFFFF',
                  color: '#64748B', fontWeight: 600, fontSize: '0.85rem',
                  cursor: formSaving ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                disabled={formSaving}
                style={{
                  padding: '9px 20px', borderRadius: '8px',
                  border: 'none', background: tokens.colors.primary,
                  color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem',
                  cursor: formSaving ? 'not-allowed' : 'pointer',
                  opacity: formSaving ? 0.7 : 1,
                }}
              >
                {formSaving ? 'Guardando...' : (modalMode === 'create' ? 'Crear' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  )
}

/*
SQL Migration for permisos_modulo table:

CREATE TABLE permisos_modulo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios_autorizados(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  submodulo TEXT,
  habilitado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(usuario_id, modulo, submodulo)
);

CREATE INDEX idx_permisos_usuario_id ON permisos_modulo(usuario_id);
CREATE INDEX idx_permisos_modulo ON permisos_modulo(modulo);

ALTER TABLE permisos_modulo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage permissions" ON permisos_modulo
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios_autorizados WHERE id = auth.uid() AND rol IN ('superadmin', 'admin')
    )
  );

-- Add ultimo_acceso column to usuarios_autorizados if not exists
ALTER TABLE usuarios_autorizados ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP WITH TIME ZONE;
*/
