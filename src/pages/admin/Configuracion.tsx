import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../lib/tokens';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Users, BookOpen, SlidersHorizontal, Plug, ShieldCheck } from 'lucide-react';

/* ───────── types ───────── */
interface ConfigCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  route: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

/* ───────── component ───────── */
export default function Configuracion() {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const cards: ConfigCard[] = [
    {
      id: 'usuarios',
      title: 'Usuarios',
      subtitle: 'Gestión de usuarios autorizados, roles y permisos del sistema',
      icon: Users,
      route: '/admin/configuracion/usuarios',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      iconBg: 'rgba(59, 130, 246, 0.10)',
      iconColor: '#3B82F6',
    },
    {
      id: 'catalogos',
      title: 'Catálogos',
      subtitle: 'Administración de catálogos del sistema: tipos, estados y clasificaciones',
      icon: BookOpen,
      route: '/admin/configuracion/catalogos',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      iconBg: 'rgba(16, 185, 129, 0.10)',
      iconColor: '#10B981',
    },
    {
      id: 'parametros',
      title: 'Parámetros',
      subtitle: 'Tarifas por km/milla, costos de cruce, accesoriales y configuración de cotización',
      icon: SlidersHorizontal,
      route: '/admin/configuracion/parametros',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      iconBg: 'rgba(245, 158, 11, 0.10)',
      iconColor: '#F59E0B',
    },
    {
      id: 'integraciones',
      title: 'Integraciones',
      subtitle: 'Conexiones con ANODOS, GPS WideTech, WhatsApp y servicios externos',
      icon: Plug,
      route: '/admin/configuracion/integraciones',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      iconBg: 'rgba(139, 92, 246, 0.10)',
      iconColor: '#8B5CF6',
    },
    {
      id: 'auditoria',
      title: 'Auditoría',
      subtitle: 'Registro de actividad del sistema, cambios y trazabilidad de acciones',
      icon: ShieldCheck,
      route: '/admin/configuracion/auditoria',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      iconBg: 'rgba(239, 68, 68, 0.10)',
      iconColor: '#EF4444',
    },
  ];

  /* ───────── styles ───────── */
  const S = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '28px',
      padding: '40px 48px',
      maxWidth: '1200px',
      margin: '0 auto',
    } as React.CSSProperties,
    card: {
      background: tokens.colors.bgCard,
      borderRadius: '20px',
      border: tokens.glassmorphism.border,
      boxShadow: tokens.colors.cardShadow,
      cursor: 'pointer',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
    } as React.CSSProperties,
    cardHover: {
      boxShadow: tokens.colors.cardHover,
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
      lineHeight: 1.6,
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

  return (
    <ModuleLayout titulo="Configuración" moduloPadre={{ nombre: 'Dashboard', ruta: '/dashboard' }}>
      <div style={{ minHeight: '100vh', background: tokens.colors.bgMain }}>
        <h1 style={S.pageTitle}>Configuración</h1>
        <p style={S.pageSubtitle}>Administración del sistema, usuarios, catálogos y parámetros</p>

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
                    <Icon size={26} color={card.iconColor} />
                  </div>
                  <div>
                    <h3 style={S.title}>{card.title}</h3>
                    <p style={S.subtitle}>{card.subtitle}</p>
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
