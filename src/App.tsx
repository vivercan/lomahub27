import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import HomeDashboard from './pages/HomeDashboard'

// Pages
const Login = lazy(() => import('./pages/Login'))
import Proximamente from './components/Proximamente'
const Unauthorized = lazy(() => import('./pages/Unauthorized'))
const WarRoom = lazy(() => import('./pages/WarRoom'))
const Inteligencia = lazy(() => import('./pages/Inteligencia'))

// Ventas
const DashboardVentas = lazy(() => import('./pages/ventas/DashboardVentas'))
const MisLeads = lazy(() => import('./pages/ventas/MisLeads'))
const NuevoLead = lazy(() => import('./pages/ventas/NuevoLead'))
const FichaLead = lazy(() => import('./pages/ventas/FichaLead'))
const ProgramaSemanal = lazy(() => import('./pages/ventas/ProgramaSemanal'))
const ProspeccionExterna = lazy(() => import('./pages/ventas/ProspeccionExterna'))
const VentasAnalytics = lazy(() => import('./pages/ventas/VentasAnalytics'))

// Cotizador
const NuevaCotizacion = lazy(() => import('./pages/cotizador/NuevaCotizacion'))
const FirmaDigital = lazy(() => import('./pages/cotizador/FirmaDigital'))
const MisCotizaciones = lazy(() => import('./pages/cotizador/MisCotizaciones'))
import { ErrorBoundary } from './components/ErrorBoundary'

// Clientes
const AltaCliente = lazy(() => import('./pages/clientes/AltaCliente'))
const PortalDocumentos = lazy(() => import('./pages/clientes/PortalDocumentos'))
const FichaCliente = lazy(() => import('./pages/clientes/FichaCliente'))
const RadiografiaFinanciera = lazy(() => import('./pages/clientes/RadiografiaFinanciera'))
const CorporativosClientes = lazy(() => import('./pages/clientes/CorporativosClientes'))
const AltaClienteWorkflow = lazy(() => import('./pages/clientes/AltaClienteWorkflow'))
const PortalAltaPublico = lazy(() => import('./pages/clientes/PortalAltaPublico'))
const PortalAltaReview = lazy(() => import('./pages/clientes/PortalAltaReview'))

// Operaciones
const Despachos = lazy(() => import('./pages/operaciones/Despachos'))
const TorreControl = lazy(() => import('./pages/operaciones/TorreControl'))
const MapaGPS = lazy(() => import('./pages/operaciones/MapaGPS'))
const Dedicados = lazy(() => import('./pages/operaciones/Dedicados'))
const TrazabilidadViaje = lazy(() => import('./pages/operaciones/TrazabilidadViaje'))
const ControlCajas = lazy(() => import('./pages/operaciones/ControlCajas'))
const ControlTractos = lazy(() => import('./pages/operaciones/ControlTractos'))
const Disponibilidad = lazy(() => import('./pages/operaciones/Disponibilidad'))
const OfertaEquipo = lazy(() => import('./pages/operaciones/OfertaEquipo'))
const Rentabilidad = lazy(() => import('./pages/operaciones/Rentabilidad'))
const CruceFronterizo = lazy(() => import('./pages/operaciones/CruceFronterizo'))
const ControlTemperatura = lazy(() => import('./pages/operaciones/ControlTemperatura'))
const PlaneacionFlota = lazy(() => import('./pages/operaciones/PlaneacionFlota'))

// Servicio
const DashboardCS = lazy(() => import('./pages/servicio/DashboardCS'))
const WhatsAppBandeja = lazy(() => import('./pages/servicio/WhatsApp'))
const MetricasServicio = lazy(() => import('./pages/servicio/MetricasServicio'))
const ComunicacionProactiva = lazy(() => import('./pages/servicio/ComunicacionProactiva'))
const EscalamientoWhatsApp = lazy(() => import('./pages/servicio/EscalamientoWhatsApp'))
const ViajesImpo = lazy(() => import('./pages/servicio/ViajesImpo'))
const ViajesExpo = lazy(() => import('./pages/servicio/ViajesExpo'))

