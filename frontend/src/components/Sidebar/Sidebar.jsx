import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

const navItems = [
  { to: '/',              icon: '◼',  label: 'Dashboard'      },
  { to: '/condominios',   icon: '🏢', label: 'Condomínios'    },
  { to: '/unidades',      icon: '🚪', label: 'Unidades'       },
  { to: '/cobrancas',     icon: '💳', label: 'Cobranças'      },
  { to: '/inadimplencia', icon: '⚠️', label: 'Inadimplência'  },
  { to: '/acordos',       icon: '🤝', label: 'Acordos'        },
]

function getRoleLabel(user) {
  if (!user) return ''
  if (user.is_superuser) return 'Superadmin'
  if (user.is_staff) return 'Administrador'
  return 'Somente leitura'
}

export default function Sidebar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">C</div>
        <div className="brand-text">
          <span className="brand-name">CondoSys</span>
          <span className="brand-sub">Portal Admin</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className="user-role">{getRoleLabel(user)}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Sair">
          ⏻
        </button>
      </div>
    </aside>
  )
}
