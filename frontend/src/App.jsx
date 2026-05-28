import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';

import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import CondominiosPage from './pages/CondominiosPage';
import UnidadesPage    from './pages/UnidadesPage';
import CobrancasPage   from './pages/CobrancasPage';
import AcordosPage     from './pages/AcordosPage';
import InadimplenciaPage from './pages/InadimplenciaPage';

import './styles/global.css';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
              <PrivateRoute><DashboardPage /></PrivateRoute>
            } />
            <Route path="/condominios" element={
              <PrivateRoute><CondominiosPage /></PrivateRoute>
            } />
            <Route path="/unidades" element={
              <PrivateRoute><UnidadesPage /></PrivateRoute>
            } />
            <Route path="/cobrancas" element={
              <PrivateRoute><CobrancasPage /></PrivateRoute>
            } />
            <Route path="/acordos" element={
              <PrivateRoute><AcordosPage /></PrivateRoute>
            } />
            <Route path="/inadimplencia" element={
              <PrivateRoute><InadimplenciaPage /></PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
