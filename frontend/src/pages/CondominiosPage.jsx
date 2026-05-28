import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  getCondominios, createCondominio, updateCondominio, deleteCondominio
} from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/components.css';

const EMPTY = { nome: '', cnpj: '', endereco: '' };

export default function CondominiosPage() {
  const { addToast } = useToast();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);   // null = new
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await getCondominios();
      setItems(Array.isArray(data) ? data : (data.results || []));
    } catch { addToast('Erro ao carregar condomínios', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew()    { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(c)  { setEditing(c);    setForm({ nome: c.nome, cnpj: c.cnpj || '', endereco: c.endereco || '' }); setModal(true); }
  function closeModal() { setModal(false); }

  async function handleSave() {
    if (!form.nome.trim()) { addToast('Nome é obrigatório', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateCondominio(editing.id, form);
        addToast('Condomínio atualizado!');
      } else {
        await createCondominio(form);
        addToast('Condomínio criado!');
      }
      closeModal();
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'Erro ao salvar', 'error');
    } finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Excluir "${item.nome}"?`)) return;
    try {
      await deleteCondominio(item.id);
      addToast('Condomínio excluído');
      load();
    } catch { addToast('Erro ao excluir', 'error'); }
  }

  const filtered = items.filter((i) =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    (i.cnpj || '').includes(search)
  );

  return (
    <Layout title="Condomínios" subtitle="Cadastro e gestão de empreendimentos">
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>Condomínios <span style={{ color: 'var(--gray-400)', fontWeight: 400, fontSize: 13 }}>({filtered.length})</span></h2>
          <div className="data-table-header__actions">
            <button className="btn btn--primary" onClick={openNew}>
              + Novo Condomínio
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-input-wrap">
            <SearchIcon />
            <input
              className="search-input"
              placeholder="Buscar por nome ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <BuildingIcon size={48} />
            <p>Nenhum condomínio encontrado</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Endereço</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.nome}</td>
                  <td>{c.cnpj || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                  <td>{c.endereco || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                  <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="data-table__actions">
                      <button className="icon-btn" onClick={() => openEdit(c)} title="Editar">
                        <EditIcon />
                      </button>
                      <button className="icon-btn icon-btn--danger" onClick={() => handleDelete(c)} title="Excluir">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal__header">
              <h2>{editing ? 'Editar Condomínio' : 'Novo Condomínio'}</h2>
              <button className="modal__close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-grid form-grid--1col">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-input" value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Residencial Primavera" />
                </div>
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input className="form-input" value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input className="form-input" value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, cidade" />
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar condomínio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

/* icons */
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
function BuildingIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10"/><path d="M9 7h1"/><path d="M14 7h1"/></svg>;
}
