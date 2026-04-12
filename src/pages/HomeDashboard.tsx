/* ===== HomeDashboard V27g — Clean text-only cards ===== */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CardConfig {
  key: string;
  title: string;
  gradient: string;
  dotColor: string;
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

const EMPTY: DashboardData = {
  oportunidades: 0, clientes: 0, solicitudes: 0, despachos: 0,
  ventasMes: 0, cotizaciones: 0, plantillas: 0, mensajes: 0,
};

const CARDS: CardConfig[] = [
  { key:'oportunidades', title:'Oportunidades',          gradient:'linear-gradient(135deg,#1e3a5f,#4a90d9)', dotColor:'#4a90d9', getValue:d=>`${d.oportunidades}`, route:'/oportunidades' },
  { key:'comercial',     title:'Actividad Comercial',    gradient:'linear-gradient(135deg,#1a3a2a,#2ecc71)', dotColor:'#2ecc71', getValue:d=>`${d.clientes}`,      route:'/clientes' },
  { key:'servicio',      title:'Servicio al Cliente',    gradient:'linear-gradient(135deg,#4a1a6b,#9b59b6)', dotColor:'#9b59b6', getValue:d=>`${d.solicitudes}`,   route:'/servicio' },
  { key:'despacho',      title:'Despacho Inteligente',   gradient:'linear-gradient(135deg,#1a3a4a,#1abc9c)', dotColor:'#1abc9c', getValue:d=>`${d.despachos}`,     route:'/despacho' },
  { key:'ventas',        title:'Ventas del Mes',         gradient:'linear-gradient(135deg,#3a1a1a,#e74c3c)', dotColor:'#e74c3c', getValue:d=>`$${d.ventasMes.toLocaleString()}`, route:'/ventas' },
  { key:'cotizaciones',  title:'Cotizaciones',           gradient:'linear-gradient(135deg,#3a2a1a,#e67e22)', dotColor:'#e67e22', getValue:d=>`${d.cotizaciones}`,  route:'/cotizaciones' },
  { key:'plantillas',    title:'Plantillas',             gradient:'linear-gradient(135deg,#1a2a3a,#3498db)', dotColor:'#3498db', getValue:d=>`${d.plantillas}`,    route:'/plantillas' },
  { key:'comunicaciones',title:'Centro de Comunicaciones',gradient:'linear-gradient(135deg,#2a1a3a,#8e44ad)', dotColor:'#8e44ad', getValue:d=>`${d.mensajes}`,      route:'/comunicaciones' },
  { key:'configuracion', title:'Configuracion',          gradient:'linear-gradient(135deg,#1a1a2a,#5dade2)', dotColor:'#5dade2', getValue:d=>'',                   route:'/configuracion' },
];

function DashCard({ card, data }: { card: CardConfig; data: DashboardData }) {
  const [isHovered, setIsHovered] = useState(false);
  const isWide = card.key === 'comunicaciones' || card.key === 'configuracion';

  return (
    <div
      style={{
        background: card.gradient,
        borderRadius: 18,
        padding: '28px 26px 22px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 12px 32px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.2)',
        gridColumn: isWide ? 'span 2' : 'span 1',
        minHeight: 170,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        position:'absolute', top:18, right:18,
        width:10, height:10, borderRadius:'50%',
        background:card.dotColor,
        boxShadow:`0 0 6px ${card.dotColor}`,
      }} />
      <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:0, fontWeight:500, letterSpacing:0.5 }}>
        {card.title}
      </p>
      <p style={{ color:'#fff', fontSize:36, fontWeight:700, margin:'10px 0 0' }}>
        {card.getValue(data)}
      </p>
    </div>
  );
}

export default function HomeDashboard() {
  const navigate = useNavigate();
  const [data] = useState<DashboardData>(EMPTY);

  return (
    <div style={{ minHeight:'100vh', background:'#0b1120', padding:'40px 5%' }}>
      <h1 style={{ color:'#fff', fontSize:28, fontWeight:700, marginBottom:8 }}>
        Dashboard LomaHUB27
      </h1>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:36 }}>
        Vista general del sistema
      </p>
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
