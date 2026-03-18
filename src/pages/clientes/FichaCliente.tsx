import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Semaforo } from '../../components/ui/Semaforo';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface Cliente {
  id: string;
  razon_social: string;
  rfc: string;
  tipo: string;
  segmento: string;
  ejecutivo: string;
  empresa: string;
  fecha_alta: string;
}

interface Viaje {
  id: string;
  origen: string;
  destino: string;
  estado: string;
  eta: string;
}

export default function FichaCliente(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [viajesActivos, setViajesActivos] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchClienteAndViajes = async () => {
      try {
        if (!id) {
          setNotFound(true);
          return;
        }

        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single();

        if (clienteError) {
          setNotFound(true);
          return;
        }

        setCliente(clienteData);

        const { data: viajesData, error: viajesError } = await supabase
          .from('viajes')
          .select('*')
          .eq('cliente_id', id)
          .in('estado', ['en_transito', 'programado']);

        if (!viajesError) {
          setViajesActivos(viajesData || []);
        }
      } catch (error) {
        console.error('Error fetching cliente:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchClienteAndViajes();
  }, [id]);

  if (notFound) {
    return (
      <ModuleLayout titulo="Cliente">
        <Card>
          <div style={{ textAlign: 'center', padding: tokens.spacing.lg }}>
            <p style={{ color: tokens.colors.textPrimary, fontSize: '18px', marginBottom: tokens.spacing.md }}>
              Cliente no encontrado
            </p>
            <p style={{ color: tokens.colors.textSecondary }}>
              El cliente que buscas no existe en el sistema
            </p>
          </div>
        </Card>
      </ModuleLayout>
    );
  }

  if (!cliente) {
    return (
      <ModuleLayout titulo="Cliente">
        <Card>
          <div style={{ textAlign: 'center', padding: tokens.spacing.lg }}>
            <p style={{ color: tokens.colors.textSecondary }}>Cargando...</p>
          </div>
        </Card>
      </ModuleLayout>
    );
  }

  const datosMaestros = [
    { label: 'Razón Social', value: cliente.razon_social },
    { label: 'RFC', value: cliente.rfc },
    { label: 'Tipo', value: cliente.tipo },
    { label: 'Segmento', value: cliente.segmento },
    { label: 'Ejecutivo', value: cliente.ejecutivo },
    { label: 'Empresa', value: cliente.empresa },
    { label: 'Fecha de Alta', value: cliente.fecha_alta },
  ];

  const historialInteracciones: Array<{ fecha: string; tipo: string; detalle: string }> = [];

  const viajesColumns = [
    { key: 'id', label: 'ID Viaje' },
    { key: 'origen', label: 'Origen' },
    { key: 'destino', label: 'Destino' },
    { key: 'estado', label: 'Estado', render: (row: typeof viajesActivos[0]) => <Semaforo estado={row.estado as 'verde' | 'amarillo' | 'rojo'} /> },
    { key: 'eta', label: 'ETA' },
  ];

  const interaccionesColumns = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'notas', label: 'Notas' },
  ];

  return (
    <ModuleLayout titulo={`Cliente — ${cliente.razon_social}`}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.lg }}>
        {/* Left Column: Datos Maestros */}
        <Card>
          <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
            <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Datos Maestros</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
            {datosMaestros.map((item) => (
              <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: tokens.spacing.md }}>
                <span style={{ fontWeight: 600, color: tokens.colors.textSecondary }}>
                  {item.label}
                </span>
                <span style={{ color: tokens.colors.textPrimary }}>
                  {item.label === 'Tipo' ? <Badge color="primary">{item.value}</Badge> : item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
          {/* Radiografía Financiera */}
          <Card>
            <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Radiografía Financiera</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: tokens.spacing.md }}>
              <KPICard titulo="Facturación Mensual" valor="$450K" color="primary" />
              <KPICard titulo="Saldo CXC" valor="$120K" color="red" />
              <KPICard titulo="Días Crédito" valor="30" color="primary" />
            </div>
          </Card>

          {/* Viajes Activos */}
          <Card>
            <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Viajes Activos</h3>
            </div>
            {viajesActivos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg font-medium">Sin datos</p>
                <p className="text-sm mt-1">Los datos se cargarán cuando estén disponibles en el sistema</p>
              </div>
            ) : (
              <DataTable columns={viajesColumns} data={viajesActivos} />
            )}
          </Card>
        </div>
      </div>

      {/* Historial de Interacciones */}
      <div style={{ marginTop: tokens.spacing.lg }}>
        <Card>
          <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
            <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Historial de Interacciones</h3>
          </div>
          {historialInteracciones.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium">Sin datos</p>
              <p className="text-sm mt-1">Los datos se cargarán cuando estén disponibles en el sistema</p>
            </div>
          ) : (
            <DataTable columns={interaccionesColumns} data={historialInteracciones} />
          )}
        </Card>
      </div>
    </ModuleLayout>
  );
                }
