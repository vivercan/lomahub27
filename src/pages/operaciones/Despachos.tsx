import { useState, useCallback } from 'react';
import type { ReactElement, FormEvent } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Semaforo } from '../../components/ui/Semaforo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface Viaje {
  id?: string;
  folio: string;
  cliente: string;
  ruta: string;
  tipo: string;
  tracto: string;
  caja: string;
  operador: string;
  estado: string;
  citaDescarga: string;
  eta_calculado?: string;
  eta_imposible?: boolean;
}

interface ETAResponse {
  eta_timestamp: string;
  duracion_minutos: number;
  distancia_km: number;
  eta_imposible: boolean;
  paradas_nom087: number;
  horas_descanso_total: number;
  detalle: string;
}

interface NuevoViajeForm {
  cliente: string;
  origen: string;
  destino: string;
  tipo: string;
  tracto: string;
  caja: string;
  operador: string;
  hora_salida: string;
  cita_descarga: string;
  fv_machote_id: string;
}

function Modal({ open, onClose, titulo, children }: { open: boolean; onClose: () => void; titulo: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: tokens.colors.bgCard, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.lg, boxShadow: tokens.effects.cardShadow, padding: tokens.spacing.xl, minWidth: '480px', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: 0, marginBottom: tokens.spacing.lg, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '1.1rem' }}>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

