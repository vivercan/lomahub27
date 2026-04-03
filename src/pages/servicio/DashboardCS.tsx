import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { tokens } from '../../lib/tokens';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Ticket, Users, Ship, Truck } from 'lucide-react';

/* ───────── types ───────── */
interface CardDef {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  route: string;
  kpiLabel: string;
  kpiValue: number | null;
  gradient: string;
  iconBg: string;
}

/* ───────── component ───────── */
export default function DashboardCS() {
  const navigate = useNavigate();
  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [clientesCount, setClientesCount] = useState<number | null>(null);
  const [impoCount, setImpoCount] = useState<number | null>(null);
  const [expoCount, setExpoCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        /* tickets — viajes activos con incidencia */
        const { count: tix } = await supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null);
        setTicketCount(tix ?? 0);

        /* clientes activos */
        const { count: cli } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('tipo', 'activo')
          .is('deleted_at', null);
        setClientesCount(cli ?? 0);

        /* viajes IMPO */
        const { count: imp } = await supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })
          .eq('tipo', 'IMPO')
          .is('deleted_at', null);
        setImpoCount(imp ?? 0);

        /* viajes EXPO */
        const { count: exp } = await supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true })
          .eq('tipo', 'EXPO')
          .is('deleted_at', null);
        setExpoCount(exp ?? 0);
      } catch (err) {
        console.error('KPI fetch error:', err);
      }
    };
    fetchKpis();
  }, []);

  const cards: CardDef[] = [
    {
      id: 'tickets',
      title: 'Tickets',
      subtitle: 'Seguimiento de incidencias y solicitudes',
      icon: Ticket,
      route: '/servicio/tickets',
      kpiLabel: 'Activos',
      kpiValue: ticketCount,
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      iconBg: 'rgba(59, 130, 246, 0.10)',
    },
    {
      id: 'clientes-activos',
      title: 'Clientes Activos',
      subtitle: 'Gestión de cuentas activas',
      icon: Users,
      route: '/clientes/ficha',
      kpiLabel: 'Clientes',
      kpiValue: clientesCount,
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      iconBg: 'rgba(16, 185, 129, 0.10)',
    },
    {
      id: 'importacion',
      title: 'Importación',
      subtitle: 'Operaciones de servicio IMPO',
      icon: Ship,
      route: '/servicio/importacion',
      kpiLabel: 'Viajes IMPO',
      kpiValue: impoCount,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      iconBg: 'rgba(139, 92, 246, 0.10)',
    },
    {
      id: 'exportacion',
      title: 'Exportación',
      subtitle: 'Operaciones de servicio EXPO',
      icon: Truck,
      route: '/servicio/exportacion',
      kpiLabel: 'Viajes EXPO',
      kpiValue: expoCount,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      iconBg: 'rgba(245, 158, 11, 0.10)',
    },
  ];

  /* ───────── styles ───────── */
  const S = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '28px',
      padding: '40px 48px',
      maxWidth: '1400px',
      margin: '0 auto',
    } as React.CSSProperties,
    card: {
      background: tokens.colors.bgCard,
      borderRadius: '20px',
      border: tokens.effects.glassmorphism.border,
      boxShadow: tokens.effects.cardShadow,
      cursor: 'pointer',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      position: 'relative' as const,
    } as React.CSSProperties,
    cardHover: {
      boxShadow: tokens.effects.cardHover,
      transform: 'translateY(-4px)',
    },
    topBar: (gradient: string) => ({
      height: '6px',
      background: gradient,
      width: '100%',
    }),
    body: {
      padding: '28px 24px 24px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      flex: 1,
    } as React.CSSProperties,
    iconWrap: (bg: string) => ({
      width: '52px',
      height: '52px',
      borderRadius: '14px',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    title: {
      fontFamily: tokens.fonts.heading,
      fontSize: '18px',
      fontWeight: 700,
      color: tokens.colors.textPrimary,
      margin: 0,
      letterSpacing: '-0.01em',
    } as React.CSSProperties,
    subtitle: {
      fontFamily: tokens.fonts.body,
      fontSize: '13px',
      color: tokens.colors.textSecondary,
      margin: 0,
      lineHeight: 1.5,
    } as React.CSSProperties,
    kpiRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      marginTop: 'auto',
      paddingTop: '12px',
      borderTop: `1px solid ${tokens.colors.border}`,
    } as React.CSSProperties,
    kpiValue: {
      fontFamily: tokens.fonts.heading,
      fontSize: '32px',
      fontWeight: 700,
      color: tokens.colors.textPrimary,
      lineHeight: 1,
    } as React.CSSProperties,
    kpiLabel: {
      fontFamily: tokens.fonts.body,
      fontSize: '13px',
      color: tokens.colors.textMuted,
    } as React.CSSProperties,
    pageTitle: {
      fontFamily: tokens.fonts.heading,
      fontSize: '26px',
      fontWeight: 700,
      color: tokens.colors.textPrimary,
      margin: 0,
      padding: '32px 48px 0',
    } as React.CSSProperties,
    pageSubtitle: {
      fontFamily: tokens.fonts.body,
      fontSize: '14px',
      color: tokens.colors.textSecondary,
      margin: 0,
      padding: '6px 48px 0',
    } as React.CSSProperties,
  };

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <ModuleLayout titulo="Servicio a Clientes" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <div style={{ minHeight: '100vh', background: tokens.colors.bgMain }}>
        <h1 style={S.pageTitle}>Servicio a Clientes</h1>
        <p style={S.pageSubtitle}>Gestión integral de servicio, tickets e incidencias</p>

        <div style={S.grid}>
          {cards.map((card) => {
            const Icon = card.icon;
            const isHover = hoveredId === card.id;
            return (
              <div
                key={card.id}
                style={{
                  ...S.card,
                  ...(isHover ? S.cardHover : {}),
                }}
                onMouseEnter={() => setHoveredId(card.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => navigate(card.route)}
              >
                <div style={S.topBar(card.gradient)} />
                <div style={S.body}>
                  <div style={S.iconWrap(card.iconBg)}>
                    <Icon size={26} color={card.gradient.includes('#3B82F6') ? '#3B82F6' : card.gradient.includes('#10B981') ? '#10B981' : card.gradient.includes('#8B5CF6') ? '#8B5CF6' : '#F59E0B'} />
                  </div>
                  <div>
                    <h3 style={S.title}>{card.title}</h3>
                    <p style={S.subtitle}>{card.subtitle}</p>
                  </div>
                  <div style={S.kpiRow}>
                    <span style={S.kpiValue}>
                      {card.kpiValue !== null ? card.kpiValue.toLocaleString() : '—'}
                    </span>
                    <span style={S.kpiLabel}>{card.kpiLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModuleLayout>
  );
}
