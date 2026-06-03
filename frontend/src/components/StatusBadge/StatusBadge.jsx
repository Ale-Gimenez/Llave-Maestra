import './StatusBadge.css'

const config = {
  PAGO:      { label: 'Pago',         cls: 'badge-green'  },
  PENDENTE:  { label: 'Pendente',     cls: 'badge-yellow' },
  VENCIDO:   { label: 'Vencido',      cls: 'badge-red'    },
  CANCELADO: { label: 'Cancelado',    cls: 'badge-gray'   },
  OCUPADO:   { label: 'Ocupado',      cls: 'badge-blue'   },
  VAGO:      { label: 'Vago',         cls: 'badge-gray'   },
  QUITADA:   { label: 'Quitada',      cls: 'badge-green'  },
  ATIVO:     { label: 'Sim',          cls: 'badge-green'  },
  INATIVO:   { label: 'Não',          cls: 'badge-gray'   },
}

export default function StatusBadge({ status }) {
  const c = config[status] || { label: status || '—', cls: 'badge-gray' }
  return <span className={`badge ${c.cls}`}>{c.label}</span>
}
