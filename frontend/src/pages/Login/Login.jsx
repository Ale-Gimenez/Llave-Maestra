import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Usuário ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Hero side */}
      <div className="login-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">Portal do Condomínio</div>
          <h1 className="hero-title">Gestão condominial<br />inteligente</h1>
          <p className="hero-desc">
            Controle cobranças, inadimplência e acordos de parcelamento em um único lugar.
          </p>
          <div className="hero-features">
            {['Cobranças automáticas', 'Controle de inadimplência', 'Acordos de parcelamento', 'Dashboard financeiro'].map(f => (
              <div key={f} className="hero-feature">
                <span className="feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="hero-buildings">
          <div className="building b1" />
          <div className="building b2" />
          <div className="building b3" />
          <div className="building b4" />
        </div>
      </div>

      {/* Form side */}
      <div className="login-form-side">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">C</div>
            <span className="login-logo-text">CondoSys</span>
          </div>
          <h2 className="login-heading">Bem-vindo de volta</h2>
          <p className="login-subheading">Acesse o painel administrativo</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Usuário</label>
              <input
                id="username"
                className="form-control"
                placeholder="Digite seu usuário"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="login-hint">
            <p>Usuários de teste:</p>
            <div className="hint-chips">
              {[
                { u: 'superadmin', r: 'Superusuário' },
                { u: 'admin', r: 'Administrador' },
                { u: 'user', r: 'Somente leitura' },
              ].map(({ u, r }) => (
                <button
                  key={u}
                  className="hint-chip"
                  onClick={() => setForm({ username: u, password: `${u}123` })}
                >
                  <strong>{u}</strong>
                  <span>{r}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
