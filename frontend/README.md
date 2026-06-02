# 🏢 CondoSys — Frontend

Interface web do sistema de gestão condominial, desenvolvida com **React + Vite**.

---

## ⚙️ Pré-requisitos

- Node.js 18+
- npm 9+
- Backend Django rodando em `http://127.0.0.1:8000`

---

## 🚀 Como rodar

```bash
# Instalar dependências
npm install

# Iniciar em desenvolvimento (proxy automático para o backend)
npm run dev
```

Acesse: **http://localhost:5173**

> O `vite.config.js` já configura proxy para `/api` apontando para `http://127.0.0.1:8000`, então não é necessário configurar CORS manualmente para desenvolvimento.

---

## 🔑 Login

Na tela de login há atalhos de preenchimento automático para os 3 perfis:

| Usuário | Senha | Permissões |
|---|---|---|
| `superadmin` | `superadmin123` | Escrita total + `/admin/` Django |
| `admin` | `admin123` | Escrita total na API |
| `user` | `user123` | Somente leitura |

---

## 📁 Estrutura

```
src/
├── api/
│   └── api.js              # Funções de chamada para todos os endpoints
├── context/
│   └── AuthContext.jsx     # Autenticação JWT com refresh automático
├── components/
│   ├── Navbar/             # Barra superior com título e data
│   ├── Sidebar/            # Menu lateral com navegação e logout
│   ├── Modal/              # Modal reutilizável
│   └── StatusBadge/        # Badge colorido por status
├── pages/
│   ├── Login/              # Tela de login com hero e chips de atalho
│   ├── Dashboard/          # Resumo financeiro + gráficos de status
│   ├── Condominios/        # CRUD de condomínios (grid de cards)
│   ├── Unidades/           # CRUD + filtros + resumo financeiro por unidade
│   ├── Cobrancas/          # CRUD + filtros + fluxo de pagamento (PUT)
│   ├── Acordos/            # Criar acordos, listar parcelas geradas
│   └── Inadimplencia/      # Resumo por condomínio + tabela de vencidas
├── App.jsx                 # Rotas protegidas + AppShell (Sidebar + Navbar)
└── index.css               # Variáveis CSS globais, utilitários, tabela, forms
```

---

## 🔐 Proteção de rotas

- Rotas privadas redirecionam para `/login` sem token
- Token JWT armazenado em `localStorage`
- Refresh automático ao receber 401 — se falhar, redireciona para login
- Logout limpa token e redireciona

---

## 🗂️ Endpoints consumidos

| Página | Endpoints |
|---|---|
| Dashboard | `GET /api/dashboard/`, `GET /api/inadimplencia/resumo/` |
| Condomínios | `GET/POST /api/condominios/`, `PUT/DELETE /api/condominios/{id}/` |
| Unidades | `GET/POST /api/unidades/`, `PUT/DELETE /api/unidades/{id}/`, `GET /api/unidades/{id}/resumo-financeiro/` |
| Cobranças | `GET/POST /api/cobrancas/`, `PUT/DELETE /api/cobrancas/{id}/` |
| Acordos | `GET/POST /api/acordos/`, `DELETE /api/acordos/{id}/` |
| Inadimplência | `GET /api/inadimplencia/resumo/`, `GET /api/cobrancas/?status=VENCIDO` |

> Nenhum endpoint usa `PATCH` — atualizações usam `PUT` com o objeto completo.