// CXC
const Cartera = lazy(() => import('./pages/cxc/Cartera'))
const AgingReport = lazy(() => import('./pages/cxc/AgingReport'))
const AccionesCobro = lazy(() => import('./pages/cxc/AccionesCobro'))

// Inteligencia
const PresupuestoMensual = lazy(() => import('./pages/inteligencia/PresupuestoMensual'))
const Analisis8020 = lazy(() => import('./pages/inteligencia/Analisis8020'))

// Admin
const Configuracion = lazy(() => import('./pages/admin/Configuracion'))
const FlotaMaster = lazy(() => import('./pages/admin/FlotaMaster'))
const UsuariosPermisos = lazy(() => import('./pages/admin/UsuariosPermisos'))
const FunnelVentas = lazy(() => import('./pages/ventas/FunnelVentas'))
const TicketsQuejas = lazy(() => import('./pages/servicio/TicketsQuejas'))
const ProgramacionIMPEX = lazy(() => import('./pages/operaciones/ProgramacionIMPEX'))

// Módulos V28 nuevos
const Actividades = lazy(() => import('./pages/actividades/Actividades'))
const Documentos = lazy(() => import('./pages/documentos/Documentos'))
const CerebroTarifario = lazy(() => import('./pages/pricing/CerebroTarifario'))
const CorreosAutomaticos = lazy(() => import('./pages/comunicaciones/CorreosAutomaticos'))
const Notificaciones = lazy(() => import('./pages/comunicaciones/Notificaciones'))
const BriefingChiefOfStaff = lazy(() => import('./pages/comunicaciones/BriefingChiefOfStaff'))
const Comisiones = lazy(() => import('./pages/ventas/Comisiones'))
const ChiefOfStaffHome = lazy(() => import('./pages/comunicaciones/ChiefOfStaffHome'))
const PanelIntegraciones = lazy(() => import('./pages/admin/PanelIntegraciones'))
const ParametrosConfig = lazy(() => import('./pages/admin/ParametrosConfig'))
const CatalogosTab = lazy(() => import('./pages/admin/CatalogosTab'))
const ProgramacionDedicados = lazy(() => import('./pages/operaciones/ProgramacionDedicados'))
const ConfigIntegraciones = lazy(() => import('./pages/admin/ConfigIntegraciones'))
const DocumentosCompania = lazy(() => import('./pages/admin/DocumentosCompania'))
const TerminalesConfig = lazy(() => import('./pages/admin/TerminalesConfig'))
const DashboardOperaciones = lazy(() => import('./pages/operaciones/DashboardOperaciones'))
const ControlEquipo = lazy(() => import('./pages/ControlEquipo'))
const DashboardComunicaciones = lazy(() => import('./pages/comunicaciones/DashboardComunicaciones'))
// V50 26/Abr/2026 BUG-012 — Toast singleton montado en root
import { ToastContainer } from './components/ui/Toast'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
        <ToastContainer />
        
            <Suspense fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F7F8FA' }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#3B6CE7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ color: '#64748B', fontSize: '13px', fontFamily: 'Montserrat, sans-serif' }}>Cargando módulo…</span>
                </div>
              </div>
            }>
            <Routes>
          {/* ——— Public ——— */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ––– Portal Público Alta de Clientes (sin login, acceso por token) ––– */}
          <Route path="/alta/portal/:token" element={<PortalAltaPublico />} />
          <Route path="/alta/review/:adminToken" element={<PortalAltaReview />} />

          {/* ——— 02. War Room ——— */}
          <Route path="/war-room" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <WarRoom />
            </ProtectedRoute>
          } />

          {/* ——— 03. Dashboard Ventas ——— */}
          <Route path="/ventas/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <DashboardVentas />
            </ProtectedRoute>
          } />

          {/* ——— 04. Panel Personal Vendedor ——— */}
          <Route path="/ventas/mis-leads" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <MisLeads />
            </ProtectedRoute>
          } />

          {/* ——— 05. Captura de Lead ——— */}
          <Route path="/ventas/leads/nuevo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <NuevoLead />
            </ProtectedRoute>
          } />

          {/* ——— 06. Ficha del Lead ——— */}
          <Route path="/ventas/leads/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <FichaLead />
            </ProtectedRoute>
          } />

          {/* ——— 26. Programa Semanal ——— */}
          <Route path="/ventas/programa-semanal" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <ProgramaSemanal />
            </ProtectedRoute>
          } />

          {/* ——— Prospección Externa ——— */}
          <Route path="/ventas/prospeccion" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas']}>
              <ProspeccionExterna />
            </ProtectedRoute>
          } />

          {/* ––– Ventas Analytics ––– */}
          <Route path="/ventas/analytics" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <VentasAnalytics />
            </ProtectedRoute>
          } />

          {/* ——— 07. Cotizador ——— */}
                    <Route path="/cotizador/mis-cotizaciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas']}>
              <MisCotizaciones />
            </ProtectedRoute>
          } />
