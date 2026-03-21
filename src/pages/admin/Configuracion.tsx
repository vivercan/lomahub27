import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Plus } from 'lucide-react';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'Admin' | 'Gerente' | 'Operador' | 'Ejecutivo' | 'Visualizador';
  empresa: string;
  estado: 'activo' | 'inactivo';
}

type TabType = 'usuarios' | 'catalogos' | 'parametros' | 'integraciones' | 'auditoria';

function getRolBadgeColor(rol: string): 'primary' | 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange' {
  switch (rol) {
    case 'Admin':
      return 'red';
    case 'Gerente':
      return 'yellow';
    case 'Operador':
      return 'blue';
    case 'Ejecutivo':
      return 'green';
    case 'Visualizador':
      return 'gray';
    default:
      return 'gray';
  }
}

function getEstadoBadgeColor(estado: string): 'green' | 'gray' {
  return estado === 'activo' ? 'green' : 'gray';
}

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState<TabType>('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nombre, email, rol, empresa, estado')
          .order('nombre', { ascending: true });

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

    fetchUsuarios();
  }, []);

  const tabs: TabType[] = ['usuarios', 'catalogos', 'parametros', 'integraciones', 'auditoria'];

  const usuarioColumns = [
    { key: 'nombre', label: 'Nombre', width: '20%' },
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
      width: '15%',
      render: (row: Usuario) => (
        <Badge color={getEstadoBadgeColor(row.estado)}>
          {row.estado === 'activo' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '5%',
      render: (_row: Usuario) => (
        <div style={{ display: 'flex', gap: tokens.spacing.xs }}>
          <Button variant="secondary" size="sm">
            Editar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ModuleLayout titulo="ConfiguraciÃ³n del Sistema">
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
              <p style={{ fontSize: '0.85rem', marginTop: tokens.spacing.sm }}>Los datos se cargarÃ¡n cuando estÃ©n disponibles en el sistema</p>
            </div>
          ) : (
            <DataTable columns={usuarioColumns} data={usuarios} />
          )}
        </Card>
      )}

      {activeTab === 'catalogos' && (
        <Card>
          <div
            style={{
              padding: tokens.spacing.lg,
              textAlign: 'center',
              color: tokens.colors.textSecondary,
            }}
          >
            <p style={{ margin: 0 }}>GestiÃ³n de CatÃ¡logos (Implementar segÃºn especificaciones)</p>
          </div>
        </Card>
      )}

      {activeTab === 'parametros' && (
        <Card>
          <div
            style={{
              padding: tokens.spacing.lg,
              textAlign: 'center',
              color: tokens.colors.textSecondary,
            }}
          >
            <p style={{ margin: 0 }}>ParÃ¡metros del Sistema (Implementar segÃºn especificaciones)</p>
          </div>
        </Card>
      )}

      {activeTab === 'integraciones' && (
        <Card>
          <div
            style={{
              padding: tokens.spacing.lg,
              textAlign: 'center',
              color: tokens.colors.textSecondary,
            }}
          >
            <p style={{ margin: 0 }}>Integraciones (Implementar segÃºn especificaciones)</p>
          </div>
        </Card>
      )}

      {activeTab === 'auditoria' && (
        <Card>
          <div
            style={{
              padding: tokens.spacing.lg,
              textAlign: 'center',
              color: tokens.colors.textSecondary,
            }}
          >
            <p style={{ margin: 0 }}>AuditorÃ­a del Sistema (Implementar segÃºn especificaciones)</p>
          </div>
        </Card>
      )}
    </ModuleLayout>
  );
}
