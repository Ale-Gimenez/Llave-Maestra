import { useLocation } from 'react-router-dom'
import './Navbar.css'

const titles = {
  '/':              { title: 'Dashboard',     sub: 'Visão geral do sistema' },
  '/condominios':   { title: 'Condomínios',   sub: 'Cadastro de empreendimentos' },
  '/unidades':      { title: 'Unidades',      sub: 'Gerenciamento de unidades' },
  '/cobrancas':     { title: 'Cobranças',     sub: 'Emissão e controle de receitas' },
  '/inadimplencia': { title: 'Inadimplência', sub: 'Resumo por condomínio' },
  '/acordos':       { title: 'Acordos',       sub: 'Parcelamentos negociados' },
}

export default function Navbar() {
  const { pathname } = useLocation()
  const info = titles[pathname] || { title: 'CondoSys', sub: '' }
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{info.title}</h1>
        <span className="topbar-sub">{info.sub}</span>
      </div>
      <div className="topbar-right">
        <span className="topbar-date">📅 {today}</span>
      </div>
    </header>
  )
}
