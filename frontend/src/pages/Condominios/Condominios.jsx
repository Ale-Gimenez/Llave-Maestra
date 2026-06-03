import { useState, useEffect } from 'react'
import { getCondominios, createCondominio, updateCondominio, deleteCondominio } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal/Modal'
import './Condominios.css'

const EMPTY = { nome: '', cnpj: '', endereco: '' }

export default function Condominios() {
  const { canWrite } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = () => getCondominios()
    .then(setList)
    .catch(() => setError('Erro ao carregar condomínios'))
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  function openCreate() { setEditing(null); setForm(EMPTY); setFormError(''); setShowModal(true) }
  function openEdit(c) { setEditing(c); setForm({ nome: c.nome, cnpj: c.cnpj || '', endereco: c.endereco || '' }); setFormError(''); setShowModal(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      if (editing) await updateCondominio(editing.id, form)
      else await createCondominio(form)
      setShowModal(false); load()
    } catch (err) {
      const d = err.data || {}
      setFormError(Object.values(d).flat().join(' | ') || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este condomínio?')) return
    try { await deleteCondominio(id); load() }
    catch { alert('Não foi possível excluir. Verifique se há unidades vinculadas.') }
  }

  if (loading) return <div className="center-spinner"><div className="spinner" /></div>

  return (
    <div className="page-condominios">
      <div className="page-header">
        <div>
          <h2 className="section-title">Condomínios cadastrados</h2>
          <p className="section-sub">{list.length} empreendimento{list.length !== 1 ? 's' : ''}</p>
        </div>
        {canWrite() && (
          <button className="btn btn-primary" onClick={openCreate}>+ Novo Condomínio</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {list.length === 0 ? (
        <div className="empty-state card"><div className="icon">🏢</div><p>Nenhum condomínio cadastrado ainda.</p></div>
      ) : (
        <div className="cond-grid">
          {list.map(c => (
            <div key={c.id} className="cond-card card">
              <div className="cond-card-header">
                <div className="cond-avatar">{c.nome[0]}</div>
                <div className="cond-info">
                  <h3>{c.nome}</h3>
                  {c.cnpj && <span className="cond-cnpj">{c.cnpj}</span>}
                </div>
              </div>
              <div className="cond-meta">
                {c.endereco && <p>📍 {c.endereco}</p>}
                <p>🚪 <strong>{c.total_unidades}</strong> unidade{c.total_unidades !== 1 ? 's' : ''}</p>
              </div>
              {canWrite() && (
                <div className="cond-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏️ Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑 Excluir</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Editar Condomínio' : 'Novo Condomínio'} onClose={() => setShowModal(false)}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Nome *</label>
              <input className="form-control" required value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Residencial Primavera" />
            </div>
            <div className="form-group">
              <label>CNPJ</label>
              <input className="form-control" value={form.cnpj}
                onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
            </div>
            <div className="form-group">
              <label>Endereço</label>
              <input className="form-control" value={form.endereco}
                onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua das Flores, 100" />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Criar Condomínio'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
