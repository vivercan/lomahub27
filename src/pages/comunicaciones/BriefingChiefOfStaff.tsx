import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Copy,
  Mail,
  Share2,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { tokens } from '../../lib/tokens';

interface Metrics {
  cotizaciones_pedidas?: number;
  cotizaciones_enviadas?: number;
  leads_nuevos?: number;
  leads_activos?: number;
  oportunidades_activas?: number;
  respuestas_recibidas?: number;
  correos_entrantes?: number;
  correos_salientes?: number;
  viajes_en_transito?: number;
  unidades_activas?: number;
  unidades_totales?: number;
  utilizacion_flota_pct?: number;
  cartera_vencida?: number;
  incidencias_abiertas?: number;
  whatsapp_mensajes?: number;
}

interface DatosAccion {
  to?: string;
  subject?: string;
  body_draft?: string;
}

interface Pendiente {
  prioridad: 'alta' | 'media' | 'baja';
  status: 'nuevo' | 'recurrente' | 'resuelto';
  titulo: string;
  descripcion?: string;
  accion_sugerida?: string;
  responsable?: string;
  tipo_accion?: 'email_draft' | 'llamada' | 'seguimiento' | 'revision' | 'escalamiento' | 'otro';
  datos_accion?: DatosAccion;
  impacto_estimado?: string;
}

interface TimelineEntry {
  hora: string;
  evento: string;
  detalle?: string;
}

interface CierreDia {
  logros?: string[];
  pendientes_manana?: string[];
  metricas_comparadas?: Record<string, { am: number; pm: number }>;
}

interface Briefing {
  id: string;
  created_at: string;
  tipo: 'morning' | 'evening';
  fecha: string;
  resumen_ejecutivo: string;
  metricas: Metrics;
  pendientes: Pendiente[];
  timeline: TimelineEntry[];
  cierre_dia: CierreDia;
  access_token: string;
  usuario_id: string;
}

const formatSpanishDate = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const day = days[date.getDay()];
  const dateNum = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}, ${dateNum} de ${month} ${year}`;
};

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getPriorityColor = (prioridad: string): string => {
  switch (prioridad) {
    case 'alta':
      return '#ef4444';
    case 'media':
      return '#f59e0b';
    case 'baja':
      return '#10b981';
    default:
      return '#9ba8c3';
  }
};

const getPriorityBadgeEmoji = (prioridad: string): string => {
  switch (prioridad) {
    case 'alta':
      return '🔴';
    case 'media':
      return '🟡';
    case 'baja':
      return '🟢';
    default:
      return '⚪';
  }
};

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'nuevo':
      return 'rgba(59, 130, 246, 0.15)';
    case 'recurrente':
      return 'rgba(249, 115, 22, 0.15)';
    case 'resuelto':
      return 'rgba(34, 197, 94, 0.15)';
    default:
      return 'rgba(107, 114, 128, 0.15)';
  }
};

const getStatusBadgeTextColor = (status: string): string => {
  switch (status) {
    case 'nuevo':
      return '#3b82f6';
    case 'recurrente':
      return '#f97316';
    case 'resuelto':
      return '#22c55e';
    default:
      return '#6b7280';
  }
};

const getMetricColor = (value: number | undefined, threshold: number = 0): string => {
  if (value === undefined || value === null) return '#ef4444';
  return value > threshold ? '#10b981' : '#ef4444';
};

const MetricCard: React.FC<{ label: string; value: number | undefined; format?: 'currency' | 'percentage' | 'number' }> = ({
  label,
  value,
  format = 'number',
}) => {
  let displayValue = '—';
  if (value !== undefined && value !== null) {
    if (format === 'currency') {
      displayValue = formatCurrency(value);
    } else if (format === 'percentage') {
      displayValue = `${value}%`;
    } else {
      displayValue = value.toString();
    }
  }

  const color = getMetricColor(value);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 50%, rgba(33,33,43,1) 100%)',
        borderRadius: '16px',
        border: `1px solid ${value === undefined || value === 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(155,168,195,0.18)'}`,
        boxShadow: '0 6px 16px rgba(0,0,0,0.22), 0 2px 4px rgba(0,0,0,0.18)',
        padding: '16px 20px',
        flex: '1 1 0',
        minWidth: '0',
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: 800, color: color, marginBottom: '6px' }}>
        {displayValue}
      </div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.50)', lineHeight: '1.3' }}>{label}</div>
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#F7F8FA',
      fontFamily: tokens.fonts.heading,
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <Loader2
        size={48}
        style={{
          color: 'rgba(15, 23, 42, 0.55)',
          marginBottom: '16px',
          animation: 'spin 1s linear infinite',
        }}
      />
      <div style={{ color: 'rgba(15, 23, 42, 0.55)', fontSize: '14px' }}>Cargando briefing...</div>
    </div>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#F7F8FA',
      fontFamily: tokens.fonts.heading,
      padding: '24px',
    }}
  >
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 50%, rgba(33,33,43,1) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        padding: '48px 32px',
        textAlign: 'center',
        maxWidth: '500px',
      }}
    >
      <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px', margin: '0 auto 16px' }} />
      <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.87)', marginBottom: '12px' }}>
        No se pudo cargar el briefing
      </div>
      <div style={{ fontSize: '14px', color: 'rgba(15, 23, 42, 0.55)' }}>{message}</div>
    </div>
  </div>
);

