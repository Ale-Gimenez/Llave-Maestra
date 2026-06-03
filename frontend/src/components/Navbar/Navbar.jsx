import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const { user, logout, canWrite } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const roleBadge = () => {
    if (!user) return null
    if (user.is_superuser) return { label: 'Superadmin', cls: 'role-super' }
    if (user.is_staff)     return { label: 'Admin', cls: 'role-admin' }
    return { label: 'Somente leitura', cls: 'role-user' }
  }

  const badge = roleBadge()

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="navbar-title">Llave Maestra</span>
      </div>
      <div className="navbar-right">
        {user && (
          <>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              {badge && <span className={`role-badge ${badge.cls}`}>{badge.label}</span>}
            </div>
            <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout}>
              Sair
            </button>
          </>
        )}
      </div>
    </header>
  )
}
