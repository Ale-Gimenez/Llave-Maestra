const BASE_URL = '/api'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    const refreshed = await tryRefreshToken()
    if (refreshed) return request(path, options)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
    return
  }
  if (!res.ok) {
    let errData
    try { errData = await res.json() } catch { errData = { detail: res.statusText } }
    const err = new Error(JSON.stringify(errData))
    err.data = errData
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

async function tryRefreshToken() {
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) return false
  try {
    const res = await fetch(`${BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem('access_token', data.access)
    return true
  } catch { return false }
}

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Credenciais inválidas')
  }
  return res.json()
}

export const getDashboard       = () => request('/dashboard/')
export const getInadimplencia   = () => request('/inadimplencia/resumo/')
export const getCondominios     = () => request('/condominios/')
export const getCondominio      = (id) => request(`/condominios/${id}/`)
export const createCondominio   = (data) => request('/condominios/', { method: 'POST', body: JSON.stringify(data) })
export const updateCondominio   = (id, data) => request(`/condominios/${id}/`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCondominio   = (id) => request(`/condominios/${id}/`, { method: 'DELETE' })
export const getUnidades        = (params = '') => request(`/unidades/${params}`)
export const getUnidade         = (id) => request(`/unidades/${id}/`)
export const getResumoFinanceiro= (id) => request(`/unidades/${id}/resumo-financeiro/`)
export const createUnidade      = (data) => request('/unidades/', { method: 'POST', body: JSON.stringify(data) })
export const updateUnidade      = (id, data) => request(`/unidades/${id}/`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteUnidade      = (id) => request(`/unidades/${id}/`, { method: 'DELETE' })
export const getCobrancas       = (params = '') => request(`/cobrancas/${params}`)
export const getCobranca        = (id) => request(`/cobrancas/${id}/`)
export const createCobranca     = (data) => request('/cobrancas/', { method: 'POST', body: JSON.stringify(data) })
export const updateCobranca     = (id, data) => request(`/cobrancas/${id}/`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCobranca     = (id) => request(`/cobrancas/${id}/`, { method: 'DELETE' })
export const getAcordos         = (params = '') => request(`/acordos/${params}`)
export const getAcordo          = (id) => request(`/acordos/${id}/`)
export const createAcordo       = (data) => request('/acordos/', { method: 'POST', body: JSON.stringify(data) })
export const deleteAcordo       = (id) => request(`/acordos/${id}/`, { method: 'DELETE' })
export const getParcelas        = (params = '') => request(`/parcelas-acordo/${params}`)
export const updateParcela      = (id, data) => request(`/parcelas-acordo/${id}/`, { method: 'PUT', body: JSON.stringify(data) })
