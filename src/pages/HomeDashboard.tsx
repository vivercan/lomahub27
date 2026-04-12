/* ===== HomeDashboard V27h — Custom SVG icons 18% opacity ===== */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── tipos ─────────────────────────────────────────────── */
interface CardConfig {
  key: string;
  title: string;
  gradient: string;
  dotColor: string;
  iconFile: string;
  getValue: (d: DashboardData) => string;
  route: string;
}

interface DashboardData {
  oportunidades: number;
  clientes: number;
  solicitudes: number;
  despachos: number;
  ventasMes: number;
  cotizaciones: number;
  plantillas: number;
  mensajes: number;
}

/* ── datos mock mientras conectamos Supabase ───────────── */
const EMPTY: DashboardData = {
  oportunidades: 0, clientes: 0, solicitudes: 0, despachos: 0,
  ventasMes: 0, cotizaciones: 0, plantillas: 0, mensajes: 0,
};

/* ── tarjetas (7 chicas + 2 anchas) ───────────────────── */
const CARDS: CardConfig[] = [
  { key:'oportunidades', title:'Oportunidades',          gradient:'linear-gradient(135deg,#1e3a5f,#4a90d9)', dotColor:'#4a90d9', iconFile:'oportunidades.svg',        getValue:d=>`${d.oportunidades}`, route:'/oportunidades' },
  { key:'comercial',     title:'Actividad Comercial',    gradient:'linear-gradient(135deg,#1a3a2a,#2ecc71)', dotColor:'#2ecc71', iconFile:'comercial.svg',             getValue:d=>`${d.clientes}`,      route:'/clientes' },
  { key:'servicio',      title:'Servicio al Cliente',    gradient:'linear-gradient(135deg,#4a1a6b,#9b59b6)', dotColor:'#9b59b6', iconFile:'servicio-al-cliente.svg',   getValue:d=>`${d.solicitudes}`,   route:'/servicio' },
  { key:'despacho',      title:'Despacho Inteligente',   gradient:'linear-gradient(135deg,#1a3a4a,#1abc9c)', dotColor:'#1abc9c', iconFile:'Despacho inteligente.svg',  getValue:d=>`${d.despachos}`,     route:'/despacho' },
  { key:'ventas',        title:'Ventas del Mes',         gradient:'linear-gradient(135deg,#3a1a1a,#e74c3c)', dotColor:'#e74c3c', iconFile:'Ventas.svg',                getValue:d=>`$${d.ventasMes.toLocaleString()}`, route:'/ventas' },
  { key:'cotizaciones',  title:'Cotizaciones',           gradient:'linear-gradient(135deg,#3a2a1a,#e67e22)', dotColor:'#e67e22', iconFile:'cotizacionea.svg',           getValue:d=>`${d.cotizaciones}`,  route:'/cotizaciones' },
  { key:'plantillas',    title:'Plantillas',             gradient:'linear-gradient(135deg,#1a2a3a,#3498db)', dotColor:'#3498db', iconFile:'plantillas.svg',             getValue:d=>`${d.plantillas}`,    route:'/plantillas' },
  { key:'comunicaciones',title:'Centro de Comunicaciones',gradient:'linear-gradient(135deg,#2a1a3a,#8e44ad)', dotColor:'#8e44ad', iconFile:'comunicaciones.svg',         getValue:d=>`${d.mensajes}`,      route:'/comunicaciones' },
  { key:'configuracion', title:'Configuración',          gradient:'linear-gradient(135deg,#1a1a2a,#5dade2)', dotColor:'#5dade2', iconFile:'configuracion.svg',          getValue:d=>'',                   route:'/configuracion' },
];

/* ── componente Card ──────────────────────────────────── */
function DashCard({ card, data }: { card: CardConfig; data: DashboardData }) {
  const [isHovered, setIsHovered] = useState(false);
  const isWide = card.key === 'comunicaciones' || card.key === 'configuracion';

  const cardStyle: React.CSSProperties = {
    background: card.gradient,
    borderRadius: 18,
    padding: '28px 26px 22px',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease',
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: isHovered
      ? '0 12px 32px rgba(0,0,0,0.35)'
      : '0 4px 16px rgba(0,0,0,0.2)',
    gridColumn: isWide ? 'span 2' : 'span 1',
    minHeight: 170,
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* dot */}
      <div style={{
        position:'absolute', top:18, right:18,
        width:10, height:10, borderRadius:'50%',
        background:card.dotColor,
        boxShadow:`0 0 6px ${card.dotColor}`,
      }} />

      {/* icon bg */}
      <img
        src={`/icons/dashboard/${card.iconFile}`}
        alt=""
        style={{
          position:'absolute', right:'-8%', bottom:'-10%',
          width:'75%', height:'75%', objectFit:'contain',
          pointerEvents:'none', opacity:0.18,
          transition:'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
          transform: isHovered ? 'translate(4px,-4px) scale(1.05)' : 'translate(0,0) scale(1)',
        }}
      />

      {/* text */}
      <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:0, fontWeight:500, letterSpacing:0.5 }}>
        {card.title}
      </p>
      <p style={{ color:'#fff', fontSize:36, fontWeight:700, margin:'10px 0 0' }}>
        {card.getValue(data)}
      </p>
    </div>
  );
}

/* ── página ────────────────────────────────────────────── */
export default function HomeDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>(EMPTY);

  return (
    <div style={{ minHeight:'100vh', background:'#0b1120', padding:'40px 5%' }}>
      {/* header */}
      <h1 style={{ color:'#fff', fontSize:28, fontWeight:700, marginBottom:8 }}>
        Dashboard LomaHUB27
      </h1>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:36 }}>
        Vista general del sistema
      </p>

      {/* grid 4 col */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(4, 1fr)',
        gap:22,
        maxWidth:1280,
      }}>
        {CARDS.map(c => (
          <div key={c.key} onClick={() => navigate(c.route)}
               style={{ gridColumn: (c.key==='comunicaciones'||c.key==='configuracion') ? 'span 2' : 'span 1' }}>
            <DashCard card={c} data={data} />
          </div>
        ))}
      </div>
    </div>
  );
}

