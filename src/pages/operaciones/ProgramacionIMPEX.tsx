import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import {
  Calendar,
  Truck,
  MapPin,
  Ship,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Viaje {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  cliente: string;
  tipo: 'importacion' | 'exportacion';
  estado: 'programado' | 'en_transito' | 'completado' | 'cancelado';
  tracto: string;
  operador: string;
}

export default function ProgramacionIMPEX() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    programados: 0,
    enTransito: 0,
    completados: 0,
    proximos7Dias: 0,
  });

  // Fetch data from Supabase
  useEffect(() => {
    const fetchViajes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('viajes_impex')
          .select('*')
          .order('fecha', { ascending: true });

        if (error) {
          console.error('Error fetching viajes:', error);
          setViajes([]);
        } else {
          setViajes(data || []);
          calculateKPIs(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setViajes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchViajes();
  }, []);

  // Calculate KPI values
  const calculateKPIs = (allViajes: Viaje[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const next7DaysDate = new Date(now);
    next7DaysDate.setDate(next7DaysDate.getDate() + 7);

    const thisMonth = allViajes.filter((v) => {
      const vDate = new Date(v.fecha);
      return (
        vDate.getMonth() === currentMonth && vDate.getFullYear() === currentYear
      );
    });

    const programados = thisMonth.filter(
      (v) => v.estado === 'programado'
    ).length;
    const completados = thisMonth.filter(
      (v) => v.estado === 'completado'
    ).length;
    const enTransito = allViajes.filter(
      (v) => v.estado === 'en_transito'
    ).length;
    const proximos = allViajes.filter((v) => {
      const vDate = new Date(v.fecha);
      return vDate <= next7DaysDate && vDate >= now;
    }).length;

    setKpis({
      programados,
      enTransito,
      completados,
      proximos7Dias: proximos,
    });
  };

  // Get the week start and end dates
  const getWeekDates = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay() || 7;
    const diff = d.getDate() - day + 1;
    const weekStart = new Date(d.setDate(diff));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return { weekStart, weekEnd };
  };

  const { weekStart, weekEnd } = getWeekDates(currentDate);

  // Get viajes for the current week
  const viajesThisWeek = viajes.filter((v) => {
    const vDate = new Date(v.fecha);
    return vDate >= weekStart && vDate <= weekEnd;
  });

  // Get viajes by day
  const getViajesByDay = (dayDate: Date) => {
    return viajesThisWeek.filter((v) => {
      const vDate = new Date(v.fecha);
      return vDate.toDateString() === dayDate.toDateString();
    });
  };

  // Get status badge color
  const getStatusColor = (
    estado: 'programado' | 'en_transito' | 'completado' | 'cancelado'
  ): 'primary' | 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange' => {
    switch (estado) {
      case 'completado':
        return 'green';
      case 'en_transito':
        return 'yellow';
      case 'programado':
        return 'blue';
      case 'cancelado':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Get type badge color
  const getTypeColor = (
    tipo: 'importacion' | 'exportacion'
  ): 'primary' | 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange' => {
    return tipo === 'importacion' ? 'primary' : 'orange';
  };

  // Get day cell background based on trips
  const getDayStatusColor = (dayViajes: Viaje[]) => {
    if (dayViajes.length === 0) return tokens.colors.bgCard;
    const hasCompleted = dayViajes.some((v) => v.estado === 'completado');
    const hasInTransit = dayViajes.some((v) => v.estado === 'en_transito');
    const hasDelayed = dayViajes.some((v) => v.estado === 'cancelado');

    if (hasDelayed) return tokens.colors.red;
    if (hasInTransit) return tokens.colors.yellow;
    if (hasCompleted) return tokens.colors.green;
    return tokens.colors.blue;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatWeekRange = () => {
    const start = weekStart.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
    const end = weekEnd.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `Semana del ${start} al ${end}`;
  };

  // Day names
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Generate day cells for the week
  const getDaysCells = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      days.push(dayDate);
    }
    return days;
  };

  const columnDefs: Column[] = [
    { key: 'fecha', label: 'Fecha', width: '12%' },
    { key: 'origen', label: 'Origen', width: '14%' },
    { key: 'destino', label: 'Destino', width: '14%' },
    { key: 'cliente', label: 'Cliente', width: '16%' },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '12%',
      render: (row: Viaje) => (
        <Badge color={getTypeColor(row.tipo)}>
          {row.tipo === 'importacion' ? 'Importación' : 'Exportación'}
        </Badge>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      width: '14%',
      render: (row: Viaje) => (
        <Badge color={getStatusColor(row.estado)}>
          {row.estado.charAt(0).toUpperCase() +
            row.estado.slice(1).replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'tracto', label: 'Tracto', width: '10%' },
    { key: 'operador', label: 'Operador', width: '12%' },
  ];

  return (
    <ModuleLayout titulo="Programación IMPEX" moduloPadre={{ nombre: 'Operaciones', ruta: '/operaciones/dashboard' }}>
      <div style={{ padding: tokens.spacing.lg }}>
        {/* KPI Cards Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: tokens.spacing.md,
            marginBottom: tokens.spacing.lg,
          }}
        >
          <KPICard
            titulo="Viajes Programados"
            valor={kpis.programados}
            icono={<Truck size={20} />}
            color="blue"
          />
          <KPICard
            titulo="En Tránsito"
            valor={kpis.enTransito}
            icono={<Ship size={20} />}
            color="yellow"
          />
          <KPICard
            titulo="Completados"
            valor={kpis.completados}
            icono={<MapPin size={20} />}
            color="green"
          />
          <KPICard
            titulo="Próximos 7 Días"
            valor={kpis.proximos7Dias}
            icono={<Calendar size={20} />}
            color="primary"
          />
        </div>

        {/* Week Navigation */}
        <Card
          style={{
            marginBottom: tokens.spacing.lg,
            padding: tokens.spacing.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            onClick={() => {
              const prevWeek = new Date(currentDate);
              prevWeek.setDate(prevWeek.getDate() - 7);
              setCurrentDate(prevWeek);
            }}
            variant="secondary"
            style={{
              padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing.xs,
            }}
          >
            <ChevronLeft size={18} />
          </Button>

          <span
            style={{
              fontSize: '16px',
              fontFamily: tokens.fonts.heading,
              fontWeight: 600,
              color: tokens.colors.textPrimary,
              flex: 1,
              textAlign: 'center',
            }}
          >
            {formatWeekRange()}
          </span>

          <Button
            onClick={() => {
              const nextWeek = new Date(currentDate);
              nextWeek.setDate(nextWeek.getDate() + 7);
              setCurrentDate(nextWeek);
            }}
            variant="secondary"
            style={{
              padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing.xs,
            }}
          >
            <ChevronRight size={18} />
          </Button>
        </Card>

        {/* Weekly Calendar Grid */}
        <Card style={{ marginBottom: tokens.spacing.lg, padding: tokens.spacing.md }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: tokens.spacing.sm,
            }}
          >
            {dayNames.map((dayName, idx) => {
              const dayDate = getDaysCells()[idx];
              const dayViajes = getViajesByDay(dayDate);
              const statusColor = getDayStatusColor(dayViajes);
              const isToday =
                dayDate.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: isToday
                      ? `2px solid ${tokens.colors.primary}`
                      : `1px solid ${tokens.colors.border}`,
                    borderRadius: tokens.radius.xl,
                    padding: tokens.spacing.sm,
                    backgroundColor: isToday
                      ? `${tokens.colors.primary}15`
                      : tokens.colors.bgCard,
                    minHeight: '120px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontFamily: tokens.fonts.heading,
                      fontWeight: 600,
                      color: tokens.colors.textSecondary,
                      marginBottom: tokens.spacing.xs,
                    }}
                  >
                    {dayName}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontFamily: tokens.fonts.heading,
                      fontWeight: 500,
                      color: tokens.colors.textPrimary,
                      marginBottom: tokens.spacing.sm,
                    }}
                  >
                    {dayDate.getDate()}
                  </div>

                  {dayViajes.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: tokens.spacing.xs,
                        padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                        backgroundColor: statusColor,
                        borderRadius: '4px',
                        marginTop: 'auto',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: tokens.colors.textPrimary,
                        }}
                      >
                        {dayViajes.length}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: tokens.colors.textSecondary,
                        }}
                      >
                        {dayViajes.length === 1 ? 'viaje' : 'viajes'}
                      </span>
                    </div>
                  )}

                  {dayViajes.length === 0 && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: tokens.colors.textMuted,
                        marginTop: 'auto',
                      }}
                    >
                      Sin viajes
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Viajes Table */}
        <Card style={{ padding: tokens.spacing.md }}>
          <div
            style={{
              marginBottom: tokens.spacing.md,
              fontSize: '16px',
              fontFamily: tokens.fonts.heading,
              fontWeight: 600,
              color: tokens.colors.textPrimary,
            }}
          >
            Viajes de la Semana
          </div>
          {viajesThisWeek.length === 0 ? (
            <div
              style={{
                padding: tokens.spacing.lg,
                textAlign: 'center',
                color: tokens.colors.textMuted,
                fontSize: '14px',
              }}
            >
              No hay viajes programados para esta semana
            </div>
          ) : (
            <DataTable
              columns={columnDefs}
              data={viajesThisWeek}
              loading={loading}
            />
          )}
        </Card>
      </div>
    </ModuleLayout>
  );
}
