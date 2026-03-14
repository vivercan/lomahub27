import { useState } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { DataTable } from '../../components/ui/DataTable';
import { MessageSquare } from 'lucide-react';
import { tokens } from '../../lib/tokens';

interface ClienteRow {
  id: string;
  cliente: string;
  ultima_carga: string;
  ruta_habitual: string;
  telefono: string;
  selected?: boolean;
}

const mockClientes: ClienteRow[] = [
  {
    id: '1',
    cliente: 'Manufactory Group',
    ultima_carga: '2026-03-10',
    ruta_habitual: 'CDMX → Monterrey',
    telefono: '+52 55 1234 5678',
  },
  {
    id: '2',
    cliente: 'Distribuidora México',
    ultima_carga: '2026-03-08',
    ruta_habitual: 'Guadalajara → CDMX',
    telefono: '+52 33 2468 1357',
  },
  {
    id: '3',
    cliente: 'Logística del Norte',
    ultima_carga: '2026-03-12',
    ruta_habitual: 'Monterrey → Saltillo',
    telefono: '+52 81 5678 9012',
  },
  {
    id: '4',
    cliente: 'Transportes Globales',
    ultima_carga: '2026-03-07',
    ruta_habitual: 'CDMX → Veracruz',
    telefono: '+52 229 3456 7890',
  },
];

export default function OfertaEquipo() {
  const [plaza, setPlaza] = useState<string>('');
  const [tipoEquipo, setTipoEquipo] = useState<string>('');
  const [selectedClientes, setSelectedClientes] = useState<Set<string>>(new Set());

  const toggleClienteSelection = (clienteId: string) => {
    const newSelected = new Set(selectedClientes);
    if (newSelected.has(clienteId)) {
      newSelected.delete(clienteId);
    } else {
      newSelected.add(clienteId);
    }
    setSelectedClientes(newSelected);
  };

  const handleBuscar = () => {
    console.log('Buscando clientes para:', { plaza, tipoEquipo });
  };

  const handleEnviarOferta = () => {
    console.log('Enviando oferta por WhatsApp a:', Array.from(selectedClientes));
  };

  const plazaOptions = [
    { value: 'monterrey', label: 'Monterrey' },
    { value: 'cdmx', label: 'CDMX' },
    { value: 'guadalajara', label: 'Guadalajara' },
    { value: 'veracruz', label: 'Veracruz' },
    { value: 'saltillo', label: 'Saltillo' },
  ];

  const equipoOptions = [
    { value: 'tractocamion', label: 'Tractocamión' },
    { value: 'volteo', label: 'Volteo' },
    { value: 'flatbed', label: 'Flatbed' },
    { value: 'refrigerado', label: 'Refrigerado' },
  ];

  const clienteColumns = [
    { key: 'cliente', label: 'Cliente', width: '25%' },
    { key: 'ultima_carga', label: 'Última Carga', width: '20%' },
    { key: 'ruta_habitual', label: 'Ruta Habitual', width: '30%' },
    { key: 'telefono', label: 'Teléfono', width: '25%' },
  ];

  return (
    <ModuleLayout titulo="Oferta de Equipo">
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: tokens.spacing.md,
            alignItems: 'end',
          }}
        >
          <Select
            label="Plaza"
            value={plaza}
            onChange={(e) => setPlaza(e.target.value)}
            options={plazaOptions}
            placeholder="Seleccionar plaza"
          />
          <Select
            label="Tipo de Equipo"
            value={tipoEquipo}
            onChange={(e) => setTipoEquipo(e.target.value)}
            options={equipoOptions}
            placeholder="Seleccionar tipo"
          />
          <Button onClick={handleBuscar} variant="secondary">
            Buscar Clientes
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Card>
          <div
            style={{
              marginBottom: tokens.spacing.md,
              paddingBottom: tokens.spacing.md,
              borderBottom: `1px solid ${tokens.colors.border}`,
            }}
          >
            <h3
              style={{
                fontSize: tokens.fonts.body,
                color: tokens.colors.textPrimary,
                margin: 0,
              }}
            >
              Clientes Históricos en esta zona
            </h3>
          </div>

          <div style={{ position: 'relative' }}>
            <DataTable columns={clienteColumns} data={mockClientes} />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              {mockClientes.map((cliente, index) => (
                <div
                  key={cliente.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: tokens.spacing.md,
                    height: '44px',
                    borderBottom: index < mockClientes.length - 1 ? `1px solid ${tokens.colors.border}` : 'none',
                    pointerEvents: 'auto',
                    marginTop: index === 0 ? '40px' : '0',
                  }}
                >
                <input
                  type="checkbox"
                  checked={selectedClientes.has(cliente.id)}
                  onChange={() => toggleClienteSelection(cliente.id)}
                  style={{
                    cursor: 'pointer',
                    marginRight: tokens.spacing.sm,
                  }}
                />
              </div>
            ))}
            </div>
          </div>
        </Card>
      </div>

      <Button
        onClick={handleEnviarOferta}
        variant="primary"
        disabled={selectedClientes.size === 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.sm,
        }}
      >
        <MessageSquare size={18} />
        Enviar Oferta por WhatsApp
      </Button>
    </ModuleLayout>
  );
}
