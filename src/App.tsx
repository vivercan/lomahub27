import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import HomeDashboard from './pages/HomeDashboard'

// Pages
import Login from './pages/Login'
import Proximamente from './components/Proximamente'
import Unauthorized from './pages/Unauthorized'
import WarRoom from './pages/WarRoom'
import Inteligencia from './pages/Inteligencia'

// Ventas
import DashboardVentas from './pages/ventas/DashboardVentas'
import MisLeads from './pages/ventas/MisLeads'
import NuevoLead from './pages/ventas/NuevoLead'
import FichaLead from './pages/ventas/FichaLead'
import ProgramaSemanal from './pages/ventas/ProgramaSemanal'
import ProspeccionExterna from './pages/ventas/ProspeccionExterna'
import VentasAnalytics from './pages/ventas/VentasAnalytics'

// Cotizador
import NuevaCotizacion from './pages/cotizador/NuevaCotizacion'
import FirmaDigital from './pages/cotizador/FirmaDigital'
import MisCotizaciones from './pages/cotizador/MisCotizaciones'
import { ErrorBoundary } from './components/ErrorBoundary'

// Clientes
import AltaCliente from './pages/clientes/AltaCliente'
import PortalDocumentos from './pages/clientes/PortalDocumentos'
import FichaCliente from './pages/clientes/FichaCliente'
import RadiografiaFinanciera from './pages/clientes/RadiografiaFinanciera'
import CorporativosClientes from './pages/clientes/CorporativosClientes'
import AltaClienteWorkflow from './pages/clientes/AltaClienteWorkflow'
import PortalAltaPublico from './pages/clientes/PortalAltaPublico'
import PortalAltaReview from './pages/clientes/PortalAltaReview'

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
import ViajesImpo from './pages/servicio/ViajesImpo'
import ViajesExpo from './pages/servicio/ViajesExpo'

// CXC
import Cartera from './pages/cxc/Cartera'
import AgingReport from './pages/cxc/AgingReport'
import AccionesCobro from './pages/cxc/AccionesCobro'

// Inteligencia
import PresupuestoMensual from './pages/inteligencia/PresupuestoMensual'
import Analisis8020 from './pages/inteligencia/Analisis8020'

// Admin
import Configuracion from './pages/admin/Configuracion'
import FlotaMaster from './pages/admin/FlotaMaster'
import UsuariosPermisos from './pages/admin/UsuariosPermisos'
import FunnelVentas from './pages/ventas/FunnelVentas'
import TicketsQuejas from './pages/servicio/TicketsQuejas'
import ProgramacionIMPEX from './pages/operaciones/ProgramacionIMPEX'

// Módulos V28 nuevos
import Actividades from './pages/actividades/Actividades'
import Documentos from './pages/documentos/Documentos'
import CerebroTarifario from './pages/pricing/CerebroTarifario'
import CorreosAutomaticos from './pages/comunicaciones/CorreosAutomaticos'
import Notificaciones from './pages/comunicaciones/Notificaciones'
import BriefingChiefOfStaff from './pages/comunicaciones/BriefingChiefOfStaff'
import ChiefOfStaffHome from './pages/comunicaciones/ChiefOfStaffHome'
import PanelIntegraciones from './pages/admin/PanelIntegraciones'
import ParametrosConfig from './pages/admin/ParametrosConfig'
import CatalogosTab from './pages/admin/CatalogosTab'
import ProgramacionDedicados from './pages/operaciones/ProgramacionDedicados'
import ConfigIntegraciones from './pages/admin/ConfigIntegraciones'
import DocumentosCompania from './pages/admin/DocumentosCompania'
import TerminalesConfig from './pages/admin/TerminalesConfig'
import DashboardOperaciones from './pages/operaciones/DashboardOperaciones'
import ControlEquipo from './pages/ControlEquipo'
import DashboardComunicaciones from './pages/comunicaciones/DashboardComunicaciones'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
        <Routes>
          {/* ——— Public ——— */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ––– Portal Público Alta de Clientes (sin login, acceso por token) ––– */}
          <Route path="/alta/portal/:token" element={<PortalAltaPublico />} />
          <Route path="/alta/review/:adminToken" element={<PortalAltaReview />} />

          {/* ——— 02. War Room ——— */}
          <Route path="/war-room" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'direccion']}>
              <WarRoom />
            </ProtectedRoute>
          } />

          {/* ——— 03. Dashboard Ventas ——— */}
          <Route path="/ventas/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <DashboardVentas />
            </ProtectedRoute>
          } />

          {/* ——— 04. Panel Personal Vendedor ——— */}
          <Route path="/ventas/mis-leads" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <MisLeads />
            </ProtectedRoute>
          } />

          {/* ——— 05. Captura de Lead ——— */}
          <Route path="/ventas/leads/nuevo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <NuevoLead />
            </ProtectedRoute>
          } />

          {/* ——— 06. Ficha del Lead ——— */}
          <Route path="/ventas/leads/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <FichaLead />
            </ProtectedRoute>
          } />

          {/* ——— 26. Programa Semanal ——— */}
          <Route path="/ventas/programa-semanal" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'direccion']}>
              <ProgramaSemanal />
            </ProtectedRoute>
          } />

          {/* ——— Prospección Externa ——— */}
          <Route path="/ventas/prospeccion" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas', 'gerente_comercial']}>
              <ProspeccionExterna />
            </ProtectedRoute>
          } />

          {/* ––– Ventas Analytics ––– */}
          <Route path="/ventas/analytics" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'direccion']}>
              <VentasAnalytics />
            </ProtectedRoute>
          } />

          {/* ——— 07. Cotizador ——— */}
                    <Route path="/cotizador/mis-cotizaciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas', 'gerente_comercial', 'pricing']}>
              <MisCotizaciones />
            </ProtectedRoute>
          } />