const PendienteCard: React.FC<{ pendiente: Pendiente; index: number }> = ({ pendiente, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const copyEmailDraft = () => {
    if (pendiente.datos_accion?.body_draft) {
      navigator.clipboard.writeText(pendiente.datos_accion.body_draft);
    }
  };

  const openMailto = () => {
    if (pendiente.datos_accion?.to && pendiente.datos_accion?.subject) {
      const body = pendiente.datos_accion?.body_draft || '';
      window.location.href = `mailto:${pendiente.datos_accion.to}?subject=${encodeURIComponent(pendiente.datos_accion.subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <div
      key={index}
      style={{
        background: 'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 50%, rgba(33,33,43,1) 100%)',
        borderRadius: '20px',
        border: `1px solid rgba(155,168,195,0.18)`,
        boxShadow: '0 10px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.28)',
        overflow: 'hidden',
        marginBottom: '16px',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '24px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>{getPriorityBadgeEmoji(pendiente.prioridad)}</span>
            <div
              style={{
                background: getStatusBadgeColor(pendiente.status),
                color: getStatusBadgeTextColor(pendiente.status),
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {pendiente.status}
            </div>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.87)', marginBottom: '8px' }}>
            {pendiente.titulo}
          </div>
          {pendiente.responsable && (
            <div style={{ fontSize: '12px', color: 'rgba(15, 23, 42, 0.50)' }}>Responsable: {pendiente.responsable}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isExpanded ? (
            <ChevronUp size={24} style={{ color: 'rgba(15, 23, 42, 0.35)' }} />
          ) : (
            <ChevronDown size={24} style={{ color: 'rgba(15, 23, 42, 0.35)' }} />
          )}
        </div>
      </div>

      {isExpanded && (
        <div
          style={{
            padding: '24px',
            borderTop: '1px solid rgba(155,168,195,0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          {pendiente.descripcion && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.50)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Descripción
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(15, 23, 42, 0.75)', lineHeight: '1.6' }}>
                {pendiente.descripcion}
              </div>
            </div>
          )}

          {pendiente.accion_sugerida && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.50)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Acción Sugerida
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(15, 23, 42, 0.75)', lineHeight: '1.6' }}>
                {pendiente.accion_sugerida}
              </div>
            </div>
          )}

          {pendiente.impacto_estimado && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.50)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Impacto Estimado
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(15, 23, 42, 0.75)', lineHeight: '1.6' }}>
                {pendiente.impacto_estimado}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {pendiente.tipo_accion === 'email_draft' && pendiente.datos_accion?.body_draft && (
              <button
                onClick={copyEmailDraft}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: tokens.fonts.heading,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                }}
              >
                <Copy size={16} />
                Copiar Borrador
              </button>
            )}

            {pendiente.datos_accion?.to && (
              <button
                onClick={openMailto}
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: tokens.fonts.heading,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                }}
              >
                <Mail size={16} />
                Responder
              </button>
            )}

            <button
              style={{
                background: 'rgba(249, 115, 22, 0.2)',
                color: '#f97316',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                padding: '10px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: tokens.fonts.heading,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)';
              }}
            >
              <Share2 size={16} />
              Delegar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineSection: React.FC<{ timeline: TimelineEntry[] }> = ({ timeline }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!timeline || timeline.length === 0) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 50%, rgba(33,33,43,1) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(155,168,195,0.18)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.28)',
        overflow: 'hidden',
        marginBottom: '24px',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '24px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Clock size={20} style={{ color: 'rgba(15, 23, 42, 0.55)' }} />
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.87)' }}>Cronograma del Día</div>
        </div>
        {isExpanded ? (
          <ChevronUp size={24} style={{ color: 'rgba(15, 23, 42, 0.35)' }} />
        ) : (
          <ChevronDown size={24} style={{ color: 'rgba(15, 23, 42, 0.35)' }} />
        )}
      </div>

      {isExpanded && (
        <div
          style={{
            padding: '24px',
            borderTop: '1px solid rgba(155,168,195,0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ position: 'relative', paddingLeft: '40px' }}>
            {timeline.map((entry, index) => (
              <div key={index} style={{ marginBottom: index === timeline.length - 1 ? 0 : '24px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-24px',
                    top: '6px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(34, 197, 94, 0.8))',
                    border: '2px solid rgba(15, 23, 42, 0.08)',
                  }}
                />
                {index !== timeline.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '-18px',
                      top: '24px',
                      width: '2px',
                      height: 'calc(100% + 12px)',
                      background: 'rgba(155,168,195,0.2)',
                    }}
                  />
                )}
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.50)', marginBottom: '4px' }}>
                  {entry.hora}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.87)', marginBottom: '4px' }}>
                  {entry.evento}
                </div>
                {entry.detalle && (
                  <div style={{ fontSize: '13px', color: 'rgba(15, 23, 42, 0.55)', lineHeight: '1.5' }}>
                    {entry.detalle}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CierreDiaSection: React.FC<{ cierreDia: CierreDia }> = ({ cierreDia }) => {
  const [expandedLogros, setExpandedLogros] = useState(true);
  const [expandedPendientes, setExpandedPendientes] = useState(true);

  const hasLogros = cierreDia?.logros && cierreDia.logros.length > 0;
  const hasPendientes = cierreDia?.pendientes_manana && cierreDia.pendientes_manana.length > 0;

  if (!hasLogros && !hasPendientes) return null;

  return (
    <div>
      {hasLogros && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 50%, rgba(33,33,43,1) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.28)',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          <div
            onClick={() => setExpandedLogros(!expandedLogros)}
            style={{
              padding: '24px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.87)' }}>Lo que se logró hoy</div>
            </div>
            {expandedLogros ? (
              <ChevronUp size={24} style={{ color: 'rgba(15, 23, 42, 0.35)' }} />
            ) : (
              <ChevronDown size={24} style={{ color: 'rgba(15, 23, 42, 0.35)' }} />
            )}
          </div>

          {expandedLogros && (
            <div
              style={{
                padding: '24px',
                borderTop: '1px solid rgba(155,168,195,0.1)',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cierreDia.logros?.map((logro, index) => (
                  <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '18px', marginTop: '2px', flexShrink: 0 }}>✓</span>
                    <div style={{ fontSize: '14px', color: 'rgba(15, 23, 42, 0.75)', lineHeight: '1.6' }}>
                      {logro}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {hasPendientes && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 50%, rgba(33,33,43,1) 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.28)',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          <div
            onClick={() => setExpandedPendientes(!expandedPendientes)}
            style={{
              padding: '24px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={20} style={{ color: '#f97316' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.87)' }}>Pendiente para mañana</div>
            </div>
            {expandedPendientes ? (
              <ChevronUp size={24} style={{ color: 'rgba(15, 23, 42, 0.35)' }} />
            ) : (
              <ChevronDown size={24} style={{ color: 'rgba(15, 23, 42, 0.35)' }} />
            )}
          </div>

          {expandedPendientes && (
            <div
              style={{
                padding: '24px',
                borderTop: '1px solid rgba(155,168,195,0.1)',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cierreDia.pendientes_manana?.map((pendiente, index) => (
                  <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '18px', marginTop: '2px', flexShrink: 0 }}>◆</span>
                    <div style={{ fontSize: '14px', color: 'rgba(15, 23, 42, 0.75)', lineHeight: '1.6' }}>
                      {pendiente}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BriefingChiefOfStaff: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBriefing = async () => {
      if (!id || !token) {
        setError('Parámetros inválidos. Se requiere ID y token.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('briefings')
          .select('*')
          .eq('id', id)
          .eq('access_token', token)
          .single();

        if (fetchError) {
          setError('Briefing no encontrado o token inválido.');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Briefing no encontrado.');
          setLoading(false);
          return;
        }

        setBriefing(data as Briefing);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar el briefing. Intenta más tarde.');
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [id, token]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !briefing) {
    return <ErrorState message={error || 'Briefing no disponible'} />;
  }

  const sortedPendientes = [...(briefing.pendientes || [])].sort((a, b) => {
    const priorityOrder = { alta: 0, media: 1, baja: 2 };
    return (priorityOrder[a.prioridad] ?? 3) - (priorityOrder[b.prioridad] ?? 3);
  });

  const briefingType = briefing.tipo === 'morning' ? 'Briefing Matutino' : 'Cierre del Día';

  return (
    <ModuleLayout titulo="Briefing Chief of Staff">
    <div
      style={{
        backgroundColor: '#F7F8FA',
        minHeight: '100vh',
        fontFamily: tokens.fonts.heading,
        color: 'rgba(15, 23, 42, 0.87)',
        padding: '16px',
      }}
    >
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background-color: #F7F8FA;
          }
        `}
      </style>

      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 8px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(34, 197, 94, 0.3))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={28} style={{ color: 'rgba(15, 23, 42, 0.75)' }} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'rgba(15, 23, 42, 0.92)' }}>
                AI Chief of Staff
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(15, 23, 42, 0.50)', marginTop: '4px' }}>
                {formatSpanishDate(briefing.fecha)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
            <div
              style={{
                background:
                  briefing.tipo === 'morning'
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'rgba(249, 115, 22, 0.15)',
                color:
                  briefing.tipo === 'morning'
                    ? '#3b82f6'
                    : '#f97316',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {briefingType}
            </div>
          </div>

          <div
            style={{
              height: '3px',
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(34, 197, 94, 0.4))',
              borderRadius: '2px',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.50)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Métricas Clave
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
            }}
          >
            <MetricCard label="Cotizaciones Pedidas" value={briefing.metricas?.cotizaciones_pedidas} />
            <MetricCard label="Cotizaciones Enviadas" value={briefing.metricas?.cotizaciones_enviadas} />
            <MetricCard label="Leads Nuevos" value={briefing.metricas?.leads_nuevos} />
            <MetricCard label="Leads Activos" value={briefing.metricas?.leads_activos} />
            <MetricCard label="Viajes en Tránsito" value={briefing.metricas?.viajes_en_transito} />
            <MetricCard label="Utilización Flota" value={briefing.metricas?.utilizacion_flota_pct} format="percentage" />
            <MetricCard label="Cartera Vencida" value={briefing.metricas?.cartera_vencida} format="currency" />
            <MetricCard label="Incidencias Abiertas" value={briefing.metricas?.incidencias_abiertas} />
            <MetricCard label="Mensajes WhatsApp" value={briefing.metricas?.whatsapp_mensajes} />
          </div>
        </div>

        {briefing.resumen_ejecutivo && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.50)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resumen Ejecutivo
            </div>
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(54,54,67,1) 0%, rgba(42,42,54,1) 50%, rgba(33,33,43,1) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(155,168,195,0.18)',
                borderLeftWidth: '4px',
                borderLeftColor: 'rgba(59, 130, 246, 0.6)',
                boxShadow: '0 10px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.28)',
                padding: '32px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  color: 'rgba(15, 23, 42, 0.75)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {briefing.resumen_ejecutivo}
              </div>
            </div>
          </div>
        )}

        {sortedPendientes && sortedPendientes.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(15, 23, 42, 0.50)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pendientes Accionables
            </div>
            <div>
              {sortedPendientes.map((pendiente, index) => (
                <PendienteCard key={index} pendiente={pendiente} index={index} />
              ))}
            </div>
          </div>
        )}

        {briefing.timeline && briefing.timeline.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <TimelineSection timeline={briefing.timeline} />
          </div>
        )}

        {briefing.tipo === 'evening' && briefing.cierre_dia && (
          <div style={{ marginBottom: '24px' }}>
            <CierreDiaSection cierreDia={briefing.cierre_dia} />
          </div>
        )}

        <div style={{ paddingBottom: '40px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(15, 23, 42, 0.35)',
            }}
          >
            AI Chief of Staff • LomaHUB27 • TROB
          </div>
        </div>
      </div>
    </div>
    </ModuleLayout>
  );
};

export default BriefingChiefOfStaff;
