import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getDashboard, getInadimplenciaResumo } from '../services/api';
import '../styles/components.css';
import '../styles/dashboard.css';

function fmt(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DashboardPage() {
  const [data,    setData]    = useState(null);
  const [inadimp, setInadimp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getInadimplenciaResumo()])
      .then(([dash, inad]) => {
        setData(dash.data);
        setInadimp(inad.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Visão geral do sistema">
        <div className="spinner-wrap"><div className="spinner" /></div>
      </Layout>
    );
  }

  const total = (data?.total_pagas || 0) + (data?.total_pendentes || 0) + (data?.total_vencidas || 0) || 1;

  return (
    <Layout title="Dashboard" subtitle="Visão geral do sistema">
      <div className="dashboard-page">

        {/* STAT CARDS */}
        <div className="stat-grid">
          <div className="stat-card stat-card--orange">
            <div className="stat-card__icon">
              <CashIcon />
            </div>
            <div className="stat-card__label">Recebido</div>
            <div className="stat-card__value">{fmt(data?.valor_total_recebido)}</div>
            <div className="stat-card__sub">{data?.total_pagas || 0} cobranças pagas</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon">
              <AlertCircleIcon />
            </div>
            <div className="stat-card__label">Em Aberto</div>
            <div className="stat-card__value">{fmt(data?.valor_total_em_aberto)}</div>
            <div className="stat-card__sub">{(data?.total_pendentes || 0) + (data?.total_vencidas || 0)} cobranças</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon">
              <BuildingIcon />
            </div>
            <div className="stat-card__label">Condomínios</div>
            <div className="stat-card__value">{data?.total_condominios || 0}</div>
            <div className="stat-card__sub">{data?.total_unidades || 0} unidades</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon">
              <HandshakeIcon />
            </div>
            <div className="stat-card__label">Acordos</div>
            <div className="stat-card__value">{data?.total_acordos || 0}</div>
            <div className="stat-card__sub">parcelamentos ativos</div>
          </div>
        </div>

        {/* CHARTS + INADIMPLÊNCIA */}
        <div className="dashboard__grid">

          {/* Status das cobranças */}
          <div className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Status das Cobranças</h3>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{data?.total_cobrancas || 0} total</span>
            </div>
            <div className="dashboard__card-body">
              <div className="bar-chart">
                {[
                  { label: 'Pagas',     value: data?.total_pagas     || 0, cls: 'success' },
                  { label: 'Pendentes', value: data?.total_pendentes  || 0, cls: 'warning' },
                  { label: 'Vencidas',  value: data?.total_vencidas   || 0, cls: 'danger'  },
                ].map((item) => (
                  <div className="bar-chart__item" key={item.label}>
                    <div className="bar-chart__label">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="bar-chart__track">
                      <div
                        className={`bar-chart__fill bar-chart__fill--${item.cls}`}
                        style={{ width: `${Math.round((item.value / total) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inadimplência por condomínio */}
          <div className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Inadimplência por Condomínio</h3>
              <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                {inadimp.length} afetados
              </span>
            </div>
            <div className="dashboard__card-body">
              {inadimp.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhuma inadimplência registrada 🎉</p>
                </div>
              ) : (
                inadimp.map((item) => (
                  <div className="inadimplencia-row" key={item.condominio}>
                    <span className="inadimplencia-row__name">{item.condominio}</span>
                    <span className="inadimplencia-row__count">{item.qtd_cobrancas_vencidas} venc.</span>
                    <span className="inadimplencia-row__value">{fmt(item.valor_total_vencido)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

/* Icons */
function CashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  );
}
function AlertCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 22V12h6v10"/>
      <path d="M9 7h1"/><path d="M14 7h1"/>
    </svg>
  );
}
function HandshakeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
    </svg>
  );
}
