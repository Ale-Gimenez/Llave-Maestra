import { useState, useEffect } from 'react'
import { getDashboard, getInadimplencia } from '../../api/api'
import './Dashboard.css'

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent ? 'stat-accent' : ''}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  )
}

function fmt(n) {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Dashboard() {
  const [dash, setDash] = useState(null)
  const [inadimp, setInadimp] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getDashboard(), getInadimplencia()])
      .then(([d, i]) => { setDash(d); setInadimp(i) })
      .catch(() => setError('Erro ao carregar dados. Verifique se o backend está rodando.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="center-spinner"><div className="spinner" /></div>
  if (error)   return <div className="alert alert-error" style={{ maxWidth: 500 }}>{error}</div>

  const taxaInadimplencia = dash.total_cobrancas > 0
    ? ((dash.total_vencidas / dash.total_cobrancas) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="dashboard">
      {/* Stat grid */}
      <div className="stats-grid">
        <StatCard icon="🏢" label="Condomínios"      value={dash.total_condominios} />
        <StatCard icon="🚪" label="Unidades"          value={dash.total_unidades} />
        <StatCard icon="💳" label="Total de Cobranças" value={dash.total_cobrancas} />
        <StatCard icon="🤝" label="Acordos Ativos"    value={dash.total_acordos} />
        <StatCard icon="✅" label="Cobranças Pagas"   value={dash.total_pagas}    accent />
        <StatCard icon="⏳" label="Pendentes"         value={dash.total_pendentes} />
        <StatCard icon="⚠️" label="Vencidas"          value={dash.total_vencidas}
          sub={`${taxaInadimplencia}% de inadimplência`} />
        <StatCard icon="💰" label="Recebido"
          value={fmt(dash.valor_total_recebido)} accent />
      </div>

      {/* Financial summary row */}
      <div className="finance-row">
        <div className="card finance-card">
          <div className="finance-header">
            <h3>Resumo Financeiro</h3>
          </div>
          <div className="finance-body">
            <div className="finance-item">
              <span className="fi-label">Total Recebido</span>
              <span className="fi-value green">{fmt(dash.valor_total_recebido)}</span>
            </div>
            <div className="finance-item">
              <span className="fi-label">Em Aberto</span>
              <span className="fi-value red">{fmt(dash.valor_total_em_aberto)}</span>
            </div>
            <div className="finance-divider" />
            <div className="finance-item">
              <span className="fi-label bold">Total Esperado</span>
              <span className="fi-value bold">
                {fmt(parseFloat(dash.valor_total_recebido) + parseFloat(dash.valor_total_em_aberto))}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="progress-wrap">
            <div className="progress-labels">
              <span>Recebimento</span>
              <span>
                {(
                  (dash.valor_total_recebido /
                  (parseFloat(dash.valor_total_recebido) + parseFloat(dash.valor_total_em_aberto) || 1)) * 100
                ).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    (dash.valor_total_recebido /
                    (parseFloat(dash.valor_total_recebido) + parseFloat(dash.valor_total_em_aberto) || 1)) * 100
                  }%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Status pills */}
        <div className="card status-breakdown-card">
          <div className="finance-header"><h3>Status das Cobranças</h3></div>
          <div className="status-pills">
            <div className="status-pill pill-green">
              <span className="pill-num">{dash.total_pagas}</span>
              <span className="pill-lbl">Pagas</span>
            </div>
            <div className="status-pill pill-yellow">
              <span className="pill-num">{dash.total_pendentes}</span>
              <span className="pill-lbl">Pendentes</span>
            </div>
            <div className="status-pill pill-red">
              <span className="pill-num">{dash.total_vencidas}</span>
              <span className="pill-lbl">Vencidas</span>
            </div>
          </div>
          <div className="stacked-bar-wrap">
            <div className="stacked-bar">
              {dash.total_cobrancas > 0 && <>
                <div className="sb-green" style={{ width: `${(dash.total_pagas/dash.total_cobrancas)*100}%` }} />
                <div className="sb-yellow" style={{ width: `${(dash.total_pendentes/dash.total_cobrancas)*100}%` }} />
                <div className="sb-red" style={{ width: `${(dash.total_vencidas/dash.total_cobrancas)*100}%` }} />
              </>}
            </div>
          </div>
        </div>
      </div>

      {/* Inadimplência por condomínio */}
      {inadimp.length > 0 && (
        <div className="card inadimp-section">
          <div className="finance-header">
            <h3>⚠️ Inadimplência por Condomínio</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Condomínio</th>
                  <th>Cobranças Vencidas</th>
                  <th>Valor Total Vencido</th>
                </tr>
              </thead>
              <tbody>
                {inadimp.map((item, i) => (
                  <tr key={i}>
                    <td><strong>{item.condominio}</strong></td>
                    <td>
                      <span className="badge badge-red">{item.qtd_cobrancas_vencidas}</span>
                    </td>
                    <td><span className="value-red">{fmt(item.valor_total_vencido)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