<Route path="/cotizador/nueva" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <NuevaCotizacion />
            </ProtectedRoute>
          } />
          {/* V50 26/Abr/2026 — BUG-005: ruta /cotizador/tarifas eliminada (duplicaba /cotizador/nueva) */}

          {/* ——— Firma Digital ——— */}
          <Route path="/cotizador/firma-digital" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas']}>
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
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <AltaCliente />
            </ProtectedRoute>
          } />

          {/* ——— Portal Documentos (Clientes) ——— */}
          <Route path="/clientes/:id/documentos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <PortalDocumentos />
            </ProtectedRoute>
          } />

          {/* ——— 30. Radiografía Financiera ——— */}
          <Route path="/clientes/:id/radiografia" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <RadiografiaFinanciera />
            </ProtectedRoute>
          } />

          {/* ——— 09b. Alta Clientes Workflow ——— */}
          <Route path="/clientes/workflow-alta" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <AltaClienteWorkflow />
            </ProtectedRoute>
          } />

          {/* ——— 09. Ficha 360° ——— */}
          <Route path="/clientes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <FichaCliente />
            </ProtectedRoute>
          } />

          {/* ——— 10. Dashboard CS — cs sí, ventas NO ——— */}
          <Route path="/servicio/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs']}>
              <DashboardCS />
            </ProtectedRoute>
          } />

          {/* --- Operaciones Dashboard --- */}
          <Route path="/operaciones/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <DashboardOperaciones />
            </ProtectedRoute>
          } />

          {/* --- Control de Equipo (WidgeTech GPS) --- */}
          <Route path="/control-equipo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones']}>
              <ControlEquipo />
            </ProtectedRoute>
          } />

          {/* --- Comunicaciones Dashboard --- */}
          <Route path="/comunicaciones/dashboard" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <DashboardComunicaciones />
            </ProtectedRoute>
          } />


          {/* ——— 11. Despachos ——— */}
          <Route path="/operaciones/despachos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <Despachos />
            </ProtectedRoute>
          } />

          {/* ——— 12. Despacho IA ——— */}
          <Route path="/operaciones/torre-control" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <TorreControl />
            </ProtectedRoute>
          } />

          {/* ——— 13. Mapa GPS ——— */}
          <Route path="/operaciones/mapa" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <MapaGPS />
            </ProtectedRoute>
          } />

          {/* ——— 14. Monitor Dedicados — operaciones accede aquí ——— */}
          <Route path="/operaciones/dedicados" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <Dedicados />
            </ProtectedRoute>
          } />

          {/* ——— 15. Trazabilidad ——— */}
          <Route path="/operaciones/viajes/:id" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
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
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <ControlTractos />
            </ProtectedRoute>
          } />

          {/* ——— Cruce Fronterizo ——— */}
          <Route path="/operaciones/cruce-fronterizo" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones']}>
              <CruceFronterizo />
            </ProtectedRoute>
          } />

          {/* ——— 18. Disponibilidad ——— */}
          <Route path="/operaciones/disponibilidad" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <Disponibilidad />
            </ProtectedRoute>
          } />

          {/* ——— Control Temperatura ——— */}
          <Route path="/operaciones/control-temperatura" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones']}>
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
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones']}>
              <PlaneacionFlota />
            </ProtectedRoute>
          } />

          {/* ——— 25. Rentabilidad por Tracto ——— */}
          <Route path="/operaciones/rentabilidad" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones']}>
              <Rentabilidad />
            </ProtectedRoute>
          } />

          <Route path="/operaciones/programacion-impex" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones']}>
              <ProgramacionIMPEX />
            </ProtectedRoute>
          } />

          {/* ——— 20. WhatsApp — cs sí, ventas NO ——— */}
          <Route path="/servicio/whatsapp" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs']}>
              <WhatsAppBandeja />
            </ProtectedRoute>
          } />

          {/* ——— 21. Métricas Servicio — cs sí, ventas NO ——— */}
          <Route path="/servicio/metricas" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs']}>
              <MetricasServicio />
            </ProtectedRoute>
          } />

          <Route path="/servicio/tickets" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs']}>
              <TicketsQuejas />
            </ProtectedRoute>
          } />

          {/* ——— Comunicación Proactiva ——— */}
          <Route path="/servicio/comunicacion-proactiva" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs']}>
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
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <Inteligencia />
            </ProtectedRoute>
          } />

          {/* ——— 28. Comisiones por Ejecutivo ——— */}

          <Route path="/ventas/funnel" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'ventas']}>
              <FunnelVentas />
            </ProtectedRoute>
          } />

          {/* ——— 27. Presupuesto Mensual ——— */}
          <Route path="/inteligencia/presupuesto" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <PresupuestoMensual />
            </ProtectedRoute>
          } />

          {/* ——— 29. Análisis 80/20 (Pareto) ——— */}
          <Route path="/inteligencia/pareto" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <Analisis8020 />
            </ProtectedRoute>
          } />

          {/* ——— 23. CXC ——— */}
          <Route path="/cxc/cartera" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <Cartera />
            </ProtectedRoute>
          } />

          {/* CXC Aging Report */}
          <Route path="/cxc/aging" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <AgingReport />
            </ProtectedRoute>
          } />

          {/* ——— CXC Acciones de Cobro ——— */}
          <Route path="/cxc/acciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <AccionesCobro />
            </ProtectedRoute>
          } />

          {/* ——— Actividades ——— */}
          <Route path="/actividades" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <Actividades />
            </ProtectedRoute>
          } />

          {/* ——— Documentos ——— */}
          <Route path="/documentos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <Documentos />
            </ProtectedRoute>
          } />

          {/* ——— Cerebro Tarifario ——— */}
          <Route path="/pricing/cerebro-tarifario" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <CerebroTarifario />
            </ProtectedRoute>
          } />

          {/* ——— Correos Automáticos ——— */}
          <Route path="/comunicaciones/correos" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <CorreosAutomaticos />
            </ProtectedRoute>
          } />

          {/* ——— Notificaciones ——— */}
          <Route path="/comunicaciones/notificaciones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas', 'operaciones']}>
              <Notificaciones />
            </ProtectedRoute>
          } />

          {/* ——— AI Chief of Staff ——— */}
          <Route path="/comunicaciones/chief-of-staff" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'cs', 'ventas']}>
              <ChiefOfStaffHome />
            </ProtectedRoute>
          } />

          {/* ——— Briefing individual (protegido) ——— */}
          <Route path="/briefing/:id" element={<BriefingChiefOfStaff />} />

          {/* V50 26/Abr/2026 — BUG-017: /admin/integraciones eliminada (duplicaba /admin/configuracion/integraciones) */}

          {/* ——— Programación Dedicados ——— */}
          <Route path="/operaciones/programacion-dedicados" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'operaciones']}>
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
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
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
          <Route path="/ventas/comisiones" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'direccion', 'gerente_comercial']}>
              <Comisiones />
            </ProtectedRoute>
          } />
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
            </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
