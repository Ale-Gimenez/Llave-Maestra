import { useState, useEffect } from 'react'
import { getAcordos, getUnidades, getCobrancas, createAcordo, deleteAcordo } from '../../api/api'
import Modal from '../../components/Modal/Modal'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import './Acordos.css'

function fmt(n) { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtDate(d) { if (!d) return '—'; const [y,m,dia] = d.split('-'); return `${dia}/${m}/${y}` }

export default function Acordos() {
  const [list, setList] = useState([])
  const [unidades, setUnidades] = useState([])
  const [cobrancasDisp, setCobrancasDisp] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ unidade_id: '', cobrancas_ids: [], quantidade_parcelas: 2, data_primeiro_vencimento: '', observacao: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = () => {
    Promise.all([getAcordos(), getUnidades()])
      .then(([a, u]) => { setList(a); setUnidades(u) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function onUnidadeChange(uid) {
    setForm(p => ({ ...p, unidade_id: uid, cobrancas_ids: [] }))
    if (!uid) { setCobrancasDisp([]); return }
    try {
      const cobs = await getCobrancas(`?unidade=${uid}&status=VENCIDO`)
      const pend = await getCobrancas(`?unidade=${uid}&status=PENDENTE`)
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
      setShowCreate(false); setForm({ unidade_id: '', cobrancas_ids: [], quantidade_parcelas: 2, data_primeiro_vencimento: '', observacao: '' })
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

  if (loading) return <div className="center-spinner"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="section-title">Acordos de Parcelamento</h2>
          <p className="section-sub">{list.length} acordo{list.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setFormError(''); setShowCreate(true) }}>
          + Novo Acordo
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty-state card"><div className="icon">🤝</div><p>Nenhum acordo cadastrado.</p></div>
      ) : (
        <div className="acordos-grid">
          {list.map(a => (
            <div key={a.id} className="acordo-card card">
              <div className="ac-header">
                <span className="ac-id">Acordo #{a.id}</span>
                <span className="ac-parcelas">{a.quantidade_parcelas}x</span>
              </div>
              <div className="ac-body">
                <div className="ac-row"><span>Unidade</span><strong>{a.unidade_info}</strong></div>
                <div className="ac-row"><span>Valor total</span><strong className="ac-valor">{fmt(a.valor_total)}</strong></div>
                <div className="ac-row"><span>1º vencimento</span><strong>{fmtDate(a.data_primeiro_vencimento)}</strong></div>
                <div className="ac-row"><span>Criado em</span><strong>{fmtDate(a.criado_em?.slice(0,10))}</strong></div>
              </div>
              {a.observacao && <p className="ac-obs">"{a.observacao}"</p>}
              <div className="ac-footer">
                <button className="btn btn-ghost btn-sm" onClick={() => openDetail(a)}>📋 Ver Parcelas</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar */}
      {showCreate && (
        <Modal title="Novo Acordo de Parcelamento" onClose={() => setShowCreate(false)} width={560}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleCreate} className="modal-form">
            <div className="form-group">
              <label>Unidade *</label>
              <select className="form-control" required value={form.unidade_id}
                onChange={e => onUnidadeChange(e.target.value)}>
                <option value="">Selecione uma unidade...</option>
                {unidades.map(u => <option key={u.id} value={u.id}>#{u.id} — {u.numero} · {u.condominio_nome} ({u.responsavel})</option>)}
              </select>
            </div>

            {cobrancasDisp.length > 0 && (
              <div className="form-group">
                <label>Cobranças a incluir *</label>
                <div className="cob-list">
                  {cobrancasDisp.map(c => (
                    <label key={c.id} className={`cob-item ${form.cobrancas_ids.includes(c.id) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={form.cobrancas_ids.includes(c.id)} onChange={() => toggleCob(c.id)} />
                      <div className="cob-item-info">
                        <span>Ref. {fmtDate(c.competencia)} · Venc. {fmtDate(c.data_vencimento)}</span>
                        <strong>{fmt(c.valor)}</strong>
                        <StatusBadge status={c.status} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {form.unidade_id && cobrancasDisp.length === 0 && (
              <p className="no-cob">Nenhuma cobrança vencida/pendente nesta unidade.</p>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Nº de Parcelas *</label>
                <input type="number" min="1" max="60" className="form-control" required value={form.quantidade_parcelas}
                  onChange={e => setForm(p => ({ ...p, quantidade_parcelas: parseInt(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>1º Vencimento *</label>
                <input type="date" className="form-control" required value={form.data_primeiro_vencimento}
                  onChange={e => setForm(p => ({ ...p, data_primeiro_vencimento: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Observação</label>
              <input className="form-control" value={form.observacao}
                onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} placeholder="Opcional" />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving || !form.cobrancas_ids.length}>
                {saving ? 'Criando...' : '✅ Criar Acordo'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Detalhe */}
      {showDetail && selected && (
        <Modal title={`Parcelas — Acordo #${selected.id}`} onClose={() => setShowDetail(false)} width={540}>
          <div className="parcelas-wrap">
            <div className="par-summary">
              <span>{selected.unidade_info}</span>
              <span>{selected.quantidade_parcelas}x · {fmt(selected.valor_total)}</span>
            </div>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {selected.parcelas?.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.numero_parcela}ª</strong></td>
                      <td>{fmtDate(p.data_vencimento)}</td>
                      <td>{fmt(p.valor)}</td>
                      <td><StatusBadge status={p.status || 'PENDENTE'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
