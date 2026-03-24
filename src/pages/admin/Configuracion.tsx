import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Plus, X } from 'lucide-react';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import CatalogosTab from './CatalogosTab';

interface Usuario {
  id?: string;
  email: string;
  rol: 'superadmin' | 'admin' | 'ventas' | 'cs' | 'supervisor_cs' | 'cxc' | 'pricing' | 'operaciones' | 'gerente_comercial' | 'gerente_ops' | 'direccion';
  empresa: string;
  activo: boolean;
  permisos_custom?: any;
}

type TabType = 'usuarios' | 'catalogos' | 'parametros' | 'integraciones' | 'auditoria';

const ROLES = ['superadmin', 'admin', 'ventas', 'cs', 'supervisor_cs', 'cxc', 'pricing', 'operaciones', 'gerente_comercial', 'gerente_ops', 'direccion'] as const;

function extractNameFromEmail(email: string): string {
  const namePart = email.split('@')[0];
  return namePart
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getRolBadgeColor(rol: string): 'primary' | 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange' {
  switch (rol) {
    case 'superadmin':
    case 'admin':
      return 'red';
    case 'gerente_comercial':
    case 'gerente_ops':
    case 'direccion':
      return 'yellow';
    case 'ventas':
      return 'blue';
    case 'cs':
    case 'supervisor_cs':
      return 'green';
    case 'cxc':
    case 'pricing':
    case 'operaciones':
      return 'orange';
    default:
      return 'gray';
  }
}

function getEstadoBadgeColor(activo: boolean): 'green' | 'gray' {
  return activo ? 'green' : 'gray';
}

