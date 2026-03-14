import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import WarRoom from './pages/WarRoom'
import Inteligencia from './pages/Inteligencia'

// Ventas
import DashboardVentas from './pages/ventas/DashboardVentas'
import MisLeads from './pages/ventas/MisLeads'
import NuevoLead from './pages/ventas/NuevoLead'
import FichaLead from './pages/ventas/FichaLead'

// Cotizador
import NuevaCotizacion from './pages/cotizador/NuevaCotizacion'

// Clientes
import AltaCliente from './pages/clientes/AltaCliente'
import FichaCliente from './pages/clientes/FichaCliente'

// Operaciones
import Despachos from './pages/operaciones/Despachos'
import TorreControl from './pages/operaciones/TorreControl'
import MapaGPS from './pages/operaciones/MapaGPS'
import Dedicados from './pages/operaciones/Dedicados'
import TrazabilidadViaje from './pages/operaciones/TrazabilidadViaje'
import ControlCajas from './pages/operaciones/ControlCajas'
import ControlTractos from './pages/operaciones/ControlTractos'
import Disponibilidad from './pages/operaciones/Disponibilidad'
import OfertaEquipo from './pages/operaciones/OfertaEquipo'

// Servicio
import DashboardCS from './pages/servicio/DashboardCS'
import WhatsAppBandeja from './pages/servicio/WhatsApp'
import MetricasServicio from './pages/servicio/MetricasServicio'

// CXC
import Cartera from './pages/cxc/Cartera'

// Admin
import Configuracion from './pages/admin/Configuracion'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ─── Public ─── */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ─── 02. War Room ─── */}
          <Route path="/war-room" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'direccion']}>
              <WarRoom />
            </ProtectedRoute>
          } />

          {/* ─── 03. Dashboard Gerente Comercial ─── */}
          <Route path="/ventas/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'gerente_comercial']}>
              <DashboardVentas />
            </ProtectedRoute>
          } />

          {/* ─── 04. Panel Personal Vendedor ─── */}
          <Route path="/ventas/mis-leads" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'gerente_comercial', 'ventas']}>
              <MisLeads />
            </ProtectedRoute>
          } />

          {/* ─── 05. Captura de Lead ─── */}
          <Route path="/ventas/leads/nuevo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'gerente_comercial', 'ventas']}>
              <NuevoLead />
            </ProtectedRoute>
          } />

          {/* ─── 06. Ficha del Lead ─── */}
          <Route path="/ventas/leads/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'gerente_comercial', 'ventas']}>
              <FichaLead />
            </ProtectedRoute>
          } />

          {/* ─── 07. Cotizador ─── */}
          <Route path="/cotizador/nueva" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas', 'gerente_comercial', 'pricing']}>
              <NuevaCotizacion />
            </ProtectedRoute>
          } />
          <Route path="/cotizador/tarifas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'pricing']}>
              <NuevaCotizacion />
            </ProtectedRoute>
          } />

          {/* ─── 08. Alta de Cliente ─── */}
          <Route path="/clientes/alta" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas', 'gerente_comercial', 'cs', 'supervisor_cs', 'cxc', 'pricing']}>
              <AltaCliente />
            </ProtectedRoute>
          } />

          {/* ─── 09. Ficha 360° ─── */}
          <Route path="/clientes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas', 'gerente_comercial', 'cs', 'supervisor_cs', 'cxc', 'direccion', 'operaciones', 'gerente_ops']}>
              <FichaCliente />
            </ProtectedRoute>
          } />

          {/* ─── 10. Dashboard CS ─── */}
          <Route path="/servicio/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <DashboardCS />
            </ProtectedRoute>
          } />

          {/* ─── 11. Despachos ─── */}
          <Route path="/operaciones/despachos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <Despachos />
            </ProtectedRoute>
          } />

          {/* ─── 12. Torre de Control ─── */}
          <Route path="/operaciones/torre-control" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion']}>
              <TorreControl />
            </ProtectedRoute>
          } />

          {/* ─── 13. Mapa GPS ─── */}
          <Route path="/operaciones/mapa" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion']}>
              <MapaGPS />
            </ProtectedRoute>
          } />

          {/* ─── 14. Monitor Dedicados ─── */}
          <Route path="/operaciones/dedicados" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'operaciones', 'gerente_ops']}>
              <Dedicados />
            </ProtectedRoute>
          } />

          {/* ─── 15. Trazabilidad ─── */}
          <Route path="/operaciones/viajes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs', 'operaciones', 'gerente_ops']}>
              <TrazabilidadViaje />
            </ProtectedRoute>
          } />

          {/* ─── 16. Control de Cajas ─── */}
          <Route path="/operaciones/cajas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'operaciones']}>
              <ControlCajas />
            </ProtectedRoute>
          } />

          {/* ─── 17. Control de Tractos ─── */}
          <Route path="/operaciones/tractos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'operaciones', 'gerente_ops']}>
              <ControlTractos />
            </ProtectedRoute>
          } />

          {/* ─── 18. Disponibilidad ─── */}
          <Route path="/operaciones/disponibilidad" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'gerente_ops', 'direccion']}>
              <Disponibilidad />
            </ProtectedRoute>
          } />

          {/* ─── 19. Oferta de Equipo ─── */}
          <Route path="/operaciones/oferta-equipo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs']}>
              <OfertaEquipo />
            </ProtectedRoute>
          } />

          {/* ─── 20. WhatsApp ─── */}
          <Route path="/servicio/whatsapp" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <WhatsAppBandeja />
            </ProtectedRoute>
          } />

          {/* ─── 21. Métricas Servicio ─── */}
          <Route path="/servicio/metricas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'supervisor_cs', 'direccion']}>
              <MetricasServicio />
            </ProtectedRoute>
          } />

          {/* ─── 22. Inteligencia ─── */}
          <Route path="/inteligencia" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <Inteligencia />
            </ProtectedRoute>
          } />

          {/* ─── 23. CXC ─── */}
          <Route path="/cxc/cartera" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cxc', 'direccion']}>
              <Cartera />
            </ProtectedRoute>
          } />

          {/* ─── 24. Configuración ─── */}
          <Route path="/admin/configuracion" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <Configuracion />
            </ProtectedRoute>
          } />

          {/* ─── Legacy dashboard redirect ─── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <WarRoom />
            </ProtectedRoute>
          } />

          {/* ─── Default ─── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
