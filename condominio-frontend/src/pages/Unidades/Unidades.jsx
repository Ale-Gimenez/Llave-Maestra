import { useState, useEffect } from 'react'
import { getUnidades, getCondominios, createUnidade, updateUnidade, deleteUnidade, getResumoFinanceiro } from '../../api/api'
import Modal from '../../components/Modal/Modal'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import './Unidades.css'

const EMPTY = { condominio_id: '', numero: '', bloco: '', responsavel: '', status: 'OCUPADO' }

function fmt(n) { return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

export default function Unidades() {
  const [list, setList] = useState([])
  const [condominios, setCondominios] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ condominio: '', status: '' })
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [resumo, setResumo] = useState(null)
  const [showResumo, setShowResumo] = useState(false)

  function buildParams() {
    const p = []
    if (filter.condominio) p.push(`condominio=${filter.condominio}`)
    if (filter.status) p.push(`status=${filter.status}`)
    return p.length ? `?${p.join('&')}` : ''
  }

  const load = () => {
    Promise.all([getUnidades(buildParams()), getCondominios()])
      .then(([u, c]) => { setList(u); setCondominios(c) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  function openCreate() { setEditing(null); setForm(EMPTY); setFormError(''); setShowModal(true) }
  function openEdit(u) {
    setEditing(u)
    setForm({ condominio_id: u.condominio_id, numero: u.numero, bloco: u.bloco || '', responsavel: u.responsavel, status: u.status })
    setFormError(''); setShowModal(true)
  }

  async function verResumo(id) {
    const r = await getResumoFinanceiro(id)
    setResumo(r); setShowResumo(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      const payload = { ...form }
      if (!payload.bloco) delete payload.bloco
      if (editing) await updateUnidade(editing.id, payload)
      else await createUnidade(payload)
      setShowModal(false); load()
    } catch (err) {
      const d = err.data || {}
      setFormError(Object.values(d).flat().join(' | ') || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta unidade?')) return
    try { await deleteUnidade(id); load() }
    catch { alert('Não foi possível excluir. Pode haver cobranças vinculadas.') }
  }

  if (loading) return <div className="center-spinner"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="section-title">Unidades</h2>
          <p className="section-sub">{list.length} unidade{list.length !== 1 ? 's' : ''} encontrada{list.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nova Unidade</button>
      </div>

      {/* Filtros */}
      <div className="card filter-bar">
        <select className="form-control filter-select" value={filter.condominio}
          onChange={e => setFilter(p => ({ ...p, condominio: e.target.value }))}>
          <option value="">Todos os condomínios</option>
          {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select className="form-control filter-select" value={filter.status}
          onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
          <option value="">Todos os status</option>
          <option value="OCUPADO">Ocupado</option>
          <option value="VAGO">Vago</option>
        </select>
      </div>

      {list.length === 0 ? (
        <div className="empty-state card"><div className="icon">🚪</div><p>Nenhuma unidade encontrada.</p></div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Unidade</th>
                <th>Condomínio</th>
                <th>Responsável</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id}>
                  <td><span className="id-chip">{u.id}</span></td>
                  <td>
                    <strong>{u.numero}</strong>
                    {u.bloco && <span className="bloco-tag"> · Bloco {u.bloco}</span>}
                  </td>
                  <td>{u.condominio_nome}</td>
                  <td>{u.responsavel}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => verResumo(u.id)} title="Resumo financeiro">📊</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <Modal title={editing ? 'Editar Unidade' : 'Nova Unidade'} onClose={() => setShowModal(false)}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Condomínio *</label>
              <select className="form-control" required value={form.condominio_id}
                onChange={e => setForm(p => ({ ...p, condominio_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Número *</label>
                <input className="form-control" required value={form.numero}
                  onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} placeholder="101" />
              </div>
              <div className="form-group">
                <label>Bloco</label>
                <input className="form-control" value={form.bloco}
                  onChange={e => setForm(p => ({ ...p, bloco: e.target.value }))} placeholder="A" />
              </div>
            </div>
            <div className="form-group">
              <label>Responsável *</label>
              <input className="form-control" required value={form.responsavel}
                onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} placeholder="Nome do morador" />
            </div>
            <div className="form-group">
              <label>Status *</label>
              <select className="form-control" value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="OCUPADO">Ocupado</option>
                <option value="VAGO">Vago</option>
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Resumo Financeiro */}
      {showResumo && resumo && (
        <Modal title="Resumo Financeiro da Unidade" onClose={() => setShowResumo(false)} width={460}>
          <div className="resumo-grid">
            <div className="resumo-header">
              <span className="resumo-nome">{resumo.responsavel}</span>
              <span className="resumo-id">Unidade #{resumo.unidade}</span>
            </div>
            <div className="resumo-stats">
              <div className="rs-item"><span>Total cobranças</span><strong>{resumo.total_cobrancas}</strong></div>
              <div className="rs-item green"><span>Pagas</span><strong>{resumo.total_pagas}</strong></div>
              <div className="rs-item yellow"><span>Pendentes</span><strong>{resumo.total_pendentes}</strong></div>
              <div className="rs-item red"><span>Vencidas</span><strong>{resumo.total_vencidas}</strong></div>
            </div>
            <div className="resumo-valor">
              <span>Valor em aberto</span>
              <strong className="valor-aberto">{fmt(resumo.valor_em_aberto)}</strong>
            </div>
            <div className="resumo-acordo">
              Possui acordo ativo: <StatusBadge status={resumo.possui_acordo ? 'ATIVO' : 'VAGO'} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
