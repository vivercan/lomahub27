import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
          <Route path="/cxc/acciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'cxc', 'direccion']}>
              <AccionesCobro />
            </ProtectedRoute>
          } />
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
import ProspeccionExterna from './pages/ventas/ProspeccionExterna'

// Cotizador
import NuevaCotizacion from './pages/cotizador/NuevaCotizacion'
import FirmaDigital from './pages/cotizador/FirmaDigital'

// Clientes
import AltaCliente from './pages/clientes/AltaCliente'
import FichaCliente from './pages/clientes/FichaCliente'
import RadiografiaFinanciera from './pages/clientes/RadiografiaFinanciera'
import CorporativosClientes from './pages/clientes/CorporativosClientes'

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
import CruceFronterizo from './pages/operaciones/CruceFronterizo'
import ControlTemperatura from './pages/operaciones/ControlTemperatura'
import PlaneacionFlota from './pages/operaciones/PlaneacionFlota'

// Servicio
import DashboardCS from './pages/servicio/DashboardCS'
import WhatsAppBandeja from './pages/servicio/WhatsApp'
import MetricasServicio from './pages/servicio/MetricasServicio'
import ComunicacionProactiva from './pages/servicio/ComunicacionProactiva'
import EscalamientoWhatsApp from './pages/servicio/EscalamientoWhatsApp'

// CXC
import Cartera from './pages/cxc/Cartera'
import AgingReport from './pages/cxc/AgingReport'
import AccionesCobro from './pages/cxc/AccionesCobro'

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
          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Public Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 02. War Room Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/war-room" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'direccion']}>
              <WarRoom />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 03. Dashboard Ventas Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/ventas/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <DashboardVentas />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 04. Panel Personal Vendedor Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/ventas/mis-leads" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <MisLeads />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 05. Captura de Lead Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/ventas/leads/nuevo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <NuevoLead />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 06. Ficha del Lead Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/ventas/leads/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <FichaLead />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 26. Programa Semanal Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/ventas/programa-semanal" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'direccion']}>
              <ProgramaSemanal />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Prospección Externa Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/ventas/prospeccion" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas', 'gerente_comercial']}>
              <ProspeccionExterna />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 07. Cotizador Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
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

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Firma Digital Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/cotizador/firma-digital" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas', 'gerente_comercial', 'pricing']}>
              <FirmaDigital />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 08b. Clientes Corporativos Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/clientes/corporativos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <CorporativosClientes />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 08. Alta de Cliente Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/clientes/alta" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc', 'pricing']}>
              <AltaCliente />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 30. Radiografía Financiera Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/clientes/:id/radiografia" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'cxc', 'direccion']}>
              <RadiografiaFinanciera />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 09. Ficha 360° Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/clientes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc', 'direccion', 'operaciones', 'gerente_ops']}>
              <FichaCliente />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 10. Dashboard CS — cs sí, ventas NO Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/servicio/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <DashboardCS />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 11. Despachos Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/despachos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs']}>
              <Despachos />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 12. Torre de Control Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/torre-control" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion']}>
              <TorreControl />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 13. Mapa GPS Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/mapa" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion']}>
              <MapaGPS />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 14. Monitor Dedicados — operaciones accede aquí Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/dedicados" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops']}>
              <Dedicados />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 15. Trazabilidad Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/viajes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops']}>
              <TrazabilidadViaje />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 16. Control de Cajas Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/cajas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <ControlCajas />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 17. Control de Tractos Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/tractos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops']}>
              <ControlTractos />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Cruce Fronterizo Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/cruce-fronterizo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops']}>
              <CruceFronterizo />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 18. Disponibilidad Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/disponibilidad" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_ops', 'direccion']}>
              <Disponibilidad />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Control Temperatura Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/control-temperatura" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops']}>
              <ControlTemperatura />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 19. Oferta de Equipo Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/oferta-equipo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <OfertaEquipo />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Planeación Flota Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/planeacion-flota" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops']}>
              <PlaneacionFlota />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 25. Rentabilidad por Tracto Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
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

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 20. WhatsApp — cs sí, ventas NO Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/servicio/whatsapp" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <WhatsAppBandeja />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 21. Métricas Servicio — cs sí, ventas NO Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
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

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Comunicación Proactiva Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/servicio/comunicacion-proactiva" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <ComunicacionProactiva />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Escalamiento WhatsApp Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/servicio/escalamiento-whatsapp" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs']}>
              <EscalamientoWhatsApp />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 22. Inteligencia / Rankings Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/inteligencia" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <Inteligencia />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 28. Comisiones por Ejecutivo Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
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

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 27. Presupuesto Mensual Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/inteligencia/presupuesto" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <PresupuestoMensual />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 29. Análisis 80/20 (Pareto) Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/inteligencia/pareto" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <Analisis8020 />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 23. CXC Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/cxc/cartera" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'cxc', 'direccion']}>
              <Cartera />
            </ProtectedRoute>
          } />

          {/* CXC Aging Report */}
          <Route path="/cxc/aging" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'cxc', 'direccion']}>
              <AgingReport />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Actividades Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/actividades" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs']}>
              <Actividades />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Documentos Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/documentos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops', 'cxc']}>
              <Documentos />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Cerebro Tarifario Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/pricing/cerebro-tarifario" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'pricing', 'gerente_comercial', 'direccion']}>
              <CerebroTarifario />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Correos Automáticos Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/comunicaciones/correos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <CorreosAutomaticos />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Notificaciones Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/comunicaciones/notificaciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops', 'supervisor_cs', 'direccion']}>
              <Notificaciones />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Panel Integraciones Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/admin/integraciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <PanelIntegraciones />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Programación Dedicados Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/operaciones/programacion-dedicados" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops', 'direccion']}>
              <ProgramacionDedicados />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ 24. Configuración — SOLO superadmin y admin Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/admin/configuracion" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <Configuracion />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Dashboard 14 modulos Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <HomeDashboard />
            </ProtectedRoute>
          } />

          {/* Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Default Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
