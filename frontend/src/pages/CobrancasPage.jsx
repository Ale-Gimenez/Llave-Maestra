import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  getCobrancas, createCobranca, updateCobranca, deleteCobranca,
  getUnidades, getCondominios
} from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/components.css';

const EMPTY = {
  unidade: '', competencia: '', data_vencimento: '',
  valor: '', status: 'PENDENTE', data_pagamento: '',
  forma_pagamento: '', observacao: ''
};

function fmt(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CobrancasPage() {
  const { addToast } = useToast();
  const [items,      setItems]      = useState([]);
  const [unidades,   setUnidades]   = useState([]);
  const [condominios,setCondominios]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCond,   setFilterCond]   = useState('');
  const [filterUnidade,setFilterUnidade]= useState('');
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus)   params.status    = filterStatus;
      if (filterUnidade)  params.unidade   = filterUnidade;
      if (filterCond)     params.condominio = filterCond;
      const [c, u, cond] = await Promise.all([
        getCobrancas(params), getUnidades(), getCondominios()
      ]);
      setItems(Array.isArray(c.data) ? c.data : (c.data.results || []));
      setUnidades(Array.isArray(u.data) ? u.data : (u.data.results || []));
      setCondominios(Array.isArray(cond.data) ? cond.data : (cond.data.results || []));
    } catch { addToast('Erro ao carregar cobranças', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filterStatus, filterCond, filterUnidade]);

  function openNew()   { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(c) {
    setEditing(c);
    setForm({
      unidade:        c.unidade,
      competencia:    c.competencia,
      data_vencimento:c.data_vencimento,
      valor:          c.valor,
      status:         c.status,
      data_pagamento: c.data_pagamento || '',
      forma_pagamento:c.forma_pagamento || '',
      observacao:     c.observacao || ''
    });
    setModal(true);
  }
  function close() { setModal(false); }

  function handleFormChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.unidade || !form.competencia || !form.data_vencimento || !form.valor) {
      addToast('Preencha os campos obrigatórios', 'error'); return;
    }
    if (form.status === 'PAGO' && !form.data_pagamento) {
      addToast('Data de pagamento obrigatória quando status = PAGO', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        valor: parseFloat(form.valor),
        data_pagamento: form.data_pagamento || null,
        forma_pagamento: form.forma_pagamento || null,
        observacao: form.observacao || '',
      };
      if (editing) { await updateCobranca(editing.id, payload); addToast('Cobrança atualizada!'); }
      else         { await createCobranca(payload);              addToast('Cobrança criada!'); }
      close(); load();
    } catch (e) {
      const msg = e.response?.data;
      addToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    } finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!window.confirm('Excluir esta cobrança?')) return;
    try { await deleteCobranca(item.id); addToast('Cobrança excluída'); load(); }
    catch { addToast('Erro ao excluir', 'error'); }
  }

  const unidadeLabel = (id) => {
    const u = unidades.find((u) => u.id === id);
    if (!u) return id;
    return `Unid. ${u.numero}${u.bloco ? ` / Bl. ${u.bloco}` : ''} — ${u.responsavel}`;
  };

  const filteredUnidades = filterCond
    ? unidades.filter((u) => String(u.condominio) === String(filterCond))
    : unidades;

  return (
    <Layout title="Cobranças" subtitle="Emissão e controle de receitas condominiais">
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>Cobranças <span style={{ color: 'var(--gray-400)', fontWeight: 400, fontSize: 13 }}>({items.length})</span></h2>
          <div className="data-table-header__actions">
            <button className="btn btn--primary" onClick={openNew}>+ Nova Cobrança</button>
          </div>
        </div>

        <div className="filter-bar">
          <select className="filter-select" value={filterCond} onChange={(e) => { setFilterCond(e.target.value); setFilterUnidade(''); }}>
            <option value="">Todos os condomínios</option>
            {condominios.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select className="filter-select" value={filterUnidade} onChange={(e) => setFilterUnidade(e.target.value)}>
            <option value="">Todas as unidades</option>
            {filteredUnidades.map((u) => (
              <option key={u.id} value={u.id}>
                Unid. {u.numero}{u.bloco ? ` / Bl. ${u.bloco}` : ''} — {u.responsavel}
              </option>
            ))}
          </select>
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="VENCIDO">Vencido</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>Nenhuma cobrança encontrada</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Unidade</th>
                <th>Competência</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Multa+Juros</th>
                <th>Status</th>
                <th>Pgto.</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{c.id}</td>
                  <td style={{ fontSize: 12 }}>{unidadeLabel(c.unidade)}</td>
                  <td style={{ fontSize: 12 }}>{c.competencia?.slice(0, 7)}</td>
                  <td style={{ fontSize: 12 }}>
                    {new Date(c.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: 600 }}>{fmt(c.valor)}</td>
                  <td style={{ fontSize: 12, color: 'var(--danger)' }}>
                    {(parseFloat(c.multa || 0) + parseFloat(c.juros || 0)) > 0
                      ? fmt(parseFloat(c.multa) + parseFloat(c.juros))
                      : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                  </td>
                  <td>
                    <span className={`badge badge--${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {c.data_pagamento
                      ? new Date(c.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td>
                    <div className="data-table__actions">
                      <button className="icon-btn" onClick={() => openEdit(c)}><EditIcon /></button>
                      <button className="icon-btn icon-btn--danger" onClick={() => handleDelete(c)}><TrashIcon /></button>
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
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal__header">
              <h2>{editing ? 'Editar Cobrança' : 'Nova Cobrança'}</h2>
              <button className="modal__close" onClick={close}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-grid">
                <div className="form-group form-group--span2">
                  <label className="form-label">Unidade *</label>
                  <select className="form-select" value={form.unidade}
                    onChange={(e) => handleFormChange('unidade', e.target.value)}>
                    <option value="">Selecione...</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        Unid. {u.numero}{u.bloco ? ` / Bl. ${u.bloco}` : ''} — {u.responsavel}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Competência *</label>
                  <input type="date" className="form-input" value={form.competencia}
                    onChange={(e) => handleFormChange('competencia', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vencimento *</label>
                  <input type="date" className="form-input" value={form.data_vencimento}
                    onChange={(e) => handleFormChange('data_vencimento', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor (R$) *</label>
                  <input type="number" step="0.01" className="form-input" value={form.valor}
                    onChange={(e) => handleFormChange('valor', e.target.value)}
                    placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}>
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago</option>
                    <option value="VENCIDO">Vencido</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
                {form.status === 'PAGO' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Data Pagamento *</label>
                      <input type="date" className="form-input" value={form.data_pagamento}
                        onChange={(e) => handleFormChange('data_pagamento', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Forma de Pagamento</label>
                      <select className="form-select" value={form.forma_pagamento}
                        onChange={(e) => handleFormChange('forma_pagamento', e.target.value)}>
                        <option value="">Selecione...</option>
                        <option value="BOLETO">Boleto</option>
                        <option value="PIX">Pix</option>
                        <option value="CARTAO">Cartão</option>
                        <option value="TRANSFERENCIA">Transferência</option>
                        <option value="DINHEIRO">Dinheiro</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="form-group form-group--span2">
                  <label className="form-label">Observação</label>
                  <textarea className="form-textarea" value={form.observacao}
                    onChange={(e) => handleFormChange('observacao', e.target.value)}
                    placeholder="Opcional..." />
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={close}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar cobrança'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
