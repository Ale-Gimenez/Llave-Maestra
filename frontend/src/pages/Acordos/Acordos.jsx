import { useState, useEffect } from 'react'
import { getAcordos, getUnidades, getCobrancas, createAcordo, deleteAcordo } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal/Modal'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import './Acordos.css'

function fmt(n) { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtDate(d) { if (!d) return '—'; const [y,m,dia] = d.split('-'); return `${dia}/${m}/${y}` }

export default function Acordos() {
  const { canWrite } = useAuth()
  const [list, setList] = useState([])
  const [unidades, setUnidades] = useState([])
  const [cobrancasDisp, setCobrancasDisp] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterUnidade, setFilterUnidade] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ unidade_id: '', cobrancas_ids: [], quantidade_parcelas: 2, data_primeiro_vencimento: '', observacao: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  function buildParams() {
    return filterUnidade ? `?unidade=${filterUnidade}` : ''
  }

  const load = () => {
    Promise.all([getAcordos(buildParams()), getUnidades()])
      .then(([a, u]) => { setList(a); setUnidades(u) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filterUnidade])

  async function onUnidadeChange(uid) {
    setForm(p => ({ ...p, unidade_id: uid, cobrancas_ids: [] }))
    if (!uid) { setCobrancasDisp([]); return }
    try {
      const [cobs, pend] = await Promise.all([
        getCobrancas(`?unidade=${uid}&status=VENCIDO`),
        getCobrancas(`?unidade=${uid}&status=PENDENTE`),
      ])
      setCobrancasDisp([...cobs, ...pend])
    } catch { setCobrancasDisp([]) }
  }

  function toggleCob(id) {
    setForm(p => ({
      ...p,
      cobrancas_ids: p.cobrancas_ids.includes(id)
        ? p.cobrancas_ids.filter(x => x !== id)
        : [...p.cobrancas_ids, id]
    }))
  }

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true); setFormError('')
    try {
      await createAcordo(form)
      setShowCreate(false)
      setForm({ unidade_id: '', cobrancas_ids: [], quantidade_parcelas: 2, data_primeiro_vencimento: '', observacao: '' })
      load()
    } catch (err) {
      const d = err.data || {}
      setFormError(Object.values(d).flat().join(' | ') || 'Erro ao criar acordo')
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este acordo?')) return
    try { await deleteAcordo(id); load() }
    catch { alert('Não foi possível excluir.') }
  }

  function openDetail(a) { setSelected(a); setShowDetail(true) }

  // Valor total das cobranças selecionadas
  const valorSelecionado = cobrancasDisp
    .filter(c => form.cobrancas_ids.includes(c.id))
    .reduce((s, c) => s + parseFloat(c.valor_total || c.valor), 0)

  if (loading) return <div className="center-spinner"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="section-title">Acordos de Parcelamento</h2>
          <p className="section-sub">{list.length} acordo{list.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite() && (
          <button className="btn btn-primary" onClick={() => { setFormError(''); setCobrancasDisp([]); setForm({ unidade_id: '', cobrancas_ids: [], quantidade_parcelas: 2, data_primeiro_vencimento: '', observacao: '' }); setShowCreate(true) }}>
            + Novo Acordo
          </button>
        )}
      </div>

      {/* Filtro por unidade */}
      <div className="card filter-bar">
        <select className="form-control filter-select" value={filterUnidade}
          onChange={e => setFilterUnidade(e.target.value)}>
          <option value="">Todas as unidades</option>
          {unidades.map(u => (
            <option key={u.id} value={u.id}>
              {u.numero}{u.bloco ? ` - Bloco ${u.bloco}` : ''} ({u.condominio_nome}) — {u.responsavel}
            </option>
          ))}
        </select>
        {filterUnidade && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilterUnidade('')}>✕ Limpar</button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="empty-state card"><div className="icon">🤝</div><p>Nenhum acordo encontrado.</p></div>
      ) : (
        <div className="acordos-grid">
          {list.map(a => (
            <div key={a.id} className="acordo-card card">
              <div className="acordo-header">
                <div>
                  <span className="acordo-id">Acordo #{a.id}</span>
                  <h3 className="acordo-unidade">{a.unidade_info}</h3>
                </div>
                <span className="acordo-valor">{fmt(a.valor_total)}</span>
              </div>
              <div className="acordo-meta">
                <span>📅 Criado em {fmtDate(a.criado_em?.slice(0,10))}</span>
                <span>🔢 {a.quantidade_parcelas}x de {fmt(a.valor_total / a.quantidade_parcelas)}</span>
                <span>📋 {a.parcelas?.length || 0} parcela{(a.parcelas?.length || 0) !== 1 ? 's' : ''} gerada{(a.parcelas?.length || 0) !== 1 ? 's' : ''}</span>
              </div>
              {a.observacao && <p className="acordo-obs">{a.observacao}</p>}
              <div className="acordo-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openDetail(a)}>📋 Ver parcelas</button>
                {canWrite() && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>🗑 Excluir</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar acordo */}
      {showCreate && (
        <Modal title="Novo Acordo de Parcelamento" onClose={() => setShowCreate(false)}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleCreate} className="modal-form">
            <div className="form-group">
              <label>Unidade *</label>
              <select className="form-control" required value={form.unidade_id}
                onChange={e => onUnidadeChange(e.target.value)}>
                <option value="">Selecione a unidade...</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.numero}{u.bloco ? ` - Bloco ${u.bloco}` : ''} ({u.condominio_nome}) — {u.responsavel}
                  </option>
                ))}
              </select>
            </div>

            {form.unidade_id && (
              <div className="form-group">
                <label>Cobranças vencidas/pendentes *</label>
                {cobrancasDisp.length === 0 ? (
                  <div className="alert alert-info">Nenhuma cobrança vencida ou pendente para esta unidade.</div>
                ) : (
                  <div className="cobrancas-check-list">
                    {cobrancasDisp.map(c => (
                      <label key={c.id} className={`cob-check-item ${form.cobrancas_ids.includes(c.id) ? 'selected' : ''}`}>
                        <input type="checkbox" checked={form.cobrancas_ids.includes(c.id)}
                          onChange={() => toggleCob(c.id)} />
                        <div className="cob-check-info">
                          <span>Competência {fmtDate(c.competencia)} — Vence {fmtDate(c.data_vencimento)}</span>
                          <strong>{fmt(c.valor_total || c.valor)}</strong>
                          <StatusBadge status={c.status} />
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {form.cobrancas_ids.length > 0 && (
                  <div className="cob-total">
                    Total selecionado: <strong>{fmt(valorSelecionado)}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Nº de Parcelas *</label>
                <input type="number" min="1" max="60" className="form-control" required
                  value={form.quantidade_parcelas}
                  onChange={e => setForm(p => ({ ...p, quantidade_parcelas: parseInt(e.target.value) || 1 }))} />
                {form.cobrancas_ids.length > 0 && form.quantidade_parcelas > 0 && (
                  <small className="form-hint">≈ {fmt(valorSelecionado / form.quantidade_parcelas)}/parcela</small>
                )}
              </div>
              <div className="form-group">
                <label>1ª Data de Vencimento *</label>
                <input type="date" className="form-control" required value={form.data_primeiro_vencimento}
                  onChange={e => setForm(p => ({ ...p, data_primeiro_vencimento: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label>Observação</label>
              <textarea className="form-control" rows={2} value={form.observacao}
                onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} placeholder="Opcional..." />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving || form.cobrancas_ids.length === 0}>
                {saving ? 'Criando...' : 'Criar Acordo'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal detalhes do acordo */}
      {showDetail && selected && (
        <Modal title={`Acordo #${selected.id} — Parcelas`} onClose={() => setShowDetail(false)}>
          <div className="detail-header">
            <p><strong>Unidade:</strong> {selected.unidade_info}</p>
            <p><strong>Valor Total:</strong> {fmt(selected.valor_total)}</p>
            <p><strong>Parcelas:</strong> {selected.quantidade_parcelas}x</p>
          </div>
          {selected.parcelas?.length > 0 ? (
            <table className="parcelas-table">
              <thead>
                <tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Pagamento</th></tr>
              </thead>
              <tbody>
                {selected.parcelas.map(p => (
                  <tr key={p.id}>
                    <td>{p.numero_parcela}/{selected.quantidade_parcelas}</td>
                    <td>{fmtDate(p.data_vencimento)}</td>
                    <td>{fmt(p.valor)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>{p.data_pagamento ? fmtDate(p.data_pagamento) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">Nenhuma parcela encontrada.</p>
          )}
        </Modal>
      )}
    </div>
  )
}
