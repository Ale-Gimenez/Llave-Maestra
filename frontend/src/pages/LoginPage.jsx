import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) { setError('Preencha usuário e senha.'); return; }
    setError('');
    setLoading(true);
    try {
      await signIn(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciais inválidas. Verifique e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* LEFT */}
      <div className="login-page__left">
        <div className="login-page__brand">
          <div className="login-page__brand-icon">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 22V12h6v10"/>
              <path d="M9 7h1"/><path d="M14 7h1"/>
              <path d="M9 12h1"/><path d="M14 12h1"/>
            </svg>
          </div>
          <h1>CondoGest</h1>
          <p>Sistema de Gestão Condominial para administradoras modernas</p>
        </div>

        <div className="login-page__features">
          {[
            'Controle de cobranças e inadimplência',
            'Gestão de condomínios e unidades',
            'Acordos de parcelamento automáticos',
            'Dashboard financeiro completo',
            'Autenticação segura com JWT',
          ].map((f) => (
            <div key={f} className="login-page__feature">
              <div className="login-page__feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-page__right">
        <div className="login-form-wrap">
          <h2>Bem-vindo de volta</h2>
          <p>Acesse o painel de gestão do condomínio</p>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-form__error">{error}</div>}

            <div className="login-form__group">
              <label className="login-form__label">Usuário</label>
              <input
                className="login-form__input"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>

            <div className="login-form__group">
              <label className="login-form__label">Senha</label>
              <input
                className="login-form__input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="login-form__btn" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar no sistema'}
            </button>
          </form>

          <p className="login-form__footer">
            SENAI Roberto Mange · Projeto Somativo 2026
          </p>
        </div>
      </div>
    </div>
  );
}
