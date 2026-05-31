import { useState, useEffect } from 'react'
import { getInadimplencia, getCobrancas, getCondominios } from '../../api/api'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import './Inadimplencia.css'

function fmt(n) { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtDate(d) { if (!d) return '—'; const [y,m,dia] = d.split('-'); return `${dia}/${m}/${y}` }

export default function Inadimplencia() {
  const [resumo, setResumo] = useState([])
  const [cobrancas, setCobrancas] = useState([])
  const [condominios, setCondominios] = useState([])
  const [filtroCondominio, setFiltroCondominio] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingCob, setLoadingCob] = useState(false)

  useEffect(() => {
    Promise.all([getInadimplencia(), getCondominios()])
      .then(([r, c]) => { setResumo(r); setCondominios(c) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setLoadingCob(true)
    const params = filtroCondominio
      ? `?status=VENCIDO&condominio=${filtroCondominio}`
      : '?status=VENCIDO'
    getCobrancas(params)
      .then(setCobrancas)
      .finally(() => setLoadingCob(false))
  }, [filtroCondominio])

  const totalVencido = resumo.reduce((s, i) => s + parseFloat(i.valor_total_vencido || 0), 0)
  const totalQtd = resumo.reduce((s, i) => s + i.qtd_cobrancas_vencidas, 0)

  if (loading) return <div className="center-spinner"><div className="spinner" /></div>

  return (
    <div className="inadimplencia-page">
      {/* Totais */}
      <div className="ina-totals">
        <div className="ina-total-card red">
          <span className="itc-icon">⚠️</span>
          <div>
            <span className="itc-label">Cobranças vencidas</span>
            <span className="itc-value">{totalQtd}</span>
          </div>
        </div>
        <div className="ina-total-card orange">
          <span className="itc-icon">💸</span>
          <div>
            <span className="itc-label">Total em aberto</span>
            <span className="itc-value">{fmt(totalVencido)}</span>
          </div>
        </div>
        <div className="ina-total-card slate">
          <span className="itc-icon">🏢</span>
          <div>
            <span className="itc-label">Condomínios com inadimplência</span>
            <span className="itc-value">{resumo.length}</span>
          </div>
        </div>
      </div>

      {/* Resumo por condomínio */}
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h2 className="section-title">Resumo por Condomínio</h2>
      </div>
      {resumo.length === 0 ? (
        <div className="empty-state card"><div className="icon">✅</div><p>Nenhuma inadimplência registrada!</p></div>
      ) : (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Condomínio</th><th>Cobranças Vencidas</th><th>Valor Total Vencido</th><th></th></tr>
              </thead>
              <tbody>
                {resumo.map((item, i) => (
                  <tr key={i}>
                    <td><strong>{item.condominio}</strong></td>
                    <td><span className="badge badge-red">{item.qtd_cobrancas_vencidas}</span></td>
                    <td><span className="ina-valor">{fmt(item.valor_total_vencido)}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => setFiltroCondominio(filtroCondominio == item.condominio_id ? '' : item.condominio_id)}>
                        {filtroCondominio == item.condominio_id ? '✕ Limpar' : '🔍 Filtrar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detalhe: cobranças vencidas */}
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h2 className="section-title">Cobranças Vencidas</h2>
        <select className="form-control" style={{ maxWidth: 260 }} value={filtroCondominio}
          onChange={e => setFiltroCondominio(e.target.value)}>
          <option value="">Todos os condomínios</option>
          {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {loadingCob ? <div className="center-spinner"><div className="spinner" /></div> : (
        cobrancas.length === 0 ? (
          <div className="empty-state card"><div className="icon">✅</div><p>Nenhuma cobrança vencida.</p></div>
        ) : (
          <div className="card table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Unidade</th><th>Competência</th><th>Vencimento</th><th>Valor</th><th>Multa+Juros</th><th>Status</th></tr>
              </thead>
              <tbody>
                {cobrancas.map(c => (
                  <tr key={c.id}>
                    <td><span className="id-chip">{c.id}</span></td>
                    <td>{c.unidade_info}</td>
                    <td>{fmtDate(c.competencia)}</td>
                    <td className="td-red">{fmtDate(c.data_vencimento)}</td>
                    <td><strong>{fmt(c.valor)}</strong></td>
                    <td>
                      {(parseFloat(c.multa)+parseFloat(c.juros)) > 0
                        ? <span className="acrescimos">{fmt(parseFloat(c.multa)+parseFloat(c.juros))}</span>
                        : '—'}
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
