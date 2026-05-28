import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/layout.css';

const NAV_ITEMS = [
  {
    section: 'Principal',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <GridIcon /> },
    ],
  },
  {
    section: 'Cadastros',
    items: [
      { to: '/condominios', label: 'Condomínios', icon: <BuildingIcon /> },
      { to: '/unidades',    label: 'Unidades',    icon: <KeyIcon /> },
    ],
  },
  {
    section: 'Financeiro',
    items: [
      { to: '/cobrancas',   label: 'Cobranças',   icon: <BillIcon /> },
      { to: '/acordos',     label: 'Acordos',     icon: <HandshakeIcon /> },
      { to: '/inadimplencia', label: 'Inadimplência', icon: <AlertIcon /> },
    ],
  },
];

export default function Layout({ children, title, subtitle }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'AD';

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <BuildingIcon size={20} color="white" />
          </div>
          <div className="sidebar__logo-text">
            <span className="sidebar__logo-name">CondoGest</span>
            <span className="sidebar__logo-sub">Gestão Condominial</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((section) => (
            <div key={section.section}>
              <p className="sidebar__section-label">{section.section}</p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    'sidebar__nav-item' + (isActive ? ' active' : '')
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">{initials}</div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{user?.username || 'Admin'}</div>
              <div className="sidebar__user-role">Administrador</div>
            </div>
            <button className="sidebar__logout-btn" onClick={handleLogout} title="Sair">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar__left">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="topbar__right">
            <span className="topbar__badge">MVP v1.0</span>
          </div>
        </header>
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ── */
function GridIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}

function BuildingIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10"/><path d="M9 7h1"/><path d="M14 7h1"/><path d="M9 12h1"/><path d="M14 12h1"/>
    </svg>
  );
}

function KeyIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  );
}

function BillIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>
  );
}

function HandshakeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
    </svg>
  );
}

function AlertIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function LogoutIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
