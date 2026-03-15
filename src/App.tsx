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
import ProgramaSemanal from './pages/ventas/ProgramaSemanal'
import Comisiones from './pages/ventas/Comisiones'

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
import Rentabilidad from './pages/operaciones/Rentabilidad'

// Servicio
import DashboardCS from './pages/servicio/DashboardCS'
import WhatsAppBandeja from './pages/servicio/WhatsApp'
import MetricasServicio from './pages/servicio/MetricasServicio'

// CXC
import Cartera from './pages/cxc/Cartera'

// Inteligencia
import PresupuestoMensual from './pages/inteligencia/PresupuestoMensual'

// Admin
import Configuracion from './pages/admin/Configuracion'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* âââ Public âââ */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* âââ 02. War Room âââ */}
          <Route path="/war-room" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'direccion']}>
              <WarRoom />
            </ProtectedRoute>
          } />

          {/* âââ 03. Dashboard Ventas âââ */}
          <Route path="/ventas/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <DashboardVentas />
            </ProtectedRoute>
          } />

          {/* âââ 04. Panel Personal Vendedor âââ */}
          <Route path="/ventas/mis-leads" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <MisLeads />
            </ProtectedRoute>
          } />

          {/* âââ 05. Captura de Lead âââ */}
          <Route path="/ventas/leads/nuevo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <NuevoLead />
            </ProtectedRoute>
          } />

          {/* âââ 06. Ficha del Lead âââ */}
          <Route path="/ventas/leads/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <FichaLead />
            </ProtectedRoute>
          } />

          {/* âââ 26. Programa Semanal âââ */}
          <Route path="/ventas/programa-semanal" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'direccion']}>
              <ProgramaSemanal />
            </ProtectedRoute>
          } />

          {/* âââ 07. Cotizador âââ */}
          <Route path="/cotizador/nueva" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'pricing']}>
              <NuevaCotizacion />
            </ProtectedRoute>
          } />
          <Route path="/cotizador/tarifas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'pricing']}>
              <NuevaCotizacion />
            </ProtectedRoute>
          } />

          {/* âââ 08. Alta de Cliente âââ */}
          <Route path="/clientes/alta" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc', 'pricing']}>
              <AltaCliente />
            </ProtectedRoute>
          } />

          {/* âââ 09. Ficha 360Â° âââ */}
          <Route path="/clientes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc', 'direccion', 'operaciones', 'gerente_ops']}>
              <FichaCliente />
            </ProtectedRoute>
          } />

          {/* âââ 10. Dashboard CS â cs sÃ­, ventas NO âââ */}
          <Route path="/servicio/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <DashboardCS />
            </ProtectedRoute>
          } />

          {/* âââ 11. Despachos âââ */}
          <Route path="/operaciones/despachos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs']}>
              <Despachos />
            </ProtectedRoute>
          } />

          {/* âââ 12. Torre de Control âââ */}
          <Route path="/operaciones/torre-control" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion']}>
              <TorreControl />
            </ProtectedRoute>
          } />

          {/* âââ 13. Mapa GPS âââ */}
          <Route path="/operaciones/mapa" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion']}>
              <MapaGPS />
            </ProtectedRoute>
          } />

          {/* âââ 14. Monitor Dedicados â operaciones accede aquÃ­ âââ */}
          <Route path="/operaciones/dedicados" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops']}>
              <Dedicados />
            </ProtectedRoute>
          } />

          {/* âââ 15. Trazabilidad âââ */}
          <Route path="/operaciones/viajes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops']}>
              <TrazabilidadViaje />
            </ProtectedRoute>
          } />

          {/* âââ 16. Control de Cajas âââ */}
          <Route path="/operaciones/cajas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <ControlCajas />
            </ProtectedRoute>
          } />

          {/* âââ 17. Control de Tractos âââ */}
          <Route path="/operaciones/tractos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops']}>
              <ControlTractos />
            </ProtectedRoute>
          } />

          {/* âââ 18. Disponibilidad âââ */}
          <Route path="/operaciones/disponibilidad" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_ops', 'direccion']}>
              <Disponibilidad />
            </ProtectedRoute>
          } />

          {/* âââ 19. Oferta de Equipo âââ */}
          <Route path="/operaciones/oferta-equipo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <OfertaEquipo />
            </ProtectedRoute>
          } />

          {/* âââ 25. Rentabilidad por Tracto âââ */}
          <Route path="/operaciones/rentabilidad" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops', 'direccion']}>
              <Rentabilidad />
            </ProtectedRoute>
          } />

          {/* âââ 20. WhatsApp â cs sÃ­, ventas NO âââ */}
          <Route path="/servicio/whatsapp" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <WhatsAppBandeja />
            </ProtectedRoute>
          } />

          {/* âââ 21. MÃ©tricas Servicio â cs sÃ­, ventas NO âââ */}
          <Route path="/servicio/metricas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs', 'direccion']}>
              <MetricasServicio />
            </ProtectedRoute>
          } />

          {/* âââ 22. Inteligencia / Rankings âââ */}
          <Route path="/inteligencia" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <Inteligencia />
            </ProtectedRoute>
          } />

          {/* âââ 28. Comisiones por Ejecutivo âââ */}
          <Route path="/ventas/comisiones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'gerente_comercial', 'direccion']}>
              <Comisiones />
            </ProtectedRoute>
          } />

          {/* âââ 27. Presupuesto Mensual âââ */}
          <Route path="/inteligencia/presupuesto" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <PresupuestoMensual />
            </ProtectedRoute>
          } />

          {/* âââ 23. CXC âââ */}
          <Route path="/cxc/cartera" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'cxc', 'direccion']}>
              <Cartera />
            </ProtectedRoute>
          } />

          {/* âââ 24. ConfiguraciÃ³n â SOLO superadmin y admin âââ */}
          <Route path="/admin/configuracion" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <Configuracion />
            </ProtectedRoute>
          } />

          {/* âââ Legacy dashboard redirect âââ */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <WarRoom />
            </ProtectedRoute>
          } />

          {/* âââ Default âââ */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
