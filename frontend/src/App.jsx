import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar/Sidebar'
import Navbar from './components/Navbar/Navbar'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Condominios from './pages/Condominios/Condominios'
import Unidades from './pages/Unidades/Unidades'
import Cobrancas from './pages/Cobrancas/Cobrancas'
import Acordos from './pages/Acordos/Acordos'
import Inadimplencia from './pages/Inadimplencia/Inadimplencia'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />
  return user ? children : <Navigate to="/login" replace />
}

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">{children}</main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><AppShell><Dashboard /></AppShell></PrivateRoute>} />
      <Route path="/condominios" element={<PrivateRoute><AppShell><Condominios /></AppShell></PrivateRoute>} />
      <Route path="/unidades" element={<PrivateRoute><AppShell><Unidades /></AppShell></PrivateRoute>} />
      <Route path="/cobrancas" element={<PrivateRoute><AppShell><Cobrancas /></AppShell></PrivateRoute>} />
      <Route path="/acordos" element={<PrivateRoute><AppShell><Acordos /></AppShell></PrivateRoute>} />
      <Route path="/inadimplencia" element={<PrivateRoute><AppShell><Inadimplencia /></AppShell></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
