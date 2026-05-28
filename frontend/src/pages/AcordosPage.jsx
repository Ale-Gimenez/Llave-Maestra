import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  getAcordos, createAcordo, deleteAcordo,
  getUnidades, getCobrancas
} from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/components.css';

const EMPTY = {
  unidade: '', quantidade_parcelas: 2,
  data_primeiro_vencimento: '', observacao: '', cobrancas: []
};

function fmt(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AcordosPage() {
  const { addToast } = useToast();
  const [items,     setItems]     = useState([]);
  const [unidades,  setUnidades]  = useState([]);
  const [vencidas,  setVencidas]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [expanded,  setExpanded]  = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [a, u] = await Promise.all([getAcordos(), getUnidades()]);
      setItems(Array.isArray(a.data) ? a.data : (a.data.results || []));
      setUnidades(Array.isArray(u.data) ? u.data : (u.data.results || []));
    } catch { addToast('Erro ao carregar acordos', 'error'); }
    finally { setLoading(false); }
  }

  async function loadVencidas(unidadeId) {
    if (!unidadeId) { setVencidas([]); return; }
    try {
      const { data } = await getCobrancas({ unidade: unidadeId, status: 'VENCIDO' });
      setVencidas(Array.isArray(data) ? data : (data.results || []));
    } catch { setVencidas([]); }
  }

  useEffect(() => { load(); }, []);

  function openNew()  { setForm(EMPTY); setVencidas([]); setModal(true); }
  function close()    { setModal(false); }

  function handleUnidadeChange(id) {
    setForm((f) => ({ ...f, unidade: id, cobrancas: [] }));
    loadVencidas(id);
  }

  function toggleCobranca(id) {
    setForm((f) => ({
      ...f,
      cobrancas: f.cobrancas.includes(id)
        ? f.cobrancas.filter((x) => x !== id)
        : [...f.cobrancas, id]
    }));
  }

  async function handleSave() {
    if (!form.unidade || !form.data_primeiro_vencimento || form.cobrancas.length === 0) {
      addToast('Selecione unidade, cobranças vencidas e a data da 1ª parcela', 'error'); return;
    }
    setSaving(true);
    try {
      await createAcordo({
        unidade: Number(form.unidade),
        quantidade_parcelas: Number(form.quantidade_parcelas),
        data_primeiro_vencimento: form.data_primeiro_vencimento,
        observacao: form.observacao,
        cobrancas: form.cobrancas,
      });
      addToast('Acordo criado com parcelas!');
      close(); load();
    } catch (e) {
      addToast(JSON.stringify(e.response?.data) || 'Erro ao criar acordo', 'error');
    } finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!window.confirm('Excluir este acordo?')) return;
    try { await deleteAcordo(item.id); addToast('Acordo excluído'); load(); }
    catch { addToast('Erro ao excluir', 'error'); }
  }

  const unidadeLabel = (id) => {
    const u = unidades.find((u) => u.id === id);
    if (!u) return `Unidade ${id}`;
    return `Unid. ${u.numero}${u.bloco ? ` / Bl. ${u.bloco}` : ''} — ${u.responsavel}`;
  };

  return (
    <Layout title="Acordos" subtitle="Parcelamento de cobranças vencidas">
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>Acordos de Parcelamento <span style={{ color: 'var(--gray-400)', fontWeight: 400, fontSize: 13 }}>({items.length})</span></h2>
          <button className="btn btn--primary" onClick={openNew}>+ Novo Acordo</button>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>Nenhum acordo registrado</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Unidade</th>
                <th>Parcelas</th>
                <th>Valor Total</th>
                <th>1º Venc.</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <React.Fragment key={a.id}>
                  <tr
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                  >
                    <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{a.id}</td>
                    <td style={{ fontSize: 12 }}>{unidadeLabel(a.unidade)}</td>
                    <td style={{ fontWeight: 600 }}>{a.quantidade_parcelas}×</td>
                    <td style={{ fontWeight: 600, color: 'var(--orange)' }}>{fmt(a.valor_total)}</td>
                    <td style={{ fontSize: 12 }}>
                      {new Date(a.data_primeiro_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                      {new Date(a.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div className="data-table__actions">
                        <button className="btn btn--ghost btn--sm"
                          onClick={(e) => { e.stopPropagation(); setExpanded(expanded === a.id ? null : a.id); }}>
                          {expanded === a.id ? '▲ Ocultar' : '▼ Parcelas'}
                        </button>
                        <button className="icon-btn icon-btn--danger"
                          onClick={(e) => { e.stopPropagation(); handleDelete(a); }}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === a.id && a.parcelas && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0, background: 'var(--gray-50)' }}>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'var(--orange-light)' }}>
                              <th style={{ padding: '8px 20px', textAlign: 'left', color: 'var(--orange)', fontWeight: 600 }}>Parcela</th>
                              <th style={{ padding: '8px 20px', textAlign: 'left' }}>Valor</th>
                              <th style={{ padding: '8px 20px', textAlign: 'left' }}>Vencimento</th>
                              <th style={{ padding: '8px 20px', textAlign: 'left' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {a.parcelas.map((p) => (
                              <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                <td style={{ padding: '8px 20px', fontWeight: 600 }}>{p.numero_parcela}/{a.quantidade_parcelas}</td>
                                <td style={{ padding: '8px 20px' }}>{fmt(p.valor)}</td>
                                <td style={{ padding: '8px 20px' }}>
                                  {new Date(p.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </td>
                                <td style={{ padding: '8px 20px' }}>
                                  <span className={`badge badge--${p.status.toLowerCase()}`}>{p.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
              <h2>Novo Acordo de Parcelamento</h2>
              <button className="modal__close" onClick={close}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-grid form-grid--1col">
                <div className="form-group">
                  <label className="form-label">Unidade *</label>
                  <select className="form-select" value={form.unidade}
                    onChange={(e) => handleUnidadeChange(e.target.value)}>
                    <option value="">Selecione a unidade...</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        Unid. {u.numero}{u.bloco ? ` / Bl. ${u.bloco}` : ''} — {u.responsavel}
                      </option>
                    ))}
                  </select>
                </div>

                {form.unidade && (
                  <div className="form-group">
                    <label className="form-label">Cobranças Vencidas *</label>
                    {vencidas.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--gray-400)', padding: '8px 0' }}>
                        Nenhuma cobrança vencida para esta unidade.
                      </p>
                    ) : (
                      <div style={{ border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        {vencidas.map((c) => (
                          <label key={c.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-100)',
                            background: form.cobrancas.includes(c.id) ? 'var(--orange-light)' : 'white',
                            fontSize: 13
                          }}>
                            <input type="checkbox"
                              checked={form.cobrancas.includes(c.id)}
                              onChange={() => toggleCobranca(c.id)} />
                            <span>
                              Competência {c.competencia?.slice(0, 7)} — Venc. {new Date(c.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                            <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--danger)' }}>
                              {fmt(parseFloat(c.valor) + parseFloat(c.multa || 0) + parseFloat(c.juros || 0))}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Quantidade de Parcelas *</label>
                  <input type="number" min="1" max="60" className="form-input" value={form.quantidade_parcelas}
                    onChange={(e) => setForm((f) => ({ ...f, quantidade_parcelas: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data do 1º Vencimento *</label>
                  <input type="date" className="form-input" value={form.data_primeiro_vencimento}
                    onChange={(e) => setForm((f) => ({ ...f, data_primeiro_vencimento: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Observação</label>
                  <textarea className="form-textarea" value={form.observacao}
                    onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                    placeholder="Opcional..." />
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={close}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Criando...' : 'Criar acordo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
