const BASE = '/api'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 204) return null

  let data
  try { data = await res.json() } catch { data = null }

  if (!res.ok) {
    const err = new Error(data?.detail || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

// Auth
export async function login(username, password) {
  const res = await fetch(`${BASE}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, data }
  return data
}

// Condominios
export const getCondominios  = (params = '')     => request(`/condominios/${params}`)
export const createCondominio = (body)            => request('/condominios/', { method: 'POST', body: JSON.stringify(body) })
export const updateCondominio = (id, body)        => request(`/condominios/${id}/`, { method: 'PUT', body: JSON.stringify(body) })
export const patchCondominio  = (id, body)        => request(`/condominios/${id}/`, { method: 'PATCH', body: JSON.stringify(body) })
export const deleteCondominio = (id)              => request(`/condominios/${id}/`, { method: 'DELETE' })

// Unidades
export const getUnidades     = (params = '')      => request(`/unidades/${params}`)
export const createUnidade   = (body)             => request('/unidades/', { method: 'POST', body: JSON.stringify(body) })
export const updateUnidade   = (id, body)         => request(`/unidades/${id}/`, { method: 'PUT', body: JSON.stringify(body) })
export const patchUnidade    = (id, body)         => request(`/unidades/${id}/`, { method: 'PATCH', body: JSON.stringify(body) })
export const deleteUnidade   = (id)               => request(`/unidades/${id}/`, { method: 'DELETE' })
export const getResumoFinanceiro = (id)           => request(`/unidades/${id}/resumo-financeiro/`)

// Cobranças
export const getCobrancas    = (params = '')      => request(`/cobrancas/${params}`)
export const createCobranca  = (body)             => request('/cobrancas/', { method: 'POST', body: JSON.stringify(body) })
export const updateCobranca  = (id, body)         => request(`/cobrancas/${id}/`, { method: 'PUT', body: JSON.stringify(body) })
export const patchCobranca   = (id, body)         => request(`/cobrancas/${id}/`, { method: 'PATCH', body: JSON.stringify(body) })
export const deleteCobranca  = (id)               => request(`/cobrancas/${id}/`, { method: 'DELETE' })

// Acordos
export const getAcordos      = (params = '')      => request(`/acordos/${params}`)
export const createAcordo    = (body)             => request('/acordos/', { method: 'POST', body: JSON.stringify(body) })
export const updateAcordo    = (id, body)         => request(`/acordos/${id}/`, { method: 'PUT', body: JSON.stringify(body) })
export const deleteAcordo    = (id)               => request(`/acordos/${id}/`, { method: 'DELETE' })

// Parcelas
export const getParcelas     = (params = '')      => request(`/parcelas-acordo/${params}`)
export const patchParcela    = (id, body)         => request(`/parcelas-acordo/${id}/`, { method: 'PATCH', body: JSON.stringify(body) })

// Dashboard e Inadimplência
export const getDashboard    = ()                 => request('/dashboard/')
export const getInadimplencia = ()                => request('/inadimplencia/resumo/')

// Me
export const getMe           = ()                 => request('/me/')