<Route path="/cotizador/nueva" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'pricing']}>
              <NuevaCotizacion />
            </ProtectedRoute>
          } />
          {/* V50 26/Abr/2026 — BUG-005: ruta /cotizador/tarifas eliminada (duplicaba /cotizador/nueva) */}

          {/* ——— Firma Digital ——— */}
          <Route path="/cotizador/firma-digital" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas', 'gerente_comercial', 'pricing']}>
              <FirmaDigital />
            </ProtectedRoute>
          } />

          {/* ——— 08b. Clientes Corporativos ——— */}
          <Route path="/clientes/corporativos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <CorporativosClientes />
            </ProtectedRoute>
          } />

          {/* ——— 08. Alta de Cliente ——— */}
          <Route path="/clientes/alta" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc', 'pricing']}>
              <AltaCliente />
            </ProtectedRoute>
          } />

          {/* ——— Portal Documentos (Clientes) ——— */}
          <Route path="/clientes/:id/documentos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc', 'pricing']}>
              <PortalDocumentos />
            </ProtectedRoute>
          } />

          {/* ——— 30. Radiografía Financiera ——— */}
          <Route path="/clientes/:id/radiografia" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'cxc', 'direccion']}>
              <RadiografiaFinanciera />
            </ProtectedRoute>
          } />

          {/* ——— 09b. Alta Clientes Workflow ——— */}
          <Route path="/clientes/workflow-alta" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc']}>
              <AltaClienteWorkflow />
            </ProtectedRoute>
          } />

          {/* ——— 09. Ficha 360° ——— */}
          <Route path="/clientes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'cxc', 'direccion', 'operaciones', 'gerente_ops']}>
              <FichaCliente />
            </ProtectedRoute>
          } />

          {/* ——— 10. Dashboard CS — cs sí, ventas NO ——— */}
          <Route path="/servicio/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <DashboardCS />
            </ProtectedRoute>
          } />

          {/* --- Operaciones Dashboard --- */}
          <Route path="/operaciones/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops', 'direccion']}>
              <DashboardOperaciones />
            </ProtectedRoute>
          } />

          {/* --- Control de Equipo (WidgeTech GPS) --- */}
          <Route path="/control-equipo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops', 'direccion']}>
              <ControlEquipo />
            </ProtectedRoute>
          } />

          {/* --- Comunicaciones Dashboard --- */}
          <Route path="/comunicaciones/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs', 'direccion']}>
              <DashboardComunicaciones />
            </ProtectedRoute>
          } />


          {/* ——— 11. Despachos ——— */}
          <Route path="/operaciones/despachos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs']}>
              <Despachos />
            </ProtectedRoute>
          } />

          {/* ——— 12. Despacho IA ——— */}
          <Route path="/operaciones/torre-control" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion']}>
              <TorreControl />
            </ProtectedRoute>
          } />

          {/* ——— 13. Mapa GPS ——— */}
          <Route path="/operaciones/mapa" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops', 'direccion']}>
              <MapaGPS />
            </ProtectedRoute>
          } />

          {/* ——— 14. Monitor Dedicados — operaciones accede aquí ——— */}
          <Route path="/operaciones/dedicados" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops']}>
              <Dedicados />
            </ProtectedRoute>
          } />

          {/* ——— 15. Trazabilidad ——— */}
          <Route path="/operaciones/viajes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'supervisor_cs', 'operaciones', 'gerente_ops']}>
              <TrazabilidadViaje />
            </ProtectedRoute>
          } />

          {/* ——— 16. Control de Cajas ——— */}
          <Route path="/operaciones/cajas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <ControlCajas />
            </ProtectedRoute>
          } />

          {/* ——— 17. Control de Tractos ——— */}
          <Route path="/operaciones/tractos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops']}>
              <ControlTractos />
            </ProtectedRoute>
          } />

          {/* ——— Cruce Fronterizo ——— */}
          <Route path="/operaciones/cruce-fronterizo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops']}>
              <CruceFronterizo />
            </ProtectedRoute>
          } />

          {/* ——— 18. Disponibilidad ——— */}
          <Route path="/operaciones/disponibilidad" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_ops', 'direccion']}>
              <Disponibilidad />
            </ProtectedRoute>
          } />

          {/* ——— Control Temperatura ——— */}
          <Route path="/operaciones/control-temperatura" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops']}>
              <ControlTemperatura />
            </ProtectedRoute>
          } />

          {/* ——— 19. Oferta de Equipo ——— */}
          <Route path="/operaciones/oferta-equipo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <OfertaEquipo />
            </ProtectedRoute>
          } />

          {/* ——— Planeación Flota ——— */}
          <Route path="/operaciones/planeacion-flota" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops']}>
              <PlaneacionFlota />
            </ProtectedRoute>
          } />

          {/* ——— 25. Rentabilidad por Tracto ——— */}
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

          {/* ——— 20. WhatsApp — cs sí, ventas NO ——— */}
          <Route path="/servicio/whatsapp" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <WhatsAppBandeja />
            </ProtectedRoute>
          } />

          {/* ——— 21. Métricas Servicio — cs sí, ventas NO ——— */}
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

          {/* ——— Comunicación Proactiva ——— */}
          <Route path="/servicio/comunicacion-proactiva" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'supervisor_cs']}>
              <ComunicacionProactiva />
            </ProtectedRoute>
          } />

          {/* ——— Escalamiento WhatsApp ——— */}
          <Route path="/servicio/escalamiento-whatsapp" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs']}>
              <EscalamientoWhatsApp />
            </ProtectedRoute>
          } />

          {/* ——— Servicio Importación ——— */}
          <Route path="/servicio/importacion" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs']}>
              <ViajesImpo />
            </ProtectedRoute>
          } />

          {/* ——— Servicio Exportación ——— */}
          <Route path="/servicio/exportacion" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs']}>
              <ViajesExpo />
            </ProtectedRoute>
          } />

          {/* ——— 22. Inteligencia / Rankings ——— */}
          <Route path="/inteligencia" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <Inteligencia />
            </ProtectedRoute>
          } />

          {/* ——— 28. Comisiones por Ejecutivo ——— */}

          <Route path="/ventas/funnel" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas', 'gerente_comercial', 'direccion']}>
              <FunnelVentas />
            </ProtectedRoute>
          } />

          {/* ——— 27. Presupuesto Mensual ——— */}
          <Route path="/inteligencia/presupuesto" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <PresupuestoMensual />
            </ProtectedRoute>
          } />

          {/* ——— 29. Análisis 80/20 (Pareto) ——— */}
          <Route path="/inteligencia/pareto" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'direccion', 'gerente_comercial', 'gerente_ops']}>
              <Analisis8020 />
            </ProtectedRoute>
          } />

          {/* ——— 23. CXC ——— */}
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

          {/* ——— CXC Acciones de Cobro ——— */}
          <Route path="/cxc/acciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'cxc', 'direccion']}>
              <AccionesCobro />
            </ProtectedRoute>
          } />

          {/* ——— Actividades ——— */}
          <Route path="/actividades" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'supervisor_cs']}>
              <Actividades />
            </ProtectedRoute>
          } />

          {/* ——— Documentos ——— */}
          <Route path="/documentos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops', 'cxc']}>
              <Documentos />
            </ProtectedRoute>
          } />

          {/* ——— Cerebro Tarifario ——— */}
          <Route path="/pricing/cerebro-tarifario" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'pricing', 'gerente_comercial', 'direccion']}>
              <CerebroTarifario />
            </ProtectedRoute>
          } />

          {/* ——— Correos Automáticos ——— */}
          <Route path="/comunicaciones/correos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial']}>
              <CorreosAutomaticos />
            </ProtectedRoute>
          } />

          {/* ——— Notificaciones ——— */}
          <Route path="/comunicaciones/notificaciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones', 'gerente_ops', 'supervisor_cs', 'direccion']}>
              <Notificaciones />
            </ProtectedRoute>
          } />

          {/* ——— AI Chief of Staff ——— */}
          <Route path="/comunicaciones/chief-of-staff" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'gerente_comercial', 'direccion']}>
              <ChiefOfStaffHome />
            </ProtectedRoute>
          } />

          {/* ——— Briefing individual (protegido) ——— */}
          <Route path="/briefing/:id" element={<BriefingChiefOfStaff />} />

          {/* V50 26/Abr/2026 — BUG-017: /admin/integraciones eliminada (duplicaba /admin/configuracion/integraciones) */}

          {/* ——— Programación Dedicados ——— */}
          <Route path="/operaciones/programacion-dedicados" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones', 'gerente_ops', 'direccion']}>
              <ProgramacionDedicados />
            </ProtectedRoute>
          } />

          {/* ——— 24. Configuración — SOLO superadmin y admin ——— */}
          <Route path="/admin/configuracion" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <Configuracion />
            </ProtectedRoute>
          } />

          {/* ——— Config sub-routes ——— */}
          <Route path="/admin/configuracion/usuarios" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <UsuariosPermisos />
            </ProtectedRoute>
          } />
          <Route path="/admin/configuracion/catalogos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <CatalogosTab />
            </ProtectedRoute>
          } />
          <Route path="/admin/configuracion/parametros" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <ParametrosConfig />
            </ProtectedRoute>
          } />
          <Route path="/admin/configuracion/tarifas-ia" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'pricing', 'gerente_comercial', 'direccion']}>
              <ParametrosConfig />
            </ProtectedRoute>
          } />
          <Route path="/admin/configuracion/integraciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <PanelIntegraciones />
            </ProtectedRoute>
          } />
          <Route path="/admin/configuracion/flota-master" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <FlotaMaster />
            </ProtectedRoute>
          } />
          <Route path="/admin/configuracion/documentos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <DocumentosCompania />
            </ProtectedRoute>
          } />
          <Route path="/admin/configuracion/terminales" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <TerminalesConfig />
            </ProtectedRoute>
          } />

          {/* ——— Dashboard V27k 8 cards (canónico, ratificado audit 17/Abr/2026) ——— */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <HomeDashboard />
            </ProtectedRoute>
          } />

          {/* --- Redirects legacy a rutas canonicas (P0-03) --- */}
          <Route path="/ventas/nuevo-lead" element={<Navigate to="/ventas/leads/nuevo" replace />} />
          <Route path="/ventas/leads" element={<Navigate to="/ventas/mis-leads" replace />} />
          <Route path="/ventas/comisiones" element={<Navigate to="/ventas/dashboard" replace />} />
          <Route path="/ventas/prospeccion-externa" element={<Navigate to="/ventas/prospeccion" replace />} />
          <Route path="/clientes" element={<Navigate to="/clientes/alta" replace />} />
          <Route path="/operaciones/mapa-gps" element={<Navigate to="/operaciones/mapa" replace />} />
          <Route path="/operaciones/control-tractos" element={<Navigate to="/operaciones/tractos" replace />} />
          <Route path="/operaciones/control-cajas" element={<Navigate to="/operaciones/cajas" replace />} />
          <Route path="/operaciones/viajes" element={<Navigate to="/operaciones/torre-control" replace />} />
          <Route path="/operaciones/trazabilidad" element={<Navigate to="/operaciones/torre-control" replace />} />
          <Route path="/cotizador/nuevo" element={<Navigate to="/cotizador/nueva" replace />} />
          <Route path="/inteligencia/rankings" element={<Navigate to="/inteligencia" replace />} />

          {/* ——— Default ——— */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
