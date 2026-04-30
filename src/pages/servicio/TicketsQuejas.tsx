import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, CheckCircle, Plus, Filter, X } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/ui/KPICard'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'

interface Ticket {
  id: string
  cliente_id?: string | null
  viaje_id?: string | null
  tipo: string
  prioridad: string
  asunto: string
  descripcion?: string
  estado: string
  asignado_a?: string | null
  creado_por?: string | null
  fecha_limite?: string | null
  fecha_resolucion?: string | null
  created_at: string
  cliente_nombre?: string | null
}

interface Cliente { id: string; razon_social: string }
interface UserCS { id: string; nombre: string | null; email: string }

// FIX 76 — Tipos de queja AAA enfocados a transporte de carga (Salesforce-grade)
const TIPOS_QUEJA = [
  { value: 'demora_entrega',     label: 'Demora en entrega' },
  { value: 'dano_mercancia',     label: 'Daño en mercancía' },
  { value: 'faltante_robo',      label: 'Faltante / Robo' },
  { value: 'mal_manejo_unidad',  label: 'Mal manejo de unidad' },
  { value: 'conducta_operador',  label: 'Conducta del operador' },
  { value: 'documentacion',      label: 'Documentación incorrecta' },
  { value: 'cobro_indebido',     label: 'Cobro indebido' },
  { value: 'atencion_cliente',   label: 'Atención / Comunicación' },
  { value: 'sla_incumplido',     label: 'Incumplimiento de SLA' },
  { value: 'temperatura',        label: 'Cadena de frío / Temperatura' },
  { value: 'tiempo_descarga',    label: 'Demora en descarga' },
  { value: 'otro',               label: 'Otro' },
]

const PRIORIDADES = [
  { value: 'critica', label: 'Crítica',  sla_horas: 4,   color: 'red' },
  { value: 'alta',    label: 'Alta',     sla_horas: 24,  color: 'orange' },
  { value: 'media',   label: 'Media',    sla_horas: 72,  color: 'yellow' },
  { value: 'baja',    label: 'Baja',     sla_horas: 168, color: 'gray' },
]

const CANALES_ORIGEN = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email',    label: 'Email' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'reunion',  label: 'Reunión presencial' },
  { value: 'sistema',  label: 'Sistema interno' },
]

