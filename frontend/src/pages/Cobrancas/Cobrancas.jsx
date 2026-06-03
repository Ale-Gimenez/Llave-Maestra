import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCobrancas, getUnidades, getCondominios, createCobranca, updateCobranca, deleteCobranca, getAcordos } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal/Modal'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import './Cobrancas.css'

const EMPTY_CREATE = { unidade_id: '', competencia: '', data_vencimento: '', valor: '', status: 'PENDENTE', observacao: '' }

function fmt(n) { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtDate(d) { if (!d) return '—'; const [y,m,dia] = d.split('-'); return `${dia}/${m}/${y}` }

export default function Cobrancas() {
  const { canWrite } = useAuth()
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [unidades, setUnidades] = useState([])
  const [condominios, setCondominios] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ unidade: '', status: '', condominio: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [showPagar, setShowPagar] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_CREATE)
  const [pagarForm, setPagarForm] = useState({ data_pagamento: '', forma_pagamento: 'PIX' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  // Mapa cobrancaId -> acordoId para cobranças com acordo ativo
  const [acordosMap, setAcordosMap] = useState({})

  function buildParams() {
    const p = []
    if (filter.unidade) p.push(`unidade=${filter.unidade}`)
    if (filter.status) p.push(`status=${filter.status}`)
    if (filter.condominio) p.push(`condominio=${filter.condominio}`)
    return p.length ? `?${p.join('&')}` : ''
  }

  const load = () => {
    setLoading(true)
    Promise.all([getCobrancas(buildParams()), getUnidades(), getCondominios(), getAcordos()])
      .then(([c, u, co, acordos]) => {
        setList(c)
        setUnidades(u)
        setCondominios(co)
        // Monta mapa cobrancaId -> acordoId para acordos não quitados
        const mapa = {}
        acordos.forEach(a => {
          const parcelas = a.parcelas || []
          const quitado = parcelas.length > 0 && parcelas.every(p => p.status === 'PAGO')
          if (!quitado) {
            (a.cobrancas_ids || []).forEach(cid => { mapa[cid] = a.id })
          }
        })
        setAcordosMap(mapa)
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filter])

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true); setFormError('')
    try {
      await createCobranca(form)
      setShowCreate(false); setForm(EMPTY_CREATE); load()
    } catch (err) {
      const d = err.data || {}
      setFormError(Object.values(d).flat().join(' | ') || 'Erro ao criar')
    } finally { setSaving(false) }
  }

  function openPagar(c) {
    setSelected(c)
    setPagarForm({ data_pagamento: new Date().toISOString().slice(0, 10), forma_pagamento: 'PIX' })
    setFormError(''); setShowPagar(true)
  }

  async function handlePagar(e) {
    e.preventDefault(); setSaving(true); setFormError('')
    try {
      const payload = {
        unidade_id: selected.unidade_id,
        competencia: selected.competencia,
        data_vencimento: selected.data_vencimento,
        valor: selected.valor,
        status: 'PAGO',
        data_pagamento: pagarForm.data_pagamento,
        forma_pagamento: pagarForm.forma_pagamento,
        observacao: selected.observacao || '',
      }
      await updateCobranca(selected.id, payload)
      setShowPagar(false); load()
    } catch (err) {
      const d = err.data || {}
      setFormError(Object.values(d).flat().join(' | ') || 'Erro ao registrar pagamento')
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta cobrança?')) return
    try { await deleteCobranca(id); load() }
    catch { alert('Não foi possível excluir.') }
  }

  if (loading) return <div className="center-spinner"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="section-title">Cobranças</h2>
          <p className="section-sub">{list.length} registro{list.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite() && (
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY_CREATE); setFormError(''); setShowCreate(true) }}>
            + Nova Cobrança
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card filter-bar">
        <select className="form-control filter-select" value={filter.condominio}
          onChange={e => setFilter(p => ({ ...p, condominio: e.target.value, unidade: '' }))}>
          <option value="">Todos os condomínios</option>
          {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select className="form-control filter-select" value={filter.unidade}
          onChange={e => setFilter(p => ({ ...p, unidade: e.target.value }))}>
          <option value="">Todas as unidades</option>
          {unidades
            .filter(u => !filter.condominio || String(u.condominio_id) === String(filter.condominio))
            .map(u => <option key={u.id} value={u.id}>{u.numero}{u.bloco ? ` - Bloco ${u.bloco}` : ''} ({u.condominio_nome})</option>)}
        </select>
        <select className="form-control filter-select" value={filter.status}
          onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
          <option value="VENCIDO">Vencido</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        {(filter.condominio || filter.unidade || filter.status) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ unidade: '', status: '', condominio: '' })}>
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="empty-state card"><div className="icon">💳</div><p>Nenhuma cobrança encontrada.</p></div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Unidade</th>
                <th>Competência</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Multa+Juros</th>
                <th>Total</th>
                <th>Status</th>
                <th>Pagamento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id}>
                  <td><span className="id-chip">{c.id}</span></td>
                  <td><span className="unidade-cell">{c.unidade_info}</span></td>
                  <td>{fmtDate(c.competencia)}</td>
                  <td className={c.status === 'VENCIDO' ? 'td-red' : ''}>{fmtDate(c.data_vencimento)}</td>
                  <td>{fmt(c.valor)}</td>
                  <td>
                    {(parseFloat(c.multa) + parseFloat(c.juros)) > 0
                      ? <span className="acrescimos">{fmt(parseFloat(c.multa) + parseFloat(c.juros))}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td><strong>{fmt(c.valor_total)}</strong></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    {c.data_pagamento
                      ? <span>{fmtDate(c.data_pagamento)}<br /><small className="text-muted">{c.forma_pagamento}</small></span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      {canWrite() && c.status !== 'PAGO' && c.status !== 'CANCELADO' && (
                        acordosMap[c.id]
                          ? (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => navigate('/acordos', { state: { acordoId: acordosMap[c.id] } })}
                              title="Esta cobrança possui um acordo ativo — pague por lá"
                            >
                              🤝 Ir ao Acordo
                            </button>
                          ) : (
                            <button className="btn btn-success btn-sm" onClick={() => openPagar(c)} title="Registrar pagamento">
                              💰 Pagar
                            </button>
                          )
                      )}
                      {canWrite() && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)} title="Excluir">🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nova Cobrança */}
      {showCreate && (
        <Modal title="Nova Cobrança" onClose={() => setShowCreate(false)}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleCreate} className="modal-form">
            <div className="form-group">
              <label>Unidade *</label>
              <select className="form-control" required value={form.unidade_id}
                onChange={e => setForm(p => ({ ...p, unidade_id: e.target.value }))}>
                <option value="">Selecione a unidade...</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.numero}{u.bloco ? ` - Bloco ${u.bloco}` : ''} — {u.responsavel} ({u.condominio_nome})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Competência *</label>
                <input type="date" className="form-control" required value={form.competencia}
                  onChange={e => setForm(p => ({ ...p, competencia: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Vencimento *</label>
                <input type="date" className="form-control" required value={form.data_vencimento}
                  onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Valor (R$) *</label>
                <input type="number" step="0.01" min="0" className="form-control" required value={form.valor}
                  onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} placeholder="850.00" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="PENDENTE">Pendente</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Observação</label>
              <textarea className="form-control" rows={2} value={form.observacao}
                onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} placeholder="Opcional..." />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Cobrança'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Registrar Pagamento */}
      {showPagar && selected && (
        <Modal title="Registrar Pagamento" onClose={() => setShowPagar(false)}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <div className="pagar-info">
            <p><strong>Unidade:</strong> {selected.unidade_info}</p>
            <p><strong>Competência:</strong> {fmtDate(selected.competencia)}</p>
            <p><strong>Vencimento:</strong> {fmtDate(selected.data_vencimento)}</p>
            <p><strong>Valor original:</strong> {fmt(selected.valor)}</p>
            {(parseFloat(selected.multa) + parseFloat(selected.juros)) > 0 && (
              <p className="td-red"><strong>Multa + Juros acumulados:</strong> {fmt(parseFloat(selected.multa) + parseFloat(selected.juros))}</p>
            )}
          </div>
          <form onSubmit={handlePagar} className="modal-form">
            <div className="form-group">
              <label>Data do Pagamento *</label>
              <input type="date" className="form-control" required value={pagarForm.data_pagamento}
                onChange={e => setPagarForm(p => ({ ...p, data_pagamento: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Forma de Pagamento *</label>
              <select className="form-control" value={pagarForm.forma_pagamento}
                onChange={e => setPagarForm(p => ({ ...p, forma_pagamento: e.target.value }))}>
                <option value="PIX">Pix</option>
                <option value="BOLETO">Boleto</option>
                <option value="CARTAO">Cartão</option>
                <option value="TRANSFERENCIA">Transferência</option>
                <option value="DINHEIRO">Dinheiro</option>
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowPagar(false)}>Cancelar</button>
              <button type="submit" className="btn btn-success" disabled={saving}>
                {saving ? 'Registrando...' : '✅ Confirmar Pagamento'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
