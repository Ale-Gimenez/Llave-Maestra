# 🏢 Sistema de Controle de Cobranças Condominiais

API REST desenvolvida com **Django + Django REST Framework** para gerenciar condomínios, unidades, cobranças, inadimplência e acordos de parcelamento.

---

## ⚙️ Como rodar o projeto

### 1. Pré-requisitos
- Python 3.10+
- pip
- MySQL 8.0+ (ou MariaDB)

### 2. Crie e ative o ambiente virtual
```bash
python -m venv venv
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Configure o banco de dados
Crie o banco no MySQL:
```sql
CREATE DATABASE condominio CHARACTER SET utf8mb4;
```

Edite `config/settings.py` e preencha as credenciais:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'condominio',
        'USER': 'root',
        'PASSWORD': 'sua_senha',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

> Para usar SQLite durante desenvolvimento, comente o bloco MySQL e descomente o bloco SQLite no mesmo arquivo.

### 5. Aplique as migrações
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Popule com dados de exemplo
```bash
python manage.py seed
```

Isso cria **3 usuários**, 3 condomínios, 9 unidades, cobranças variadas e 1 acordo de exemplo:

| Usuário      | Senha          | Perfil                                     |
|--------------|----------------|--------------------------------------------|
| `superadmin` | `superadmin123` | Superusuário supremo (`superuser + staff + active`) — acesso total à API e ao painel `/admin/` |
| `admin`      | `admin123`      | Administrador (`staff + active`) — escrita na API e acesso ao `/admin/` com permissões |
| `user`       | `user123`       | Usuário normal (`active`) — somente leitura na API |

### 7. Rode o servidor
```bash
python manage.py runserver
```
API disponível em: http://127.0.0.1:8000/api/  
Painel admin: http://127.0.0.1:8000/admin/

---

## 🔑 Autenticação JWT

### Obter token
```
POST /api/token/
Content-Type: application/json

