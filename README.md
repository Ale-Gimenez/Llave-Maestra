# 🏢 Sistema de Controle de Cobranças Condominiais
API REST desenvolvida com **Django + Django REST Framework** para gerenciar condomínios, unidades, cobranças, inadimplência e acordos de parcelamento.

---

## ⚙️ Como rodar o projeto

### 1. Pré-requisitos
- Python 3.10+
- pip

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

**SQLite (padrão, sem configuração extra):**  
Já está configurado. Pode pular este passo.

**MySQL (opcional):**  
Edite `condominio_project/settings.py`, descomente o bloco MySQL e preencha:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'condominio_db',
        'USER': 'root',
        'PASSWORD': 'sua_senha',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```
Também instale o driver: `pip install mysqlclient`  
E crie o banco: `CREATE DATABASE condominio_db CHARACTER SET utf8mb4;`

### 5. Aplique as migrações
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Popule com dados de exemplo
```bash
python manage.py seed
```
Isso cria:
- **admin** / admin123 (superusuário)
- **user** / user123 (usuário comum)
- 3 condomínios, 9 unidades, cobranças variadas e 1 acordo

### 7. Rode o servidor
```bash
python manage.py runserver
```
API disponível em: http://127.0.0.1:8000/api/

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

## 📌 Endpoints

### Condomínios
| Método | URL | Descrição |
|--------|-----|-----------|
| GET | /api/condominios/ | Listar todos |
| POST | /api/condominios/ | Criar |
| GET | /api/condominios/{id}/ | Detalhe |
| PUT/PATCH | /api/condominios/{id}/ | Editar |
| DELETE | /api/condominios/{id}/ | Excluir |

**POST /api/condominios/**
```json
{"nome": "Residencial Aurora", "cnpj": "11.222.333/0001-44", "endereco": "Rua X, 10"}
```

### Unidades
| Método | URL | Descrição |
|--------|-----|-----------|
| GET | /api/unidades/ | Listar (filtrável) |
| POST | /api/unidades/ | Criar |
| GET | /api/unidades/{id}/resumo-financeiro/ | Resumo financeiro |

**POST /api/unidades/**
```json
{"condominio_id": 1, "numero": "301", "bloco": "C", "responsavel": "João Silva", "status": "OCUPADO"}
```

**Filtros disponíveis:**
- `/api/unidades/?condominio=1`
- `/api/unidades/?status=VAGO`

### Cobranças
| Método | URL | Descrição |
|--------|-----|-----------|
| GET | /api/cobrancas/ | Listar (filtrável) |
| POST | /api/cobrancas/ | Criar |
| PATCH | /api/cobrancas/{id}/ | Atualizar (ex: marcar como PAGO) |

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

**PATCH - Registrar pagamento:**
```json
{
  "status": "PAGO",
  "data_pagamento": "2026-05-15",
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

### Acordos
| Método | URL | Descrição |
|--------|-----|-----------|
| GET | /api/acordos/ | Listar |
| POST | /api/acordos/ | Criar (gera parcelas automaticamente) |

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
> As parcelas são geradas automaticamente com vencimento mensal.

**Filtros:**
- `/api/acordos/?unidade=1`
- `/api/acordos/?criado_de=2026-01-01`

### Parcelas do Acordo
| Método | URL | Descrição |
|--------|-----|-----------|
| GET | /api/parcelas-acordo/ | Listar |
| PATCH | /api/parcelas-acordo/{id}/ | Registrar pagamento de parcela |

**Filtros:**
- `/api/parcelas-acordo/?acordo=1`
- `/api/parcelas-acordo/?status=PENDENTE`

### Endpoints Inteligentes
| URL | Descrição |
|-----|-----------|
| GET /api/dashboard/ | Resumo financeiro geral |
| GET /api/inadimplencia/resumo/ | Inadimplência por condomínio |
| GET /api/unidades/{id}/resumo-financeiro/ | Resumo financeiro de uma unidade |

---

## 🗂️ Relacionamento entre tabelas (DER simplificado)

```
Condominio (1) ──────── (N) Unidade
                              │
              ┌───────────────┤
              │               │
             (N)             (N)
           Cobranca        Acordo
                              │
                             (N)
                        ParcelaAcordo
```

- **Condominio → Unidade**: 1 condomínio tem N unidades
- **Unidade → Cobranca**: 1 unidade tem N cobranças mensais
- **Unidade → Acordo**: 1 unidade pode ter N acordos
- **Acordo → ParcelaAcordo**: 1 acordo tem N parcelas (geradas automaticamente)
- **Acordo ↔ Cobranca**: M:N — um acordo agrupa N cobranças vencidas

---

## 📋 Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| Status PAGO | `data_pagamento` e `forma_pagamento` obrigatórios |
| Multa | 2% sobre o valor, aplicada no pagamento após vencimento |
| Juros | 0,033% ao dia de atraso |
| VENCIDO | Cobranças PENDENTE com `data_vencimento < hoje` são marcadas automaticamente |
| Acordo | Só pode incluir cobranças da mesma unidade |
| Parcelas | Geradas automaticamente com vencimento mensal a partir de `data_primeiro_vencimento` |

---

## 🔐 Níveis de acesso

- Todos os endpoints exigem autenticação JWT (`IsAuthenticated`)
- Para diferenciar Admin/User, use o campo `is_staff` do Django Admin
- Admin: acesse `/admin/` com admin/admin123

---

## 📁 Estrutura do projeto

```
condominio_project/
├── api/
│   ├── migrations/
│   ├── management/commands/seed.py
│   ├── models.py        # Modelos
│   ├── serializers.py   # Serializers com validações
│   ├── views.py         # ViewSets + Views inteligentes
│   ├── filters.py       # Filtros DjangoFilterBackend
│   ├── urls.py          # Rotas (DefaultRouter)
│   └── admin.py
├── condominio_project/
│   ├── settings.py
│   └── urls.py
├── fixtures/
│   ├── api_data.json    # Fixture com dados de exemplo
│   └── banco_de_dados.sql
├── requirements.txt
└── README.md
```