export default function TicketsQuejas() {
  const { user } = useAuthContext()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ abiertos: 0, total: 0, criticos: 0, slaCumplido: 0 })
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('')

  // Modal "Nuevo Ticket"
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [usersCS, setUsersCS] = useState<UserCS[]>([])
  const [form, setForm] = useState({
    cliente_id: '',
    cliente_search: '',
    viaje_numero: '',
    tipo: '',
    prioridad: 'media',
    canal: 'whatsapp',
    asunto: '',
    descripcion: '',
    asignado_a: '',
  })

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tickets')
        .select('id, cliente_id, viaje_id, tipo, prioridad, asunto, descripcion, estado, asignado_a, creado_por, fecha_limite, fecha_resolucion, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      const list = (data || []) as Ticket[]
      // Enrich con razon_social
      const cliIds = [...new Set(list.map(t => t.cliente_id).filter(Boolean))] as string[]
      if (cliIds.length) {
        const { data: cli } = await supabase.from('clientes').select('id, razon_social').in('id', cliIds)
        const map = new Map((cli || []).map((c: any) => [c.id, c.razon_social]))
        list.forEach(t => { if (t.cliente_id) t.cliente_nombre = map.get(t.cliente_id) || null })
      }
      setTickets(list)
      // Stats
      const abiertos = list.filter(t => ['abierto','en_proceso'].includes(t.estado)).length
      const criticos = list.filter(t => ['critica','alta'].includes(t.prioridad) && ['abierto','en_proceso'].includes(t.estado)).length
      const cumplido = list.filter(t => t.estado === 'resuelto' && t.fecha_resolucion && t.fecha_limite && new Date(t.fecha_resolucion) <= new Date(t.fecha_limite)).length
      const resueltos = list.filter(t => t.estado === 'resuelto').length
      setStats({
        abiertos, total: list.length, criticos,
        slaCumplido: resueltos > 0 ? Math.round(cumplido * 100 / resueltos) : 0,
      })
    } catch (e: any) {
      console.error('fetchTickets', e)
      setTickets([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets() }, [])

  const openModal = async () => {
    setError(''); setShowModal(true)
    // Lazy-load catálogos
    if (clientes.length === 0) {
      const { data: cli } = await supabase.from('clientes').select('id, razon_social').is('deleted_at', null).order('razon_social').limit(1000)
      setClientes((cli || []) as Cliente[])
    }
    if (usersCS.length === 0) {
      const { data: u } = await supabase.from('usuarios_autorizados').select('id, nombre, email').in('rol', ['cs','admin','superadmin']).order('nombre')
      setUsersCS((u || []) as UserCS[])
    }
  }

  const handleSave = async () => {
    setError('')
    if (!form.cliente_id) { setError('Selecciona un cliente'); return }
    if (!form.tipo) { setError('Selecciona el tipo de queja'); return }
    if (!form.asunto.trim()) { setError('Escribe un asunto'); return }
    if (form.asunto.trim().length < 5) { setError('El asunto debe tener al menos 5 caracteres'); return }
    setSaving(true)
    try {
      const slaHoras = PRIORIDADES.find(p => p.value === form.prioridad)?.sla_horas || 72
      const fechaLimite = new Date(Date.now() + slaHoras * 3600 * 1000).toISOString()
      // Buscar viaje por numero (opcional)
      let viaje_id: string | null = null
      if (form.viaje_numero.trim()) {
        const num = parseInt(form.viaje_numero.trim().replace(/^#/, ''))
        if (!isNaN(num)) {
          const { data: v } = await supabase.from('viajes_anodos').select('id').eq('viaje', num).limit(1).maybeSingle()
          viaje_id = v?.id || null
        }
      }
      const descripcionFull = (form.descripcion || '').trim() +
        (form.canal ? `\n\n[Canal de origen: ${CANALES_ORIGEN.find(c => c.value === form.canal)?.label}]` : '')
      const payload = {
        cliente_id: form.cliente_id,
        viaje_id,
        tipo: form.tipo,
        prioridad: form.prioridad,
        asunto: form.asunto.trim(),
        descripcion: descripcionFull || null,
        estado: 'abierto',
        asignado_a: form.asignado_a || null,
        creado_por: user?.id || null,
        fecha_limite: fechaLimite,
      }
      const { error: insErr } = await supabase.from('tickets').insert([payload])
      if (insErr) throw insErr
      setShowModal(false)
      setForm({ cliente_id:'', cliente_search:'', viaje_numero:'', tipo:'', prioridad:'media', canal:'whatsapp', asunto:'', descripcion:'', asignado_a:'' })
      await fetchTickets()
    } catch (e: any) {
      setError(`Error al guardar: ${e?.message || 'desconocido'}`)
    } finally { setSaving(false) }
  }

  const ticketsFiltered = tickets.filter(t => {
    if (filtroEstado && t.estado !== filtroEstado) return false
    if (filtroPrioridad && t.prioridad !== filtroPrioridad) return false
    return true
  })

  const tipoLabel = (v: string) => TIPOS_QUEJA.find(t => t.value === v)?.label || v
  const prioColor = (p: string) => (PRIORIDADES.find(x => x.value === p)?.color || 'gray') as any
  const estadoColor = (e: string): any => e === 'abierto' ? 'red' : e === 'en_proceso' ? 'yellow' : e === 'resuelto' ? 'green' : 'gray'
  const estadoLabel = (e: string) => ({ abierto:'Abierto', en_proceso:'En proceso', resuelto:'Resuelto', cerrado:'Cerrado' } as any)[e] || e

  const columns: Column<Ticket>[] = [
    { key: 'created_at', label: 'Fecha', width: '110px', render: (r) => new Date(r.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short' }) },
    { key: 'cliente_nombre', label: 'Cliente', width: '200px', render: (r) => r.cliente_nombre || '—' },
    { key: 'tipo', label: 'Tipo', width: '160px', render: (r) => tipoLabel(r.tipo) },
    { key: 'asunto', label: 'Asunto', render: (r) => r.asunto },
    { key: 'prioridad', label: 'Prioridad', width: '90px', render: (r) => <Badge color={prioColor(r.prioridad)}>{PRIORIDADES.find(p => p.value === r.prioridad)?.label || r.prioridad}</Badge> },
    { key: 'estado', label: 'Estado', width: '100px', render: (r) => <Badge color={estadoColor(r.estado)}>{estadoLabel(r.estado)}</Badge> },
    { key: 'fecha_limite', label: 'SLA', width: '90px', render: (r) => {
      if (!r.fecha_limite) return '—'
      const ms = new Date(r.fecha_limite).getTime() - Date.now()
      const horas = Math.round(ms / 3600000)
      if (r.estado === 'resuelto' || r.estado === 'cerrado') return <Badge color="green">OK</Badge>
      if (horas < 0) return <Badge color="red">Vencido</Badge>
      if (horas < 4) return <Badge color="orange">{horas}h</Badge>
      return <Badge color="gray">{horas}h</Badge>
    }},
  ]

  return (
    <ModuleLayout
      titulo="Tickets & Quejas"
      subtitulo="Gestión de reclamos y solicitudes de clientes — transporte de carga"
      acciones={
        <Button variant="primary" size="md" onClick={openModal}>
          <Plus size={18} /> Nuevo Ticket
        </Button>
      }
    >
      <div style={{ display:'flex', flexDirection:'column', gap: tokens.spacing.lg, height:'100%' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: tokens.spacing.lg }}>
          <KPICard titulo="Tickets Abiertos"  valor={stats.abiertos}  icono={<AlertTriangle size={20} />} color="red"    subtitulo={`de ${stats.total} total`} />
          <KPICard titulo="SLA Cumplido"      valor={`${stats.slaCumplido}%`} icono={<CheckCircle size={20} />}    color="green"  subtitulo="del total resuelto" />
          <KPICard titulo="Críticos abiertos" valor={stats.criticos}  icono={<AlertTriangle size={20} />} color="orange" subtitulo="prioridad alta/crítica" />
          <KPICard titulo="Tiempo Promedio"   valor="—"                icono={<Clock size={20} />}        color="blue"   subtitulo="resolución" />
        </div>

        <div style={{ display:'flex', gap: tokens.spacing.md, alignItems:'center', borderBottom:`1px solid ${tokens.colors.border}`, paddingBottom: tokens.spacing.md }}>
          <Filter size={16} style={{ color: tokens.colors.textSecondary }} />
          <span style={{ color: tokens.colors.textSecondary, fontSize:'13px' }}>Estado:</span>
          {['abierto','en_proceso','resuelto','cerrado'].map(e => (
            <button key={e} onClick={() => setFiltroEstado(filtroEstado === e ? '' : e)} style={{
              padding:'4px 10px', borderRadius: tokens.radius.md,
              border:`1px solid ${filtroEstado === e ? tokens.colors.primary : tokens.colors.border}`,
              background: filtroEstado === e ? 'rgba(30,102,245,0.15)' : 'transparent',
              color: filtroEstado === e ? tokens.colors.primary : tokens.colors.textSecondary,
              fontSize:'12px', cursor:'pointer', textTransform:'capitalize'
            }}>{estadoLabel(e)}</button>
          ))}
          <span style={{ color: tokens.colors.textSecondary, fontSize:'13px', marginLeft: tokens.spacing.md }}>Prioridad:</span>
          {PRIORIDADES.map(p => (
            <button key={p.value} onClick={() => setFiltroPrioridad(filtroPrioridad === p.value ? '' : p.value)} style={{
              padding:'4px 10px', borderRadius: tokens.radius.md,
              border:`1px solid ${filtroPrioridad === p.value ? tokens.colors.primary : tokens.colors.border}`,
              background: filtroPrioridad === p.value ? 'rgba(30,102,245,0.15)' : 'transparent',
              color: filtroPrioridad === p.value ? tokens.colors.primary : tokens.colors.textSecondary,
              fontSize:'12px', cursor:'pointer'
            }}>{p.label}</button>
          ))}
        </div>

        <Card style={{ flex:1, overflow:'auto' }}>
          <DataTable<Ticket>
            columns={columns}
            data={ticketsFiltered}
            loading={loading}
            emptyMessage={tickets.length === 0 ? 'Aún no hay tickets registrados — empieza con "Nuevo Ticket"' : 'Sin resultados con los filtros'}
          />
        </Card>
      </div>

      {/* Modal Nuevo Ticket — AAA transporte de carga */}
      {showModal && (
        <div onClick={() => !saving && setShowModal(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:'24px'
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: tokens.colors.bgCard, borderRadius: tokens.radius.lg,
            padding: tokens.spacing.xl, width:'100%', maxWidth:'640px',
            maxHeight:'90vh', overflow:'auto',
            border:`1px solid ${tokens.colors.border}`, fontFamily: tokens.fonts.body,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: tokens.spacing.lg }}>
              <h2 style={{ margin:0, color: tokens.colors.textPrimary, fontSize:'18px', fontWeight:600 }}>Nuevo Ticket</h2>
              <button onClick={() => !saving && setShowModal(false)} style={{ background:'none', border:'none', color: tokens.colors.textSecondary, cursor:'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:`1px solid ${tokens.colors.red}`, color: tokens.colors.red, padding:'10px', borderRadius: tokens.radius.md, marginBottom: tokens.spacing.md, fontSize:'13px' }}>
                {error}
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: tokens.spacing.md }}>
              {/* Cliente */}
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={lbl}>Cliente *</label>
                <input type="text" placeholder="Buscar cliente..." value={form.cliente_search}
                  onChange={(e) => setForm({ ...form, cliente_search: e.target.value, cliente_id: '' })}
                  style={inp} />
                {form.cliente_search && !form.cliente_id && (
                  <div style={{ maxHeight:'120px', overflow:'auto', border:`1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md, marginTop:'4px' }}>
                    {clientes.filter(c => (c.razon_social || '').toLowerCase().includes(form.cliente_search.toLowerCase())).slice(0, 10).map(c => (
                      <div key={c.id} onClick={() => setForm({ ...form, cliente_id: c.id, cliente_search: c.razon_social })}
                        style={{ padding:'8px 12px', cursor:'pointer', color: tokens.colors.textPrimary, fontSize:'13px', borderBottom:`1px solid ${tokens.colors.border}` }}>
                        {c.razon_social}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Viaje opcional */}
              <div>
                <label style={lbl}>Viaje (opcional)</label>
                <input type="text" placeholder="#191490" value={form.viaje_numero}
                  onChange={(e) => setForm({ ...form, viaje_numero: e.target.value })} style={inp} />
              </div>

              {/* Canal de origen */}
              <div>
                <label style={lbl}>Canal de origen *</label>
                <select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })} style={inp}>
                  {CANALES_ORIGEN.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label style={lbl}>Tipo de queja *</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} style={inp}>
                  <option value="">— Selecciona —</option>
                  {TIPOS_QUEJA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label style={lbl}>Prioridad *</label>
                <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })} style={inp}>
                  {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label} (SLA {p.sla_horas}h)</option>)}
                </select>
              </div>

              {/* Asignado */}
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={lbl}>Asignar a (opcional)</label>
                <select value={form.asignado_a} onChange={(e) => setForm({ ...form, asignado_a: e.target.value })} style={inp}>
                  <option value="">— Sin asignar —</option>
                  {usersCS.map(u => <option key={u.id} value={u.id}>{u.nombre || u.email}</option>)}
                </select>
              </div>

              {/* Asunto */}
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={lbl}>Asunto *</label>
                <input type="text" placeholder="Ej: Caja llegó con mercancía dañada en techo" value={form.asunto}
                  onChange={(e) => setForm({ ...form, asunto: e.target.value })} style={inp} />
              </div>

              {/* Descripción */}
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={lbl}>Descripción detallada</label>
                <textarea placeholder="Describe lo ocurrido, cuándo, qué viaje/operador/unidad, fotos disponibles, expectativa del cliente..." value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  style={{ ...inp, minHeight:'90px', resize:'vertical', fontFamily: tokens.fonts.body }} />
              </div>
            </div>

            <div style={{ display:'flex', gap: tokens.spacing.sm, justifyContent:'flex-end', marginTop: tokens.spacing.lg }}>
              <Button variant="secondary" size="md" onClick={() => !saving && setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" size="md" onClick={handleSave}>
                {saving ? 'Guardando...' : 'Crear ticket'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  )
}

const lbl: any = { display:'block', marginBottom:'4px', color: tokens.colors.textSecondary, fontSize:'12px', fontWeight:500 }
const inp: any = { width:'100%', padding:'8px 10px', borderRadius: tokens.radius.md, border:`1px solid ${tokens.colors.border}`, background: tokens.colors.bgMain, color: tokens.colors.textPrimary, fontSize:'13px', outline:'none', fontFamily: tokens.fonts.body }