{"username": "admin", "password": "admin123"}
```
Resposta:
```json
{"access": "eyJ...", "refresh": "eyJ..."}
```

### Usar o token nas requisições
```
Authorization: Bearer eyJ...
```

### Renovar token
```
POST /api/token/refresh/
{"refresh": "eyJ..."}
```

---

## 🔐 Níveis de acesso

| Perfil        | GET (leitura) | POST / PUT / DELETE (escrita) | Painel `/admin/` |
|---------------|:---:|:---:|:---:|
| Não autenticado | ❌ | ❌ | ❌ |
| `user` (active) | ✅ | ❌ | ❌ |
| `admin` (staff) | ✅ | ✅ | ✅ (permissões restritas) |
| `superadmin` (superuser+staff) | ✅ | ✅ | ✅ (acesso total) |

> **Regra aplicada:** `IsAdminOrReadOnly` — usuários autenticados sem `is_staff` podem apenas visualizar (GET). Criação, edição e exclusão exigem `is_staff=True` ou `is_superuser=True`.

> **Nota sobre PATCH:** A API **não expõe o método PATCH**. Para atualizar um recurso, utilize sempre **PUT** com o corpo completo do objeto.

---

## 📌 Endpoints

### Condomínios — `/api/condominios/`

| Método | URL | Autenticação | Descrição |
|--------|-----|:---:|-----------|
| GET | /api/condominios/ | qualquer autenticado | Listar todos |
| POST | /api/condominios/ | staff/superuser | Criar |
| GET | /api/condominios/{id}/ | qualquer autenticado | Detalhe |
| PUT | /api/condominios/{id}/ | staff/superuser | Atualizar completo |
| DELETE | /api/condominios/{id}/ | staff/superuser | Excluir |

**POST /api/condominios/**
```json
{"nome": "Residencial Aurora", "cnpj": "11.222.333/0001-44", "endereco": "Rua X, 10"}
```

---

### Unidades — `/api/unidades/`

| Método | URL | Autenticação | Descrição |
|--------|-----|:---:|-----------|
| GET | /api/unidades/ | qualquer autenticado | Listar (filtrável) |
| POST | /api/unidades/ | staff/superuser | Criar |
| GET | /api/unidades/{id}/ | qualquer autenticado | Detalhe |
| PUT | /api/unidades/{id}/ | staff/superuser | Atualizar completo |
| DELETE | /api/unidades/{id}/ | staff/superuser | Excluir |
| GET | /api/unidades/{id}/resumo-financeiro/ | qualquer autenticado | Resumo financeiro da unidade |

**POST /api/unidades/**
```json
{"condominio_id": 1, "numero": "301", "bloco": "C", "responsavel": "João Silva", "status": "OCUPADO"}
```

**Filtros disponíveis:**
- `/api/unidades/?condominio=1`
- `/api/unidades/?status=VAGO`

---

### Cobranças — `/api/cobrancas/`

| Método | URL | Autenticação | Descrição |
|--------|-----|:---:|-----------|
| GET | /api/cobrancas/ | qualquer autenticado | Listar (filtrável) |
| POST | /api/cobrancas/ | staff/superuser | Criar |
| GET | /api/cobrancas/{id}/ | qualquer autenticado | Detalhe |
| PUT | /api/cobrancas/{id}/ | staff/superuser | Atualizar completo (ex: registrar pagamento) |
| DELETE | /api/cobrancas/{id}/ | staff/superuser | Excluir |

**POST /api/cobrancas/**
```json
{
  "unidade_id": 1,
  "competencia": "2026-05-01",
  "data_vencimento": "2026-05-10",
  "valor": "850.00",
  "status": "PENDENTE"
}
```

**PUT - Registrar pagamento (enviar todos os campos obrigatórios):**
```json
{
  "unidade_id": 1,
  "competencia": "2026-05-01",
  "data_vencimento": "2026-05-10",
  "valor": "850.00",
  "status": "PAGO",
  "data_pagamento": "2026-05-20",
  "forma_pagamento": "PIX"
}
```
> Se `data_pagamento > data_vencimento`, multa (2%) e juros (0,033%/dia) são calculados automaticamente.

**Filtros:**
- `/api/cobrancas/?unidade=1`
- `/api/cobrancas/?status=VENCIDO`
- `/api/cobrancas/?competencia=2026-05-01`
- `/api/cobrancas/?status=VENCIDO&condominio=1`
- `/api/cobrancas/?vencimento_de=2026-01-01&vencimento_ate=2026-12-31`
- `/api/cobrancas/?competencia_mes=5&competencia_ano=2026`

---

### Acordos — `/api/acordos/`

| Método | URL | Autenticação | Descrição |
|--------|-----|:---:|-----------|
| GET | /api/acordos/ | qualquer autenticado | Listar |
| POST | /api/acordos/ | staff/superuser | Criar (gera parcelas automaticamente) |
| GET | /api/acordos/{id}/ | qualquer autenticado | Detalhe com parcelas |
| PUT | /api/acordos/{id}/ | staff/superuser | Atualizar completo |
| DELETE | /api/acordos/{id}/ | staff/superuser | Excluir |

**POST /api/acordos/**
```json
{
  "unidade_id": 1,
  "cobrancas_ids": [1, 2],
  "quantidade_parcelas": 3,
  "data_primeiro_vencimento": "2026-06-10",
  "observacao": "Acordo negociado"
}
```
> As parcelas são geradas automaticamente com vencimento mensal a partir de `data_primeiro_vencimento`.

**Filtros:**
- `/api/acordos/?unidade=1`
- `/api/acordos/?criado_de=2026-01-01`

---

### Parcelas do Acordo — `/api/parcelas-acordo/`

| Método | URL | Autenticação | Descrição |
|--------|-----|:---:|-----------|
| GET | /api/parcelas-acordo/ | qualquer autenticado | Listar |
| GET | /api/parcelas-acordo/{id}/ | qualquer autenticado | Detalhe |
| PUT | /api/parcelas-acordo/{id}/ | staff/superuser | Registrar pagamento de parcela |
| DELETE | /api/parcelas-acordo/{id}/ | staff/superuser | Excluir |

> Parcelas **não aceitam POST** — são criadas exclusivamente pela rota de acordos.

**Filtros:**
- `/api/parcelas-acordo/?acordo=1`
- `/api/parcelas-acordo/?status=PENDENTE`

---

### Endpoints Inteligentes

| Método | URL | Autenticação | Descrição |
|--------|-----|:---:|-----------|
| GET | /api/dashboard/ | qualquer autenticado | Resumo financeiro geral |
| GET | /api/inadimplencia/resumo/ | qualquer autenticado | Inadimplência agrupada por condomínio |
| GET | /api/unidades/{id}/resumo-financeiro/ | qualquer autenticado | Resumo financeiro de uma unidade |

**GET /api/dashboard/**
```json
{
  "total_condominios": 5,
  "total_unidades": 120,
  "total_cobrancas": 300,
  "total_pagas": 180,
  "total_pendentes": 70,
  "total_vencidas": 50,
  "valor_total_recebido": 85420.00,
  "valor_total_em_aberto": 23110.00,
  "total_acordos": 12
}
```

**GET /api/inadimplencia/resumo/**
```json
[
  {
    "condominio_id": 1,
    "condominio": "Residencial Primavera",
    "qtd_cobrancas_vencidas": 14,
    "valor_total_vencido": 7820.00
  }
]
```

**GET /api/unidades/10/resumo-financeiro/**
```json
{
  "unidade": 10,
  "responsavel": "Carlos Silva",
  "total_cobrancas": 12,
  "total_pagas": 9,
  "total_vencidas": 2,
  "total_pendentes": 1,
  "valor_em_aberto": 1450.00,
  "possui_acordo": true
}
```

---

## 🗂️ Relacionamento entre tabelas (DER simplificado)

```
Condominio (1) ──────── (N) Unidade
                              │
              ┌───────────────┤
              │               │
             (N)             (N)
           Cobranca        Acordo ──── (N) ParcelaAcordo
                              │
                    (M:N via Acordo_Cobrancas)
                           Cobranca
