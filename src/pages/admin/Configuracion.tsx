import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Plus, X } from 'lucide-react';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

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

      {activeTab === 'catalogos' && (
        <Card>
          <div style={{ padding: tokens.spacing.lg, textAlign: 'center', color: tokens.colors.textSecondary }}>
            <p style={{ margin: 0 }}>Gestión de Catálogos (Implementar según especificaciones)</p>
          </div>
        </Card>
      )}

      {activeTab === 'parametros' && (
        <Card>
          <div style={{ padding: tokens.spacing.lg, textAlign: 'center', color: tokens.colors.textSecondary }}>
            <p style={{ margin: 0 }}>Parámetros del Sistema (Implementar según especificaciones)</p>
          </div>
        </Card>
      )}

      {activeTab === 'integraciones' && (
        <Card>
          <div style={{ padding: tokens.spacing.lg, textAlign: 'center', color: tokens.colors.textSecondary }}>
            <p style={{ margin: 0 }}>Integraciones (Implementar según especificaciones)</p>
          </div>
        </Card>
      )}

      {activeTab === 'auditoria' && (
        <Card>
          <div style={{ padding: tokens.spacing.lg, textAlign: 'center', color: tokens.colors.textSecondary }}>
            <p style={{ margin: 0 }}>Auditoría del Sistema (Implementar según especificaciones)</p>
          </div>
        </Card>
      )}
    </ModuleLayout>
  );
}