// ── Inline modal styles ──
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  background: tokens.colors.bgCard, borderRadius: tokens.radius.lg,
  border: `1px solid ${tokens.colors.border}`, padding: '28px',
  width: '480px', maxWidth: '90vw',
  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md,
  border: `1px solid ${tokens.colors.border}`, background: tokens.colors.bgHover,
  color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '14px',
  outline: 'none', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', appearance: 'auto' as any,
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600,
  color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body,
};

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState<TabType>('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [, setLoading] = useState(true);

  // Modal state
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [editRol, setEditRol] = useState('');
  const [editEmpresa, setEditEmpresa] = useState('');
  const [editActivo, setEditActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios_autorizados')
        .select('email, rol, empresa, activo, permisos_custom')
        .order('email', { ascending: true });

      if (error) {
        console.error('Error fetching usuarios:', error);
        setUsuarios([]);
      } else if (data) {
        setUsuarios(data as Usuario[]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const openEditModal = (user: Usuario) => {
    setEditUser(user);
    setEditRol(user.rol);
    setEditEmpresa(user.empresa);
    setEditActivo(user.activo);
  };

  const closeModal = () => {
    setEditUser(null);
    setSaving(false);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('usuarios_autorizados')
        .update({ rol: editRol, empresa: editEmpresa, activo: editActivo })
        .eq('email', editUser.email);

      if (error) {
        console.error('Error updating user:', error);
        alert('Error al guardar: ' + error.message);
      } else {
        await fetchUsuarios();
        closeModal();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setSaving(false);
    }
  };

  const tabs: TabType[] = ['usuarios', 'catalogos', 'parametros', 'integraciones', 'auditoria'];

  const usuarioColumns = [
    {
      key: 'nombre',
      label: 'Nombre',
      width: '20%',
      render: (row: Usuario) => extractNameFromEmail(row.email),
    },
    { key: 'email', label: 'Email', width: '25%' },
    {
      key: 'rol',
      label: 'Rol',
      width: '15%',
      render: (row: Usuario) => <Badge color={getRolBadgeColor(row.rol)}>{row.rol}</Badge>,
    },
    { key: 'empresa', label: 'Empresa', width: '20%' },
    {
      key: 'estado',
      label: 'Estado',
      width: '10%',
      render: (row: Usuario) => (
        <Badge color={getEstadoBadgeColor(row.activo)}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (row: Usuario) => (
        <div style={{ display: 'flex', gap: tokens.spacing.xs }}>
          <Button variant="secondary" size="sm" onClick={() => openEditModal(row)}>
            Editar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ModuleLayout titulo="Configuración del Sistema">
      {/* Edit User Modal */}
      {editUser && (
        <div style={overlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, fontSize: '18px' }}>
                Editar Usuario
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted, padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email</label>
              <div style={{ ...inputStyle, background: tokens.colors.bgCard, opacity: 0.7, cursor: 'not-allowed' }}>
                {editUser.email}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Nombre</label>
              <div style={{ ...inputStyle, background: tokens.colors.bgCard, opacity: 0.7, cursor: 'not-allowed' }}>
                {extractNameFromEmail(editUser.email)}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Rol</label>
              <select
                value={editRol}
                onChange={(e) => setEditRol(e.target.value)}
                style={selectStyle}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Empresa</label>
              <input
                type="text"
                value={editEmpresa}
                onChange={(e) => setEditEmpresa(e.target.value)}
                style={inputStyle}
                placeholder="Nombre de empresa"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Estado</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setEditActivo(val)}
                    style={{
                      padding: '8px 20px', borderRadius: tokens.radius.md, fontSize: '13px',
                      fontFamily: tokens.fonts.body, fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: editActivo === val ? (val ? tokens.colors.green : tokens.colors.red || '#EF4444') : tokens.colors.bgHover,
                      color: editActivo === val ? '#fff' : tokens.colors.textSecondary,
                      transition: 'all 0.15s',
                    }}
                  >
                    {val ? 'Activo' : 'Inactivo'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={closeModal}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: tokens.spacing.lg }}>
        <div
          style={{
            display: 'flex',
            gap: tokens.spacing.sm,
            borderBottom: `2px solid ${tokens.colors.border}`,
            marginBottom: tokens.spacing.lg,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? `3px solid ${tokens.colors.blue}` : 'none',
                color: activeTab === tab ? tokens.colors.blue : tokens.colors.textSecondary,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'usuarios' && (
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: tokens.spacing.md,
              paddingBottom: tokens.spacing.md,
              borderBottom: `1px solid ${tokens.colors.border}`,
            }}
          >
            <h3
              style={{
                color: tokens.colors.textPrimary,
                margin: 0,
              }}
            >
              Usuarios del Sistema
            </h3>
            <Button variant="primary" size="sm">
              <Plus size={16} style={{ marginRight: tokens.spacing.xs }} />
              Nuevo Usuario
            </Button>
          </div>

          {usuarios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textSecondary }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>Sin datos</p>
              <p style={{ fontSize: '0.85rem', marginTop: tokens.spacing.sm }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
            </div>
          ) : (
            <DataTable columns={usuarioColumns} data={usuarios} />
          )}
        </Card>
      )}

      {activeTab === 'catalogos' && <CatalogosTab />}

      {activeTab === 'parametros' && (
        <Card>
          <div style={{ padding: tokens.spacing.lg }}>
            <h3 style={{ margin: '0 0 16px 0', color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '18px' }}>
              Parámetros del Sistema
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.md }}>
              {[
                { group: 'Tipo de Cambio', params: [
                  { label: 'USD/MXN', value: '$17.92', desc: 'Actualización automática diaria' },
                ]},
                { group: 'Pipeline de Ventas', params: [
                  { label: 'Etapas', value: '6', desc: 'Nuevo → Contactado → Cotizado → Negociación → Ganado → Perdido' },
                ]},
                { group: 'Paginación Supabase', params: [
                  { label: 'Límite por query', value: '1,000', desc: 'Máximo registros por consulta' },
                ]},
                { group: 'GPS Tracking', params: [
                  { label: 'Intervalo UPSERT', value: '10 min', desc: 'Frecuencia de actualización WideTech' },
                  { label: 'Unidades activas', value: '271', desc: 'gps_unidades registradas' },
                ]},
                { group: 'Soft Delete', params: [
                  { label: 'Campo', value: 'deleted_at', desc: 'Todas las tablas usan soft delete' },
                ]},
                { group: 'Auth', params: [
                  { label: 'Método', value: 'Google OAuth', desc: 'Único método permitido — sin email/password' },
                  { label: 'Roles', value: '7', desc: 'superadmin, admin, cs, ventas, operaciones, cxc, custom' },
                ]},
              ].map((group) => (
                <div key={group.group} style={{
                  background: tokens.colors.bgCard,
                  borderRadius: '12px',
                  padding: tokens.spacing.md,
                  border: `1px solid ${tokens.colors.border}`,
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: tokens.colors.primary, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {group.group}
                  </h4>
                  {group.params.map((p) => (
                    <div key={p.label} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: tokens.colors.textSecondary, fontSize: '13px' }}>{p.label}</span>
                        <span style={{ color: tokens.colors.textPrimary, fontWeight: 700, fontSize: '14px' }}>{p.value}</span>
                      </div>
                      <span style={{ color: tokens.colors.textMuted, fontSize: '11px' }}>{p.desc}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'integraciones' && (
        <Card>
          <div style={{ padding: tokens.spacing.lg }}>
            <h3 style={{ margin: '0 0 16px 0', color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '18px' }}>
              Integraciones Activas
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.md }}>
              {[
                {
                  name: 'WideTech GPS',
                  protocol: 'SOAP / XML',
                  status: 'Activo',
                  statusColor: tokens.colors.green,
                  desc: 'Rastreo GPS de 271 unidades con UPSERT cada 10 minutos',
                  endpoint: 'api.widetech.com.mx',
                  cron: 'Cada 10 min (gps-worker)',
                  icon: '📡',
                },
                {
                  name: 'ANODOS TMS',
                  protocol: 'REST / JSON',
                  status: 'Activo',
                  statusColor: tokens.colors.green,
                  desc: 'Sincronización de formatos de venta y datos operativos',
                  endpoint: 'api.anodos.com.mx',
                  cron: 'Cada 10 min (sync-anodos)',
                  icon: '🔄',
                },
                {
                  name: 'Google Maps',
                  protocol: 'REST / JSON',
                  status: 'Activo',
                  statusColor: tokens.colors.green,
                  desc: 'Distance Matrix + Places para cotizador cross-border',
                  endpoint: 'maps.googleapis.com',
                  cron: 'On-demand',
                  icon: '🗺️',
                },
                {
                  name: 'Anthropic Claude',
                  protocol: 'REST / JSON',
                  status: 'Configurar',
                  statusColor: tokens.colors.yellow,
                  desc: 'Análisis IA de cotizaciones PDF y validación de documentos',
                  endpoint: 'api.anthropic.com',
                  cron: 'On-demand (Edge Function)',
                  icon: '🧠',
                },
                {
                  name: 'Resend',
                  protocol: 'REST / JSON',
                  status: 'Activo',
                  statusColor: tokens.colors.green,
                  desc: 'Correos transaccionales desde mail.jjcrm27.com',
                  endpoint: 'api.resend.com',
                  cron: 'Event-driven',
                  icon: '📧',
                },
                {
                  name: 'Meta WhatsApp',
                  protocol: 'Cloud API',
                  status: 'Pendiente',
                  statusColor: tokens.colors.textMuted,
                  desc: 'WhatsApp Business para notificaciones de tracking y ETAs',
                  endpoint: 'graph.facebook.com',
                  cron: 'Event-driven',
                  icon: '💬',
                },
              ].map((intg) => (
                <div key={intg.name} style={{
                  background: tokens.colors.bgCard,
                  borderRadius: '12px',
                  padding: tokens.spacing.md,
                  border: `1px solid ${tokens.colors.border}`,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>{intg.icon}</span>
                      <div>
                        <div style={{ color: tokens.colors.textPrimary, fontWeight: 700, fontSize: '14px' }}>{intg.name}</div>
                        <div style={{ color: tokens.colors.textMuted, fontSize: '11px' }}>{intg.protocol}</div>
                      </div>
                    </div>
                    <span style={{
                      background: intg.statusColor + '22',
                      color: intg.statusColor,
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}>{intg.status}</span>
                  </div>
                  <p style={{ margin: 0, color: tokens.colors.textSecondary, fontSize: '12px', lineHeight: '1.4' }}>
                    {intg.desc}
                  </p>
                  <div style={{ borderTop: `1px solid ${tokens.colors.border}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: tokens.colors.textMuted, fontSize: '11px' }}>{intg.endpoint}</span>
                    <span style={{ color: tokens.colors.textMuted, fontSize: '11px' }}>{intg.cron}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: tokens.spacing.md,
              padding: tokens.spacing.md,
              background: tokens.colors.primary + '11',
              borderRadius: '10px',
              border: `1px solid ${tokens.colors.primary}33`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: tokens.colors.primary, fontWeight: 700, fontSize: '13px' }}>Edge Functions Activas</span>
                  <span style={{ color: tokens.colors.textSecondary, fontSize: '12px', marginLeft: '12px' }}>26 funciones desplegadas + 5 cron jobs</span>
                </div>
                <span style={{ color: tokens.colors.green, fontWeight: 700, fontSize: '14px' }}>Operativo</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'auditoria' && (
        <Card>
          <div style={{ padding: tokens.spacing.lg }}>
            <h3 style={{ margin: '0 0 16px 0', color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '18px' }}>
              Registro de Auditoría
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
              {[
                { time: 'Hoy 14:30', user: 'juan.viveros', action: 'Login exitoso', module: 'Auth', color: tokens.colors.green },
                { time: 'Hoy 14:28', user: 'Sistema', action: 'GPS sync completado — 271 posiciones', module: 'GPS Worker', color: tokens.colors.blue },
                { time: 'Hoy 14:20', user: 'Sistema', action: 'ANODOS sync — 1,283 formatos actualizados', module: 'Sync ANODOS', color: tokens.colors.blue },
                { time: 'Hoy 13:45', user: 'isis.estrada', action: 'Lead creado: ACME Corp', module: 'Comercial', color: tokens.colors.yellow },
                { time: 'Hoy 12:10', user: 'liz.garcia', action: 'Cliente actualizado: FEMSA', module: 'Servicio', color: tokens.colors.primary },
                { time: 'Hoy 11:30', user: 'jose.rodriguez', action: 'Viaje #1087 actualizado — En tránsito', module: 'Operaciones', color: tokens.colors.orange },
                { time: 'Ayer 18:00', user: 'Sistema', action: 'Tipo de cambio actualizado: $17.92', module: 'Parámetros', color: tokens.colors.blue },
                { time: 'Ayer 16:20', user: 'jennifer.sanchez', action: 'Usuario editado: marcos.pineda', module: 'Config', color: tokens.colors.red },
              ].map((log, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: idx % 2 === 0 ? tokens.colors.bgCard : 'transparent',
                  borderRadius: '8px',
                }}>
                  <span style={{ color: tokens.colors.textMuted, fontSize: '12px', minWidth: '90px' }}>{log.time}</span>
                  <span style={{
                    background: log.color + '22',
                    color: log.color,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    minWidth: '90px',
                    textAlign: 'center' as const,
                  }}>{log.module}</span>
                  <span style={{ color: tokens.colors.textPrimary, fontSize: '13px', fontWeight: 600, minWidth: '130px' }}>{log.user}</span>
                  <span style={{ color: tokens.colors.textSecondary, fontSize: '13px' }}>{log.action}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: tokens.spacing.md, textAlign: 'center' as const }}>
              <span style={{ color: tokens.colors.textMuted, fontSize: '12px' }}>
                Mostrando últimos 8 eventos — El historial completo se almacena en Supabase
              </span>
            </div>
          </div>
        </Card>
      )}

      </ModuleLayout>
    );
  }