```

| Relacionamento | Cardinalidade | Descrição |
|---|---|---|
| Condominio → Unidade | 1:N | Um condomínio possui N unidades |
| Unidade → Cobranca | 1:N | Uma unidade gera N cobranças mensais |
| Unidade → Acordo | 1:N | Uma unidade pode ter N acordos |
| Acordo → ParcelaAcordo | 1:N | Um acordo tem N parcelas (geradas automaticamente) |
| Acordo ↔ Cobranca | M:N | Um acordo agrupa N cobranças vencidas |

---

## 📋 Regras de Negócio

| Regra | Descrição |
|---|---|
| Status PAGO | `data_pagamento` e `forma_pagamento` são obrigatórios |
| Multa | 2% sobre o valor original, aplicada no pagamento após vencimento |
| Juros | 0,033% ao dia de atraso sobre o valor original |
| VENCIDO | Cobranças PENDENTE com `data_vencimento < hoje` são marcadas automaticamente ao listar |
| Acordo | Só pode incluir cobranças da mesma unidade |
| Parcelas | Geradas automaticamente com vencimento mensal a partir de `data_primeiro_vencimento` |
| PATCH desabilitado | A API não aceita PATCH em nenhum endpoint; use PUT com o objeto completo |

---

## 📁 Estrutura do projeto

```
backend/
├── api/
│   ├── migrations/
│   ├── management/commands/seed.py   # População com 3 níveis de usuário
│   ├── models.py                     # Modelos com regras de cálculo
│   ├── serializers.py                # Serializers com validações de negócio
│   ├── views.py                      # ViewSets + Views inteligentes
│   ├── filters.py                    # Filtros DjangoFilterBackend
│   ├── permissions.py                # IsAdminOrReadOnly
│   ├── urls.py                       # Rotas (DefaultRouter)
│   └── admin.py                      # Painel administrativo
├── config/
│   ├── settings.py
│   └── urls.py
├── requirements.txt
└── README.md
```

---

## 📦 Requisitos funcionais

- ✅ Cadastro de Condomínios (nome, CNPJ opcional, endereço)
- ✅ Cadastro de Unidades vinculadas a Condomínio (com status OCUPADO/VAGO)
- ✅ Cobranças com campos: valor, data_vencimento, status, data_pagamento, multa, juros, forma_pagamento
- ✅ Cálculo automático de multa (2%) e juros (0,033%/dia) em pagamentos após vencimento
- ✅ Status VENCIDO atualizado automaticamente nas listagens
- ✅ Consulta de inadimplência por condomínio, unidade, status e período
- ✅ Acordos de parcelamento com geração automática de parcelas mensais
- ✅ Autenticação JWT com rotas `/api/token/` e `/api/token/refresh/`
- ✅ Distinção de níveis de acesso: superadmin / admin (staff) / user (somente leitura)
- ✅ Filtros por DjangoFilterBackend em cobranças, acordos e unidades
- ✅ Endpoints inteligentes: dashboard, inadimplência por condomínio, resumo por unidade
- ✅ Banco MySQL configurado

## 📦 Requisitos não funcionais

- ✅ Ambiente virtual Python (venv)
- ✅ Django REST Framework com DefaultRouter
- ✅ ModelSerializers com campos relacionais via ID
- ✅ ViewSets com CRUD completo (GET, POST, PUT, DELETE — sem PATCH)
- ✅ DjangoFilterBackend para filtros via query parameters
- ✅ JWT com SimpleJWT (token expira em 8h, refresh em 1 dia)
- ✅ Código organizado com separação de responsabilidades (models, serializers, views, filters, permissions)
- ✅ Banco MySQL com charset utf8mb4
