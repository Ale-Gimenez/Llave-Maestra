# CondoGest — Frontend React

Interface web para o sistema de gestão condominial (MVP), consumindo a API Django REST Framework.

## Pré-requisitos
- Node.js 18+
- Backend Django rodando em `http://localhost:8000`

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variável de ambiente
cp .env.example .env
# Edite .env se o backend estiver em outra porta/host

# 3. Iniciar
npm start
# Abre em http://localhost:3000
```

## Telas disponíveis

| Rota             | Tela                          |
|------------------|-------------------------------|
| `/login`         | Login com JWT                 |
| `/dashboard`     | Visão geral financeira        |
| `/condominios`   | CRUD de condomínios           |
| `/unidades`      | CRUD de unidades              |
| `/cobrancas`     | CRUD + filtros de cobranças   |
| `/acordos`       | Acordos + parcelas            |
| `/inadimplencia` | Relatório de inadimplência    |

## Endpoints consumidos

- `POST /api/token/` — login JWT
- `GET  /api/dashboard/` — resumo financeiro
- `GET  /api/inadimplencia/resumo/` — inadimplência por condomínio
- CRUD: `/api/condominios/`, `/api/unidades/`, `/api/cobrancas/`, `/api/acordos/`, `/api/parcelas-acordo/`

## Estrutura

```
src/
  context/      # AuthContext, ToastContext
  services/     # api.js (axios)
  components/   # Layout, PrivateRoute
  pages/        # uma página por rota
  styles/       # CSS separado por módulo
```
