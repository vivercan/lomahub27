import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Semaforo } from '../../components/ui/Semaforo';
import type { SemaforoEstado } from '../../lib/tokens';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface Evento {
  evento: string;
  hora: string;
  estado: SemaforoEstado;
}

interface Viaje {
  id: string;
  cliente: string;
  origen: string;
  destino: string;
  tracto: string;
  caja: string;
  operador: string;
  estado: string;
  eta: string;
}

export default function TrazabilidadViaje(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchViajeAndEventos = async () => {
      try {
        if (!id) {
          setNotFound(true);
          return;
        }

        const { data: viajeData, error: viajeError } = await supabase
          .from('viajes')
          .select('*')
          .eq('id', id)
          .single();

        if (viajeError) {
          setNotFound(true);
          return;
        }

        setViaje(viajeData);

        const { data: eventosData, error: eventosError } = await supabase
          .from('gps_tracking')
          .select('*')
          .eq('viaje_id', id)
          .order('created_at', { ascending: true });

        if (!eventosError && eventosData) {
          setEventos(eventosData || []);
        }
      } catch (error) {
        console.error('Error fetching viaje:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchViajeAndEventos();
  }, [id]);

  if (notFound) {
    return (
      <ModuleLayout titulo="Trazabilidad">
        <Card>
          <div style={{ textAlign: 'center', padding: tokens.spacing.lg }}>
            <p style={{ color: tokens.colors.textPrimary, fontSize: '18px', marginBottom: tokens.spacing.md }}>
              Viaje no encontrado
            </p>
            <p style={{ color: tokens.colors.textSecondary }}>
              El viaje que buscas no existe en el sistema
            </p>
          </div>
        </Card>
      </ModuleLayout>
    );
  }

  if (!viaje) {
    return (
      <ModuleLayout titulo="Trazabilidad">
        <Card>
          <div style={{ textAlign: 'center', padding: tokens.spacing.lg }}>
            <p style={{ color: tokens.colors.textSecondary }}>Cargando...</p>
          </div>
        </Card>
      </ModuleLayout>
    );
  }

  const datosViaje = [
    { label: 'Cliente', value: viaje.cliente },
    { label: 'Origen', value: viaje.origen },
    { label: 'Destino', value: viaje.destino },
    { label: 'Tracto', value: viaje.tracto },
    { label: 'Caja', value: viaje.caja },
    { label: 'Operador', value: viaje.operador },
    { label: 'Estado', value: viaje.estado },
    { label: 'ETA', value: viaje.eta },
  ];

  return (
    <ModuleLayout titulo={`Trazabilidad — Viaje #${viaje.id}`}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.lg }}>
        {/* Left: Timeline */}
        <Card>
          <h3>Timeline de Eventos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
            {eventos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg font-medium">Sin datos</p>
                <p className="text-sm mt-1">Los datos se cargarán cuando estén disponibles en el sistema</p>
              </div>
            ) : (
              eventos.map((evento, index) => (
                <div key={index} style={{ display: 'flex', gap: tokens.spacing.md }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: tokens.spacing.sm }}>
                    <Semaforo estado={evento.estado as SemaforoEstado} />
                    {index < eventos.length - 1 && (
                      <div
                        style={{
                          width: '2px',
                          height: '40px',
                          backgroundColor: tokens.colors.border,
                        }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xs }}>
                    <span style={{ fontWeight: 600, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>
                      {evento.evento}
                    </span>
                    <span style={{ fontSize: '12px', color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                      {evento.hora}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
          <Card>
            <h3>Datos del Viaje</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
              {datosViaje.map((item) => (
                <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: tokens.spacing.md }}>
                  <span style={{ fontWeight: 600, color: tokens.colors.textSecondary, fontSize: '12px', fontFamily: tokens.fonts.body }}>
                    {item.label}
                  </span>
                  <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3>Mapa de Ruta</h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                backgroundColor: tokens.colors.bgHover,
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.colors.border}`,
                color: tokens.colors.textSecondary,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: tokens.spacing.sm, fontFamily: tokens.fonts.body }}>Mapa de Ruta</p>
                <p style={{ fontSize: '12px', fontFamily: tokens.fonts.body }}>
                  CDMX → Toluca → Querétaro → Guanajuato
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ModuleLayout>
  );
}