export default function Despachos(): ReactElement {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [showNuevoViaje, setShowNuevoViaje] = useState(false);
  const [showETAWarning, setShowETAWarning] = useState(false);
  const [showFVBlock, setShowFVBlock] = useState(false);
  const [creandoViaje, setCreandoViaje] = useState(false);
  const [calculandoETA, setCalculandoETA] = useState(false);
  const [form, setForm] = useState<NuevoViajeForm>({
    cliente: '',
    origen: '',
    destino: '',
    tipo: '',
    tracto: '',
    caja: '',
    operador: '',
    hora_salida: '',
    cita_descarga: '',
    fv_machote_id: '',
  });

  const [etaResult, setEtaResult] = useState<ETAResponse | null>(null);
  const [notaETAImposible, setNotaETAImposible] = useState('');
  const [error, setError] = useState('');
  const [fvError, setFvError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => {
    const fetchViajes = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('viajes')
          .select('*')
          .order('created_at', { ascending: false });
        if (dbError) {
          console.error('Error fetching viajes:', dbError);
          setViajes([]);
        } else if (data) {
          const viajesFormatted: Viaje[] = data.map((v) => ({
            id: v.id,
            folio: v.folio || '\u2014',
            cliente: v.cliente_nombre || '\u2014',
            ruta: `${v.origen || '?'} \u2192 ${v.destino || '?'}`,
            tipo: v.tipo || '\u2014',
            tracto: v.tracto_numero || '\u2014',
            caja: v.caja_numero || '\u2014',
            operador: v.operador_nombre || '\u2014',
            estado: v.estado || 'programado',
            citaDescarga: v.cita_descarga ? new Date(v.cita_descarga).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '\u2014',
            eta_calculado: v.eta_calculado,
            eta_imposible: v.eta_imposible || false,
          }));
          setViajes(viajesFormatted);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setViajes([]);
      }
    };
    fetchViajes();
  }, []);

  const tipoColor = (tipo: string): 'primary' | 'green' | 'yellow' | 'orange' | 'red' | 'gray' | 'blue' => {
    switch (tipo) {
      case 'IMPO': return 'blue';
      case 'EXPO': return 'green';
      case 'NAC': return 'yellow';
      default: return 'gray';
    }
  };

  const estadoToSemaforo = (estado: string): 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'gris' | 'azul' => {
    switch (estado) {
      case 'en_transito': return 'verde';
      case 'programado': return 'amarillo';
      case 'cargando': return 'azul';
      case 'completado': return 'verde';
      case 'retrasado': return 'rojo';
      case 'en_riesgo': return 'naranja';
      default: return 'gris';
    }
  };

  const validarFV = useCallback(async (fvId: string): Promise<{ valido: boolean; mensaje: string }> => {
    if (!fvId) return { valido: true, mensaje: '' };
    try {
      const { data, error: dbError } = await supabase
        .from('formato_viaje')
        .select('id, numero, fecha_vigencia, estado')
        .eq('id', fvId)
        .single();
      if (dbError || !data) {
        return { valido: false, mensaje: 'No se encontr\u00f3 el FV/Machote seleccionado.' };
      }
      const hoy = new Date();
      const vigencia = new Date(data.fecha_vigencia);
      if (vigencia < hoy) {
        return { valido: false, mensaje: `FV ${data.numero} VENCIDO desde ${vigencia.toLocaleDateString('es-MX')}. No se puede despachar con machote vencido.` };
      }
      if (data.estado === 'inactivo' || data.estado === 'cancelado') {
        return { valido: false, mensaje: `FV ${data.numero} tiene estado "${data.estado}". No se puede despachar.` };
      }
      return { valido: true, mensaje: '' };
    } catch {
      return { valido: true, mensaje: '' };
    }
  }, []);

  const calcularETA = useCallback(async (origen: string, destino: string, hora_salida: string, cita_descarga?: string): Promise<ETAResponse | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesi\u00f3n no v\u00e1lida');
      const res = await fetch(`${supabaseUrl}/functions/v1/eta-calculator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ origen, destino, hora_salida, ...(cita_descarga ? { cita_descarga } : {}) }),
      });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error || `Error ${res.status}`); }
      return await res.json() as ETAResponse;
    } catch (err) {
      console.error('Error calculando ETA:', err);
      return null;
    }
  }, []);

  const registrarAlerta = useCallback(async (tipo: string, datos: Record<string, unknown>) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`${supabaseUrl}/functions/v1/alerta-engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ tipo, ...datos }),
      });
    } catch (err) {
      console.error('Error registrando alerta:', err);
    }
  }, []);

  const handleCrearViaje = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFvError('');
    if (!form.cliente || !form.origen || !form.destino || !form.tipo || !form.hora_salida) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    setCreandoViaje(true);
    try {
      if (form.fv_machote_id) {
        const fvResult = await validarFV(form.fv_machote_id);
        if (!fvResult.valido) {
          setFvError(fvResult.mensaje);
          setShowFVBlock(true);
          setCreandoViaje(false);
          // Registrar alerta de machote inactivo
          await registrarAlerta('ALERTA_MACHOTE_INACTIVO', {
            viaje_folio: `VJ-${Date.now()}`,
            fv_id: form.fv_machote_id,
            mensaje: fvResult.mensaje,
          });
          return;
        }
      }
      setCalculandoETA(true);
      const eta = await calcularETA(form.origen, form.destino, form.hora_salida, form.cita_descarga || undefined);
      setCalculandoETA(false);
      if (eta) {
        setEtaResult(eta);
        if (eta.eta_imposible) {
          setShowETAWarning(true);
          setCreandoViaje(false);
          return;
        }
      }
      await finalizarCreacionViaje(eta);
    } catch (err) {
      setError(`Error al crear viaje: ${err instanceof Error ? err.message : String(err)}`);
      setCreandoViaje(false);
    }
  };

  const handleConfirmarETAImposible = async () => {
    if (notaETAImposible.length < 20) {
      setError('La nota debe tener al menos 20 caracteres.');
      return;
    }
    setShowETAWarning(false);
    setCreandoViaje(true);
    await registrarAlerta('ALERTA_ETA_IMPOSIBLE', {
      origen: form.origen, destino: form.destino,
      eta_timestamp: etaResult?.eta_timestamp, cita_descarga: form.cita_descarga,
      nota_confirmacion: notaETAImposible, confirmado_por_usuario: true,
    });
    await finalizarCreacionViaje(etaResult);
  };

  const finalizarCreacionViaje = async (eta: ETAResponse | null) => {
    try {
      const nuevoFolio = `VJ-${new Date().getFullYear()}-${String(viajes.length + 1).padStart(3, '0')}`;
      const nuevoViaje: Record<string, unknown> = {
        folio: nuevoFolio,
        cliente_nombre: form.cliente,
        origen: form.origen,
        destino: form.destino,
        tipo: form.tipo,
        tracto_numero: form.tracto,
        caja_numero: form.caja,
        operador_nombre: form.operador,
        estado: 'programado',
        cita_descarga: form.cita_descarga || null,
        hora_salida: form.hora_salida,
        eta_calculado: eta?.eta_timestamp || null,
      };
      const { data: viajeDB, error: insertError } = await supabase
        .from('viajes').insert(nuevoViaje).select().single();
      if (viajeDB && !insertError) {
        await registrarAlerta('ALERTA_CITA_EN_RIESGO', {
          viaje_id: viajeDB.id, cita_descarga: form.cita_descarga,
          eta_timestamp: eta?.eta_timestamp, tipo_monitoreo: 'MONITOREO_ACTIVO',
        });
      }
      const viajeLocal: Viaje = {
        id: viajeDB?.id,
        folio: nuevoFolio,
        cliente: form.cliente,
        ruta: `${form.origen} \u2192 ${form.destino}`,
        tipo: form.tipo,
        tracto: form.tracto,
        caja: form.caja,
        operador: form.operador,
        estado: 'programado',
        citaDescarga: form.cita_descarga
          ? new Date(form.cita_descarga).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
          : '\u2014',
        eta_calculado: eta?.eta_timestamp,
        eta_imposible: eta?.eta_imposible,
      };
      setViajes((prev) => [viajeLocal, ...prev]);
      setForm({ cliente: '', origen: '', destino: '', tipo: '', tracto: '', caja: '', operador: '', hora_salida: '', cita_descarga: '', fv_machote_id: '' });
      setNotaETAImposible('');
      setEtaResult(null);
      setShowNuevoViaje(false);
      setError('');
    } catch (err) {
      setError(`Error guardando viaje: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCreandoViaje(false);
    }
  };

  const viajesFiltrados = viajes.filter((v) => {
    if (filtroEstado && v.estado !== filtroEstado) return false;
    if (filtroTipo && v.tipo !== filtroTipo) return false;
    return true;
  });

  const viajesColumns = [
    { key: 'folio', label: 'Folio' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'ruta', label: 'Origen \u2192 Destino' },
    { key: 'tipo', label: 'Tipo', render: (row: Viaje) => <Badge color={tipoColor(row.tipo)}>{row.tipo}</Badge> },
    { key: 'tracto', label: 'Tracto' },
    { key: 'caja', label: 'Caja' },
    { key: 'operador', label: 'Operador' },
    { key: 'estado', label: 'Estado', render: (row: Viaje) => <Semaforo estado={estadoToSemaforo(row.estado)} /> },
    { key: 'citaDescarga', label: 'Cita Descarga' },
    { key: 'eta_calculado', label: 'ETA', render: (row: Viaje) => {
      if (!row.eta_calculado) return <span style={{ color: tokens.colors.textMuted }}>\u2014</span>;
      const eta = new Date(row.eta_calculado);
      return (<span style={{ color: row.eta_imposible ? tokens.colors.red : tokens.colors.green }}>{eta.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}{row.eta_imposible && ' !!'}</span>);
    }},
  ];

  return (
    <ModuleLayout titulo="Despachos">
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Button variant="primary" onClick={() => setShowNuevoViaje(true)}>Nuevo Viaje</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <Select label="Estado" placeholder="Filtrar por estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} options={[
            { value: 'programado', label: 'Programado' },
            { value: 'cargando', label: 'Cargando' },
            { value: 'en_transito', label: 'En Tr\u00e1nsito' },
            { value: 'completado', label: 'Completado' },
            { value: 'retrasado', label: 'Retrasado' },
            { value: 'en_riesgo', label: 'En Riesgo' },
          ]}
        />
        <Select
          label="Tipo"
          placeholder="Filtrar por tipo"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          options={[
            { value: 'IMPO', label: 'Importación' },
            { value: 'EXPO', label: 'Exportación' },
            { value: 'NAC', label: 'Nacional' },
          ]}
        />
      </div>

      {/* Viajes del Día */}
      <Card>
        <div
          style={{
            marginBottom: tokens.spacing.md,
            paddingBottom: tokens.spacing.md,
            borderBottom: `1px solid ${tokens.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Viajes del Día</h3>
          <span style={{ color: tokens.colors.textMuted, fontSize: '0.85rem' }}>
            {viajesFiltrados.length} viaje{viajesFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>
        <DataTable columns={viajesColumns} data={viajesFiltrados} />
      </Card>

      {/* ═══════ MODAL: Nuevo Viaje ═══════ */}
      <Modal
        open={showNuevoViaje}
        onClose={() => { setShowNuevoViaje(false); setError(''); }}
        titulo="Nuevo Viaje"
      >
        <form onSubmit={handleCrearViaje}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.md }}>
            <Input
              label="Cliente *"
              placeholder="Nombre del cliente"
              value={form.cliente}
              onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
            />
            <Select
              label="Tipo *"
              placeholder="Seleccionar"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              options={[
                { value: 'IMPO', label: 'Importación' },
                { value: 'EXPO', label: 'Exportación' },
                { value: 'NAC', label: 'Nacional' },
              ]}
            />
            <Input
              label="Origen * (lat,lon o ciudad)"
              placeholder="ej: 25.6866,-100.3161 o Monterrey"
              value={form.origen}
              onChange={(e) => setForm((f) => ({ ...f, origen: e.target.value }))}
            />
            <Input
              label="Destino * (lat,lon o ciudad)"
              placeholder="ej: 19.4326,-99.1332 o CDMX"
              value={form.destino}
              onChange={(e) => setForm((f) => ({ ...f, destino: e.target.value }))}
            />
            <Input
              label="Hora Salida * (ISO)"
              type="datetime-local"
              value={form.hora_salida}
              onChange={(e) => setForm((f) => ({ ...f, hora_salida: e.target.value }))}
            />
            <Input
              label="Cita Descarga"
              type="datetime-local"
              value={form.cita_descarga}
              onChange={(e) => setForm((f) => ({ ...f, cita_descarga: e.target.value }))}
            />
            <Input
              label="Tracto"
              placeholder="TAC-XXX"
              value={form.tracto}
              onChange={(e) => setForm((f) => ({ ...f, tracto: e.target.value }))}
            />
            <Input
              label="Caja"
              placeholder="CAJ-XXX"
              value={form.caja}
              onChange={(e) => setForm((f) => ({ ...f, caja: e.target.value }))}
            />
            <Input
              label="Operador"
              placeholder="Nombre del operador"
              value={form.operador}
              onChange={(e) => setForm((f) => ({ ...f, operador: e.target.value }))}
            />
            <Input
              label="FV/Machote ID (opcional)"
              placeholder="UUID del FV"
              value={form.fv_machote_id}
              onChange={(e) => setForm((f) => ({ ...f, fv_machote_id: e.target.value }))}
            />
          </div>

          {error && (
            <div
              style={{
                marginTop: tokens.spacing.md,
                padding: tokens.spacing.sm,
                background: tokens.colors.redBg,
                border: `1px solid ${tokens.colors.red}`,
                borderRadius: tokens.radius.sm,
                color: tokens.colors.red,
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.spacing.sm, marginTop: tokens.spacing.lg }}>
            <Button variant="secondary" type="button" onClick={() => { setShowNuevoViaje(false); setError(''); }}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={creandoViaje || calculandoETA}>
              {calculandoETA ? 'Calculando ETA...' : creandoViaje ? 'Creando...' : 'Crear Viaje'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════ MODAL: Advertencia ETA Imposible ═══════ */}
      <Modal
        open={showETAWarning}
        onClose={() => setShowETAWarning(false)}
        titulo="ETA Imposible — Advertencia"
      >
        <div style={{ marginBottom: tokens.spacing.md }}>
          <div
            style={{
              padding: tokens.spacing.md,
              background: tokens.colors.redBg,
              border: `1px solid ${tokens.colors.red}`,
              borderRadius: tokens.radius.md,
              marginBottom: tokens.spacing.md,
            }}
          >
            <p style={{ margin: 0, color: tokens.colors.red, fontWeight: 'bold', marginBottom: tokens.spacing.xs }}>
              El ETA calculado supera la cita de descarga por más de 2 horas.
            </p>
            {etaResult && (
              <div style={{ color: tokens.colors.textSecondary, fontSize: '0.85rem', marginTop: tokens.spacing.sm }}>
                <p style={{ margin: '4px 0' }}>
                  <strong style={{ color: tokens.colors.textPrimary }}>ETA:</strong>{' '}
                  {new Date(etaResult.eta_timestamp).toLocaleString('es-MX')}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong style={{ color: tokens.colors.textPrimary }}>Distancia:</strong>{' '}
                  {etaResult.distancia_km} km
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong style={{ color: tokens.colors.textPrimary }}>Duración total:</strong>{' '}
                  {Math.floor(etaResult.duracion_minutos / 60)}h {etaResult.duracion_minutos % 60}min
                </p>
                {etaResult.paradas_nom087 > 0 && (
                  <p style={{ margin: '4px 0' }}>
                    <strong style={{ color: tokens.colors.textPrimary }}>Paradas NOM-087:</strong>{' '}
                    {etaResult.paradas_nom087} ({etaResult.horas_descanso_total}h descanso)
                  </p>
                )}
                <p style={{ margin: '4px 0' }}>
                  <strong style={{ color: tokens.colors.textPrimary }}>Detalle:</strong>{' '}
                  {etaResult.detalle}
                </p>
                {form.cita_descarga && (
                  <p style={{ margin: '4px 0' }}>
                    <strong style={{ color: tokens.colors.textPrimary }}>Cita descarga:</strong>{' '}
                    {new Date(form.cita_descarga).toLocaleString('es-MX')}
                  </p>
                )}
              </div>
            )}
          </div>

          <p style={{ color: tokens.colors.textSecondary, fontSize: '0.85rem', marginBottom: tokens.spacing.sm }}>
            Para confirmar de todas formas, escribe una nota obligatoria (mínimo 20 caracteres) explicando la razón:
          </p>

          <textarea
            value={notaETAImposible}
            onChange={(e) => setNotaETAImposible(e.target.value)}
            placeholder="Ej: Cliente aceptó hora flexible, se coordinará reagenda con destino..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: tokens.spacing.sm,
              background: tokens.colors.bgHover,
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: tokens.radius.sm,
              color: tokens.colors.textPrimary,
              fontFamily: tokens.fonts.body,
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
          />
          <span style={{ color: tokens.colors.textMuted, fontSize: '0.75rem' }}>
            {notaETAImposible.length}/20 caracteres mínimo
          </span>

          {error && (
            <div
              style={{
                marginTop: tokens.spacing.sm,
                color: tokens.colors.red,
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.spacing.sm }}>
          <Button variant="secondary" onClick={() => { setShowETAWarning(false); setError(''); }}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmarETAImposible}
            disabled={notaETAImposible.length < 20}
            loading={creandoViaje}
          >
            Confirmar de todas formas
          </Button>
        </div>
      </Modal>

      {/* ═══════ MODAL: FV/Machote Bloqueado ═══════ */}
      <Modal
        open={showFVBlock}
        onClose={() => setShowFVBlock(false)}
        titulo="Despacho Bloqueado — FV/Machote No Válido"
      >
        <div
          style={{
            padding: tokens.spacing.md,
            background: tokens.colors.redBg,
            border: `1px solid ${tokens.colors.red}`,
            borderRadius: tokens.radius.md,
            marginBottom: tokens.spacing.lg,
          }}
        >
          <p style={{ margin: 0, color: tokens.colors.red, fontWeight: 'bold', fontSize: '0.95rem' }}>
            DESPACHO BLOQUEADO
          </p>
          <p style={{ margin: '8px 0 0', color: tokens.colors.textSecondary, fontSize: '0.85rem' }}>
            {fvError}
          </p>
        </div>

        <p style={{ color: tokens.colors.textSecondary, fontSize: '0.85rem', margin: `0 0 ${tokens.spacing.md}` }}>
          Contacta a CS para actualizar el FV/Machote antes de intentar despachar nuevamente.
          Se ha enviado una alerta automática al equipo de CS y Operaciones.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowFVBlock(false)}>
            Entendido
          </Button>
        </div>
      </Modal>
    </ModuleLayout>
  );
}
