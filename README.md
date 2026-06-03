# 🏢 Llave Maestra — Sistema de Cobranças e Inadimplência Condominial

Aplicação web fullstack para gestão de condomínios, cobranças, inadimplência e acordos de parcelamento.

**Backend:** Django 6 + Django REST Framework + JWT  
**Frontend:** React 18 + Vite + CSS puro  
**Banco:** MySQL (produção) / SQLite (configurável)

---

## Como rodar o projeto

### Pré-requisitos

- Python 3.10+
- Node.js 18+
- Git

---

### Backend

```bash
cd backend

# 1. Criar e ativar ambiente virtual
python -m venv env
source env/bin/activate       # Linux/Mac
env\Scripts\activate          # Windows

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Aplicar migrações
python manage.py migrate

# 4. Popular banco com dados de exemplo
python manage.py seed

# 5. Iniciar servidor
python manage.py runserver
```

O backend estará disponível em: `http://localhost:8000`

---

### Frontend

```bash
cd frontend

# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

> O Vite já está configurado com proxy para `/api` → `http://localhost:8000`, então não é necessário configurar CORS manualmente no browser.

---

## Usuários de teste

| Usuário      | Senha          | Permissão                          |
|--------------|----------------|------------------------------------|
| superadmin   | superadmin123  | Superusuário (acesso total + /admin/) |
| admin        | admin123       | Staff (escrita na API + /admin/)   |
| user         | user123        | Somente leitura                    |

> Acesse o painel admin Django em: `http://localhost:8000/admin/`

---

## Endpoints da API

### Autenticação JWT

| Método | Endpoint          | Descrição                        |
|--------|-------------------|----------------------------------|
| POST   | /api/token/       | Obter token de acesso            |
| POST   | /api/token/refresh/ | Renovar token                  |
| GET    | /api/me/          | Dados do usuário autenticado     |

**Exemplo de login:**
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Usar token nas requisições:**
```bash
curl http://localhost:8000/api/condominios/ \
  -H "Authorization: Bearer <seu_token>"
```

---

### Endpoints CRUD

| Recurso              | Endpoint                    |
|----------------------|-----------------------------|
| Condomínios          | /api/condominios/           |
| Unidades             | /api/unidades/              |
| Cobranças            | /api/cobrancas/             |
| Acordos              | /api/acordos/               |
| Parcelas de Acordo   | /api/parcelas-acordo/       |

Todos suportam: `GET` (lista), `POST` (criar), `GET /{id}/` (detalhe), `PUT /{id}/` (editar), `PATCH /{id}/` (editar parcial), `DELETE /{id}/` (excluir).

---

### Filtros disponíveis

```bash
# Cobranças por unidade
GET /api/cobrancas/?unidade=1

# Cobranças por status
GET /api/cobrancas/?status=VENCIDO

# Cobranças por condomínio + status (inadimplência)
GET /api/cobrancas/?condominio=1&status=VENCIDO

# Cobranças por competência
GET /api/cobrancas/?competencia=2026-05-01

# Unidades por condomínio
GET /api/unidades/?condominio=1

# Unidades por status
GET /api/unidades/?status=OCUPADO

# Acordos por unidade
GET /api/acordos/?unidade=3
```

---

### Endpoints inteligentes

#### Dashboard financeiro
```
GET /api/dashboard/
```
Retorna totais gerais: condomínios, unidades, cobranças por status, valores recebidos e em aberto, acordos.

#### Inadimplência por condomínio
```
GET /api/inadimplencia/resumo/
```
Retorna lista de condomínios com cobranças vencidas, quantidade e valor total inadimplente.

#### Resumo financeiro de uma unidade
```
GET /api/unidades/{id}/resumo-financeiro/
```
Retorna totais de cobranças, valor em aberto e se possui acordo ativo.

---

## Regras de negócio implementadas

- **Multa:** 2% sobre o valor original, aplicada após o vencimento
- **Juros:** 0,033% ao dia de atraso sobre o valor original
- **data_pagamento obrigatória** quando `status = PAGO`
- **Cobranças vencidas:** atualizadas automaticamente de `PENDENTE` para `VENCIDO` na listagem
- **Acordos:** somente cobranças da mesma unidade; parcelas geradas automaticamente com vencimentos mensais
- **Níveis de acesso:** Admin (staff) pode criar/editar/excluir; usuário comum só visualiza

---

## Diagrama de Relacionamento (DER simplificado)

```
Condominio (1) ──< Unidade (1) ──< Cobranca
                       │
                       └──< Acordo >──< Cobranca (N:N)
                                └──< ParcelaAcordo
```

- **Condominio → Unidade:** 1:N (um condomínio tem muitas unidades)
- **Unidade → Cobranca:** 1:N (uma unidade tem muitas cobranças)
- **Unidade → Acordo:** 1:N (uma unidade pode ter vários acordos)
- **Acordo → ParcelaAcordo:** 1:N (um acordo tem várias parcelas)
- **Acordo ↔ Cobranca:** N:N (um acordo pode incluir várias cobranças)

---

## Requisitos Funcionais

- Cadastro de condomínios (nome, CNPJ opcional, endereço)
- Cadastro de unidades (número, bloco, responsável, status OCUPADO/VAGO)
- Emissão de cobranças mensais com competência, vencimento, valor e status
- Registro de pagamento com forma (Boleto, Pix, Cartão, Transferência, Dinheiro)
- Cálculo automático de multa e juros para pagamentos em atraso
- Consulta de inadimplência filtrada por condomínio, unidade e período
- Criação de acordos de parcelamento com geração automática de parcelas
- Dashboard financeiro consolidado
- Autenticação JWT com níveis de acesso Admin/User

## Requisitos Não Funcionais

- API REST com Django REST Framework e DefaultRouter
- Autenticação via JWT (SimpleJWT)
- Filtros via DjangoFilterBackend
- Proteção de endpoints (IsAdminOrReadOnly)
- Frontend com proteção de rotas (PrivateRoute)
- Token armazenado em localStorage
- Proxy Vite para comunicação frontend ↔ backend em desenvolvimento
- Código organizado em apps, serializers, views, filters e permissions separados

---

## Arquivo SQL

O arquivo `backend/condominio_backup.sql` contém o dump completo do banco SQLite com dados de exemplo, configure no `backend/config/settings.py` (seção comentada) e rode `python manage.py migrate`.

Para MySQL, arquivo `settings.py` já configurado.
