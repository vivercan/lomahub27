import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { DataTable } from '../../components/ui/DataTable';
import { MessageSquare } from 'lucide-react';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface ClienteRow {
  id: string;
  cliente: string;
  ultima_carga: string;
  ruta_habitual: string;
  telefono: string;
  selected?: boolean;
}

export default function OfertaEquipo() {
  const [plaza, setPlaza] = useState<string>('');
  const [tipoEquipo, setTipoEquipo] = useState<string>('');
  const [selectedClientes, setSelectedClientes] = useState<Set<string>>(new Set());
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase.from('clientes').select('id, nombre, telefono').order('nombre', { ascending: true });
        if (error) { console.error('Error:', error); setClientes([]); }
        else if (data) { setClientes(data.map((c) => ({ id: c.id, cliente: c.nombre || 'Sin nombre', ultima_carga: '—', ruta_habitual: '—', telefono: c.telefono || '—' }))); }
      } catch (err) { console.error('Error:', err); setClientes([]); } finally { setLoading(false); }
    };
    fetchClientes();
  }, []);

  const toggleClienteSelection = (clienteId: string) => {
    const n = new Set(selectedClientes);
    if (n.has(clienteId)) n.delete(clienteId); else n.add(clienteId);
    setSelectedClientes(n);
  };

  const handleBuscar = () => console.log('Buscando:', { plaza, tipoEquipo });
  const handleEnviarOferta = () => console.log('Enviando a:', Array.from(selectedClientes));

  const plazaOptions = [{ value: 'monterrey', label: 'Monterrey' },{ value: 'cdmx', label: 'CDMX' },{ value: 'guadalajara', label: 'Guadalajara' },{ value: 'veracruz', label: 'Veracruz' },{ value: 'saltillo', label: 'Saltillo' }];
  const equipoOptions = [{ value: 'tractocamion', label: 'Tractocamión' },{ value: 'volteo', label: 'Volteo' },{ value: 'flatbed', label: 'Flatbed' },{ value: 'refrigerado', label: 'Refrigerado' }];
  const clienteColumns = [{ key: 'cliente', label: 'Cliente', width: '25%' },{ key: 'ultima_carga', label: 'Última Carga', width: '20%' },{ key: 'ruta_habitual', label: 'Ruta Habitual', width: '30%' },{ key: 'telefono', label: 'Teléfono', width: '25%' }];

  return (
    <ModuleLayout titulo="Oferta de Equipo">
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: tokens.spacing.md, alignItems: 'end' }}>
          <Select label="Plaza" value={plaza} onChange={(e) => setPlaza(e.target.value)} options={plazaOptions} placeholder="Seleccionar plaza" />
          <Select label="Tipo de Equipo" value={tipoEquipo} onChange={(e) => setTipoEquipo(e.target.value)} options={equipoOptions} placeholder="Seleccionar tipo" />
          <Button onClick={handleBuscar} variant="secondary">Buscar Clientes</Button>
        </div>
      </div>
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Card>
          <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
            <h3 style={{ fontSize: tokens.fonts.body, color: tokens.colors.textPrimary, margin: 0 }}>Clientes Históricos en esta zona</h3>
          </div>
          {clientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textSecondary }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>Sin datos</p>
              <p style={{ fontSize: '0.85rem', marginTop: tokens.spacing.sm }}>Los datos se cargarán cuando estén disponibles</p>
            </div>
          ) : (<DataTable columns={clienteColumns} data={clientes} />)}
        </Card>
      </div>
      <Button onClick={handleEnviarOferta} variant="primary" disabled={selectedClientes.size === 0} style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
        <MessageSquare size={18} /> Enviar Oferta por WhatsApp
      </Button>
    </ModuleLayout>
  );
}
