import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Semaforo } from '../../components/ui/Semaforo';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface EquipoRow {
  tipo_equipo: string;
  disponibles: number;
  en_camino: number;
  total: number;
}

interface PlazaData {
  nombre: string;
  estado: 'verde' | 'rojo';
  equipos: EquipoRow[];
}

export default function Disponibilidad() {
  const [activeTab, setActiveTab] = useState<'12h' | '24h' | '48h'>('12h');
  const [plazasData, setPlazasData] = useState<PlazaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      try {
        setLoading(true);
        const { data: tractos, error: tractosError } = await supabase.from('tractos').select('*');
        const { data: cajas, error: cajasError } = await supabase.from('cajas').select('*');
        if (tractosError || cajasError) { console.error('Error:', tractosError || cajasError); setPlazasData([]); return; }
        const plazasMap = new Map<string, PlazaData>();
        (tractos || []).forEach((t: any) => {
          const u = t.ubicacion || 'Sin ubicación';
          if (!plazasMap.has(u)) plazasMap.set(u, { nombre: u, estado: 'verde', equipos: [{ tipo_equipo: 'Tractocamión', disponibles: 0, en_camino: 0, total: 0 }, { tipo_equipo: 'Cajas', disponibles: 0, en_camino: 0, total: 0 }] });
          const p = plazasMap.get(u)!; p.equipos[0].total += 1;
          if (t.estado === 'disponible') p.equipos[0].disponibles += 1; else p.equipos[0].en_camino += 1;
        });
        (cajas || []).forEach((c: any) => {
          const u = c.ubicacion || 'Sin ubicación';
          if (!plazasMap.has(u)) plazasMap.set(u, { nombre: u, estado: 'verde', equipos: [{ tipo_equipo: 'Tractocamión', disponibles: 0, en_camino: 0, total: 0 }, { tipo_equipo: 'Cajas', disponibles: 0, en_camino: 0, total: 0 }] });
          const p = plazasMap.get(u)!; p.equipos[1].total += 1;
          if (c.estado === 'disponible') p.equipos[1].disponibles += 1; else p.equipos[1].en_camino += 1;
        });
        const plazas = Array.from(plazasMap.values()).map(p => ({ ...p, estado: (() => { const t = p.equipos.reduce((s, e) => s + e.total, 0); const d = p.equipos.reduce((s, e) => s + e.disponibles, 0); return t === 0 ? 'rojo' as const : (d / t) * 100 >= 50 ? 'verde' as const : 'rojo' as const; })() }));
        setPlazasData(plazas);
      } catch (err) { console.error('Error:', err); setPlazasData([]); } finally { setLoading(false); }
    };
    fetchDisponibilidad();
  }, []);

  const tabButtons = ['12h', '24h', '48h'] as const;
  const equipoColumns = [
    { key: 'tipo_equipo', label: 'Tipo de Equipo', width: '40%' },
    { key: 'disponibles', label: 'Disponibles', width: '20%' },
    { key: 'en_camino', label: 'En Camino', width: '20%' },
    { key: 'total', label: 'Total', width: '20%' },
  ];

  return (
    <ModuleLayout titulo="Disponibilidad de Flota">
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
          {tabButtons.map((tab) => (
            <Button key={tab} onClick={() => setActiveTab(tab)} variant={activeTab === tab ? 'primary' : 'secondary'} size="sm">{tab}</Button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}><p>Cargando...</p></div>
      ) : plazasData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
          <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.md }}>
          {plazasData.map((plaza) => (
            <Card key={plaza.nombre}>
              <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
                <h3 style={{ fontSize: tokens.fonts.body, color: tokens.colors.textPrimary, margin: 0 }}>{plaza.nombre}</h3>
              </div>
              <div style={{ marginBottom: tokens.spacing.md }}><DataTable columns={equipoColumns} data={plaza.equipos} /></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Semaforo estado={plaza.estado} label={plaza.estado === 'verde' ? 'Suficiente' : 'Sobredisponibilidad'} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </ModuleLayout>
  );
}
