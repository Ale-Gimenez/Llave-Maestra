import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getCobrancas, getCondominios, getUnidades } from '../services/api';
import '../styles/components.css';

function fmt(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function InadimplenciaPage() {
  const [items,       setItems]       = useState([]);
  const [unidades,    setUnidades]    = useState([]);
  const [condominios, setCondominios] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filterCond,  setFilterCond]  = useState('');
  const [filterUnid,  setFilterUnid]  = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = { status: 'VENCIDO' };
      if (filterCond) params.condominio = filterCond;
      if (filterUnid) params.unidade    = filterUnid;
      const [c, u, cond] = await Promise.all([
        getCobrancas(params), getUnidades(), getCondominios()
      ]);
      setItems(Array.isArray(c.data) ? c.data : (c.data.results || []));
      setUnidades(Array.isArray(u.data) ? u.data : (u.data.results || []));
      setCondominios(Array.isArray(cond.data) ? cond.data : (cond.data.results || []));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filterCond, filterUnid]);

  const unidadeLabel = (id) => {
    const u = unidades.find((u) => u.id === id);
    if (!u) return `Unidade ${id}`;
    return `Unid. ${u.numero}${u.bloco ? ` / Bl. ${u.bloco}` : ''} — ${u.responsavel}`;
  };

  const totalVencido = items.reduce((s, i) =>
    s + parseFloat(i.valor) + parseFloat(i.multa || 0) + parseFloat(i.juros || 0), 0);

  const filtUnidades = filterCond
    ? unidades.filter((u) => String(u.condominio) === String(filterCond))
    : unidades;

  return (
    <Layout title="Inadimplência" subtitle="Cobranças vencidas e não pagas">
      {/* SUMMARY CARDS */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card stat-card--orange">
          <div className="stat-card__label">Total em Atraso</div>
          <div className="stat-card__value">{fmt(totalVencido)}</div>
          <div className="stat-card__sub">{items.length} cobranças vencidas</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Unidades inadimplentes</div>
          <div className="stat-card__value">{new Set(items.map((i) => i.unidade)).size}</div>
          <div className="stat-card__sub">unidades com débitos</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Média por cobrança</div>
          <div className="stat-card__value">{fmt(items.length ? totalVencido / items.length : 0)}</div>
          <div className="stat-card__sub">valor médio em atraso</div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>
            Cobranças Vencidas
            <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 13, marginLeft: 8 }}>
              {items.length} registros
            </span>
          </h2>
        </div>

        <div className="filter-bar">
          <select className="filter-select" value={filterCond} onChange={(e) => { setFilterCond(e.target.value); setFilterUnid(''); }}>
            <option value="">Todos os condomínios</option>
            {condominios.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select className="filter-select" value={filterUnid} onChange={(e) => setFilterUnid(e.target.value)}>
            <option value="">Todas as unidades</option>
            {filtUnidades.map((u) => (
              <option key={u.id} value={u.id}>
                Unid. {u.numero}{u.bloco ? ` / Bl. ${u.bloco}` : ''} — {u.responsavel}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 16 }}>🎉 Nenhuma inadimplência encontrada!</p>
            <p>Todos os pagamentos estão em dia para os filtros selecionados.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Unidade</th>
                <th>Competência</th>
                <th>Vencimento</th>
                <th>Valor Original</th>
                <th>Multa</th>
                <th>Juros</th>
                <th>Total com encargos</th>
                <th>Dias atraso</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const hoje = new Date();
                const venc = new Date(c.data_vencimento + 'T00:00:00');
                const dias = Math.max(0, Math.floor((hoje - venc) / 86400000));
                const total = parseFloat(c.valor) + parseFloat(c.multa || 0) + parseFloat(c.juros || 0);
                return (
                  <tr key={c.id}>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{c.id}</td>
                    <td style={{ fontSize: 12 }}>{unidadeLabel(c.unidade)}</td>
                    <td style={{ fontSize: 12 }}>{c.competencia?.slice(0, 7)}</td>
                    <td style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                      {venc.toLocaleDateString('pt-BR')}
                    </td>
                    <td>{fmt(c.valor)}</td>
                    <td style={{ color: 'var(--danger)', fontSize: 12 }}>{fmt(c.multa)}</td>
                    <td style={{ color: 'var(--danger)', fontSize: 12 }}>{fmt(c.juros)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(total)}</td>
                    <td>
                      <span style={{
                        background: 'var(--danger-light)', color: 'var(--danger)',
                        padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700
                      }}>
                        {dias}d
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
