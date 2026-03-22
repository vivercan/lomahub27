import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import HomeDashboard from './pages/HomeDashboard'

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
import RadiografiaFinanciera from './pages/clientes/RadiografiaFinanciera'

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
import Analisis8020 from './pages/inteligencia/Analisis8020'

// Admin
import Configuracion from './pages/admin/Configuracion'
import FunnelVentas from './pages/ventas/FunnelVentas'
import TicketsQuejas from './pages/servicio/TicketsQuejas'
import ProgramacionIMPEX from './pages/operaciones/ProgramacionIMPEX'

// Módulos V28 nuevos
import Actividades from './pages/actividades/Actividades'
import Documentos from './pages/documentos/Documentos'
import CerebroTarifario from './pages/pricing/CerebroTarifario'
import CorreosAutomaticos from './pages/comunicaciones/CorreosAutomaticos'
import Notificaciones from './pages/comunicaciones/Notificaciones'
import PanelIntegraciones from './pages/admin/PanelIntegraciones'
import ProgramacionDedicados from './pages/operaciones/ProgramacionDedicados'

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
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'direccion']}>
              <WarRoom />
            </ProtectedRoute>
          } />

          {/* ─── 03. Dashboard Ventas ─── */}
          <Route path="/ventas/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <DashboardVentas />
            </ProtectedRoute>
          } />

          {/* ─── 04. Panel Personal Vendedor ─── */}
          <Route path="/ventas/mis-leads" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <MisLeads />
            </ProtectedRoute>
          } />

          {/* ─── 05. Captura de Lead ─── */}
          <Route path="/ventas/leads/nuevo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <NuevoLead />
            </ProtectedRoute>
          } />

          {/* ─── 06. Ficha del Lead ─── */}
          <Route path="/ventas/leads/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <FichaLead />
            </ProtectedRoute>
          } />

          {/* ─── 26. Programa Semanal ─── */}
          <Route path="/ventas/programa-semanal" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'direccion']}>
              <ProgramaSemanal />
            </ProtectedRoute>
          } />

          {/* ─── 07. Cotizador ─── */}
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

          {/* ─── 08. Alta de Cliente ─── */}
          <Route path="/clientes/alta" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc', 'pricing']}>
              <AltaCliente />
            </ProtectedRoute>
          } />

          {/* ─── 30. Radiografía Financiera ─── */}
          <Route path="/clientes/:id/radiografia" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'cxc', 'direccion']}>
              <RadiografiaFinanciera />
            </ProtectedRoute>
          } />

          {/* ─── 09. Ficha 360° ─── */}
          <Route path="/clientes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc', 'direccion', 'operaciones', 'gerente_ops']}>
              <FichaCliente />
            </ProtectedRoute>
          } />

          {/* ─── 10. Dashboard CS — cs sí, ventas NO ─── */}
          <Route path="/servicio/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <DashboardCS />
            </ProtectedRoute>
          } />

          {/* ─── 11. Despachos ─── */}
          <Route path="/operaciones/despachos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs']}>
              <Despachos />
            </ProtectedRoute>
          } />

          {/* ─── 12. Torre de Control ─── */}
          <Route path="/operaciones/torre-control" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion']}>
              <TorreControl />
            </ProtectedRoute>
          } />

          {/* ─── 13. Mapa GPS ─── */}
          <Route path="/operaciones/mapa" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion']}>
              <MapaGPS />
            </ProtectedRoute>
          } />

          {/* ─── 14. Monitor Dedicados — operaciones accede aquí ─── */}
          <Route path="/operaciones/dedicados" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops']}>
              <Dedicados />
            </ProtectedRoute>
          } />

          {/* ─── 15. Trazabilidad ─── */}
          <Route path="/operaciones/viajes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops']}>
              <TrazabilidadViaje />
            </ProtectedRoute>
          } />

          {/* ─── 16. Control de Cajas ─── */}
          <Route path="/operaciones/cajas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <ControlCajas />
            </ProtectedRoute>
          } />

          {/* ─── 17. Control de Tractos ─── */}
          <Route path="/operaciones/tractos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops']}>
              <ControlTractos />
            </ProtectedRoute>
          } />

          {/* ─── 18. Disponibilidad ─── */}
          <Route path="/operaciones/disponibilidad" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_ops', 'direccion']}>
              <Disponibilidad />
            </ProtectedRoute>
          } />

          {/* ─── 19. Oferta de Equipo ─── */}
          <Route path="/operaciones/oferta-equipo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <OfertaEquipo />
            </ProtectedRoute>
          } />

          {/* ─── 25. Rentabilidad por Tracto ─── */}
          <Route path="/operaciones/rentabilidad" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops', 'direccion']}>
              <Rentabilidad />
            </ProtectedRoute>
          } />
          <Route path="/operaciones/programacion-impex" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops', 'direccion']}>
              <ProgramacionIMPEX />
            </ProtectedRoute>
          } />

          {/* ─── 20. WhatsApp — cs sí, ventas NO ─── */}
          <Route path="/servicio/whatsapp" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <WhatsAppBandeja />
            </ProtectedRoute>
          } />

          {/* ─── 21. Métricas Servicio — cs sí, ventas NO ─── */}
          <Route path="/servicio/metricas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs', 'direccion']}>
              <MetricasServicio />
            </ProtectedRoute>
          } />
          <Route path="/servicio/tickets" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs', 'direccion']}>
              <TicketsQuejas />
            </ProtectedRoute>
          } />

          {/* ─── 22. Inteligencia / Rankings ─── */}
          <Route path="/inteligencia" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <Inteligencia />
            </ProtectedRoute>
          } />

          {/* ─── 28. Comisiones por Ejecutivo ─── */}
          <Route path="/ventas/comisiones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'gerente_comercial', 'direccion']}>
              <Comisiones />
            </ProtectedRoute>
          } />
          <Route path="/ventas/funnel" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas', 'gerente_comercial', 'direccion']}>
              <FunnelVentas />
            </ProtectedRoute>
          } />

          {/* ─── 27. Presupuesto Mensual ─── */}
          <Route path="/inteligencia/presupuesto" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <PresupuestoMensual />
            </ProtectedRoute>
          } />

          {/* ─── 29. Análisis 80/20 (Pareto) ─── */}
          <Route path="/inteligencia/pareto" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <Analisis8020 />
            </ProtectedRoute>
          } />

          {/* ─── 23. CXC ─── */}
          <Route path="/cxc/cartera" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'cxc', 'direccion']}>
              <Cartera />
            </ProtectedRoute>
          } />

          {/* ─── Actividades ─── */}
          <Route path="/actividades" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs']}>
              <Actividades />
            </ProtectedRoute>
          } />

          {/* ─── Documentos ─── */}
          <Route path="/documentos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops', 'cxc']}>
              <Documentos />
            </ProtectedRoute>
          } />

          {/* ─── Cerebro Tarifario ─── */}
          <Route path="/pricing/cerebro-tarifario" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'pricing', 'gerente_comercial', 'direccion']}>
              <CerebroTarifario />
            </ProtectedRoute>
          } />

          {/* ─── Correos Automáticos ─── */}
          <Route path="/comunicaciones/correos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <CorreosAutomaticos />
            </ProtectedRoute>
          } />

          {/* ─── Notificaciones ─── */}
          <Route path="/comunicaciones/notificaciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops', 'supervisor_cs', 'direccion']}>
              <Notificaciones />
            </ProtectedRoute>
          } />

          {/* ─── Panel Integraciones ─── */}
          <Route path="/admin/integraciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <PanelIntegraciones />
            </ProtectedRoute>
          } />

          {/* ─── Programación Dedicados ─── */}
          <Route path="/operaciones/programacion-dedicados" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops', 'direccion']}>
              <ProgramacionDedicados />
            </ProtectedRoute>
          } />

          {/* ─── 24. Configuración — SOLO superadmin y admin ─── */}
          <Route path="/admin/configuracion" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <Configuracion />
            </ProtectedRoute>
          } />

          {/* ─── Dashboard 14 modulos ─── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <HomeDashboard />
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

