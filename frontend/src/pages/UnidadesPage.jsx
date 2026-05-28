import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  getUnidades, createUnidade, updateUnidade, deleteUnidade, getCondominios
} from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/components.css';

const EMPTY = { condominio: '', numero: '', bloco: '', responsavel: '', status: 'OCUPADO' };

export default function UnidadesPage() {
  const { addToast } = useToast();
  const [items,        setItems]        = useState([]);
  const [condominios,  setCondominios]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCond,   setFilterCond]   = useState('');
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCond)   params.condominio = filterCond;
      const [u, c] = await Promise.all([getUnidades(params), getCondominios()]);
      setItems(Array.isArray(u.data) ? u.data : (u.data.results || []));
      setCondominios(Array.isArray(c.data) ? c.data : (c.data.results || []));
    } catch { addToast('Erro ao carregar unidades', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filterStatus, filterCond]);

  function openNew()   { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(u) { setEditing(u); setForm({ condominio: u.condominio, numero: u.numero, bloco: u.bloco || '', responsavel: u.responsavel, status: u.status }); setModal(true); }
  function close()     { setModal(false); }

  async function handleSave() {
    if (!form.condominio || !form.numero || !form.responsavel) { addToast('Preencha campos obrigatórios', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, bloco: form.bloco || null };
      if (editing) { await updateUnidade(editing.id, payload); addToast('Unidade atualizada!'); }
      else         { await createUnidade(payload);              addToast('Unidade criada!'); }
      close(); load();
    } catch (e) { addToast(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Erro ao salvar', 'error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Excluir unidade ${item.numero}?`)) return;
    try { await deleteUnidade(item.id); addToast('Unidade excluída'); load(); }
    catch { addToast('Erro ao excluir', 'error'); }
  }

  const condNome = (id) => condominios.find((c) => c.id === id)?.nome || id;

  const filtered = items.filter((i) =>
    i.responsavel?.toLowerCase().includes(search.toLowerCase()) ||
    i.numero?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Unidades" subtitle="Apartamentos e casas vinculados a cada condomínio">
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>Unidades <span style={{ color: 'var(--gray-400)', fontWeight: 400, fontSize: 13 }}>({filtered.length})</span></h2>
          <div className="data-table-header__actions">
            <button className="btn btn--primary" onClick={openNew}>+ Nova Unidade</button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-input-wrap">
            <SearchIcon />
            <input className="search-input" placeholder="Buscar responsável ou número..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filterCond} onChange={(e) => setFilterCond(e.target.value)}>
            <option value="">Todos os condomínios</option>
            {condominios.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="OCUPADO">Ocupado</option>
            <option value="VAGO">Vago</option>
          </select>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>Nenhuma unidade encontrada</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Condomínio</th>
                <th>Unidade</th>
                <th>Responsável</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{u.id}</td>
                  <td style={{ fontSize: 13 }}>{condNome(u.condominio)}</td>
                  <td style={{ fontWeight: 600 }}>
                    {u.bloco ? `Bloco ${u.bloco} — ` : ''}{u.numero}
                  </td>
                  <td>{u.responsavel}</td>
                  <td>
                    <span className={`badge badge--${u.status.toLowerCase()}`}>{u.status}</span>
                  </td>
                  <td>
                    <div className="data-table__actions">
                      <button className="icon-btn" onClick={() => openEdit(u)}><EditIcon /></button>
                      <button className="icon-btn icon-btn--danger" onClick={() => handleDelete(u)}><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal__header">
              <h2>{editing ? 'Editar Unidade' : 'Nova Unidade'}</h2>
              <button className="modal__close" onClick={close}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-grid">
                <div className="form-group form-group--span2">
                  <label className="form-label">Condomínio *</label>
                  <select className="form-select" value={form.condominio}
                    onChange={(e) => setForm({ ...form, condominio: e.target.value })}>
                    <option value="">Selecione...</option>
                    {condominios.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Número *</label>
                  <input className="form-input" value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    placeholder="101" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bloco</label>
                  <input className="form-input" value={form.bloco}
                    onChange={(e) => setForm({ ...form, bloco: e.target.value })}
                    placeholder="A (opcional)" />
                </div>
                <div className="form-group form-group--span2">
                  <label className="form-label">Responsável *</label>
                  <input className="form-input" value={form.responsavel}
                    onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                    placeholder="Nome do morador/proprietário" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="OCUPADO">Ocupado</option>
                    <option value="VAGO">Vago</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={close}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar unidade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
