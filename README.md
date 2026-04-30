# ⚡ SmartSENAI — Sistema de Monitoramento Ambiental

Sistema de monitoramento de sensores ambientais para a escola TecnoVille, desenvolvido com **Django REST Framework** no back-end e **React + Vite** no front-end. Coleta e visualiza dados em tempo real de temperatura, umidade, luminosidade e contadores instalados em ambientes da escola.

Desenvolvido por: Alejandra Michelle Giménez Luján
Turma: Desenvolvimento de Sistemas 2 (2DS-MB)

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
- [Instalação e Execução — Back-end](#instalação-e-execução--back-end)
- [Instalação e Execução — Front-end](#instalação-e-execução--front-end)
- [Criando o Superusuário](#criando-o-superusuário)
- [Populando o Banco de Dados](#populando-o-banco-de-dados)
- [Endpoints da API](#endpoints-da-api)
- [Autenticação JWT](#autenticação-jwt)
- [Funcionalidades do Front-end](#funcionalidades-do-front-end)
- [Regras de Negócio](#regras-de-negócio)
- [Dependências](#dependências)

---

## 🔍 Visão Geral

O sistema coleta dados de sensores instalados em ambientes da escola (praças, corredores, pátios) e os disponibiliza via API RESTful. Um painel web permite visualizar e gerenciar todos os dados com autenticação JWT.

**Tipos de sensor suportados:**

| Sensor       | Unidade | Choices (banco) |
|--------------|---------|-----------------|
| Temperatura  | °C      | `TEMPERATURA`   |
| Umidade      | %       | `UMIDADE`       |
| Luminosidade | lux     | `LUMINOSIDADE`  |
| Contador     | uni     | `CONTADOR`      |

---

## 🛠️ Tecnologias

**Back-end:**
- Python 3.10+
- Django 6.0.4
- Django REST Framework 3.17.1
- djangorestframework-simplejwt 5.5.1
- django-filter 25.2
- django-cors-headers 4.9.0
- MySQL (mysqlclient 2.2.8 + PyMySQL 1.1.2)
- Pandas 3.0.2 + openpyxl 3.1.5 (importação de planilhas)

**Front-end:**
- React 19 + Vite
- React Router DOM 7
- Axios 1.x
- Google Fonts: DM Sans + DM Mono

---

## 📁 Estrutura do Projeto

```
Smart-City/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── admin.py          # Registro de todos os models no Django Admin
│   │   ├── apps.py
│   │   ├── filters.py        # Filtros django-filter para cada endpoint
│   │   ├── models.py         # Modelos: Sensores, Historicos, Ambientes, etc.
│   │   ├── permissions.py    # IsAdminOrReadOnly (Admin: CRUD / Usuário: só leitura)
│   │   ├── serializers.py    # Serializers DRF + RegisterSerializer + UsuarioMeSerializer
│   │   ├── tests.py
│   │   ├── urls.py           # Rotas da API (ViewSets + endpoints de importação)
│   │   └── views.py          # ViewSets, RegisterView, UsuarioMeView, importar_*
│   ├── config/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py       # Configurações Django (DB, JWT, CORS, etc.)
│   │   ├── urls.py           # URLs raiz: /admin/ e /api/
│   │   └── wsgi.py
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js           # Instância Axios com interceptor JWT (401 → logout)
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── components/
│   │   │   ├── FormField.jsx      # Label + campo; exporta estilos btnPrimary, btnEdit, btnDanger, input
│   │   │   ├── Layout.jsx         # Sidebar com navegação completa + botão de logout
│   │   │   ├── Modal.jsx          # Modal reutilizável para formulários
│   │   │   ├── PrivateRoute.jsx   # Proteção de rotas: redireciona para /login sem token
│   │   │   └── Table.jsx          # Tabela reutilizável com zebra striping
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Dashboard com cards dos 4 sensores e última leitura
│   │   │   ├── Login.jsx          # Autenticação JWT; armazena token no localStorage
│   │   │   ├── crud/
│   │   │   │   ├── Ambientes.jsx       # CRUD: Ambientes (FK: Local, Responsável)
│   │   │   │   ├── Historicos.jsx      # CRUD: Medições, com filtro por tipo de sensor
│   │   │   │   ├── Locais.jsx          # CRUD: Locais físicos
│   │   │   │   ├── Microcontroladores.jsx  # CRUD: Microcontroladores (FK: Ambiente)
│   │   │   │   ├── Responsaveis.jsx    # CRUD: Responsáveis por ambientes
│   │   │   │   ├── Sensores.jsx        # CRUD: Sensores (FK: Microcontrolador)
│   │   │   │   └── Usuarios.jsx        # CRUD: Usuários (criação via /api/register/)
│   │   │   └── sensores/
│   │   │       ├── Contador.jsx        # Histórico filtrado: CONTADOR
│   │   │       ├── Luminosidade.jsx    # Histórico filtrado: LUMINOSIDADE
│   │   │       ├── Temperatura.jsx     # Histórico filtrado: TEMPERATURA
│   │   │       └── Umidade.jsx         # Histórico filtrado: UMIDADE
│   │   ├── App.css            # (vazio — estilos centralizados no index.css)
│   │   ├── App.jsx            # Definição de todas as rotas com PrivateRoute
│   │   ├── index.css          # Tema global: variáveis CSS, tipografia DM Sans/DM Mono
│   │   └── main.jsx           # Entry point React
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

> **Nota:** a pasta `population/` com as planilhas `.xlsx` para popular o banco é fornecida pelo professor separadamente.

---

## ✅ Pré-requisitos

- **Python** 3.10 ou superior → https://python.org
- **MySQL** 8.0 ou superior → https://dev.mysql.com/downloads/
- **Node.js** 18 ou superior → https://nodejs.org
- **Git** → https://git-scm.com

---

## 🗄️ Configuração do Banco de Dados

1. Abra o MySQL e crie o banco:

```sql
CREATE DATABASE smartcity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Ajuste as credenciais em `backend/config/settings.py` se necessário:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'smartcity',
        'USER': 'root',       # seu usuário MySQL
        'PASSWORD': 'senai',  # sua senha MySQL
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}
```

---

## 🐍 Instalação e Execução — Back-end

```bash
# 1. Entrar na pasta do back-end
cd backend

# 2. Criar e ativar o ambiente virtual
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Aplicar as migrações
python manage.py migrate

# 5. Iniciar o servidor
python manage.py runserver
```

O servidor estará disponível em: **http://127.0.0.1:8000/**

> O Django Admin fica em **http://127.0.0.1:8000/admin/**

---

## 🌐 Instalação e Execução — Front-end

```bash
# 1. Entrar na pasta do front-end
cd frontend

# 2. Instalar dependências
npm install

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

O front-end estará disponível em: **http://localhost:5173/**

> O back-end precisa estar rodando antes de iniciar o front-end.

---

## 👤 Criando o Superusuário

```bash
python manage.py createsuperuser
```

Quando solicitado, informe:
- **Username:** `senai`
- **Password:** `123`

Em seguida, crie o perfil na tabela `Usuarios` via endpoint:

```json
POST /api/register/
{
  "username": "senai",
  "password": "123",
  "nome": "Administrador SENAI",
  "tipo": "ADMINISTRADOR"
}
```

---

## 📊 Populando o Banco de Dados

Importe as planilhas **nessa ordem** — cada etapa depende da anterior:

| Ordem | Endpoint                                   | Planilha                   |
|-------|--------------------------------------------|----------------------------|
| 1º    | `POST /api/importar/locais/`               | `locais.xlsx`              |
| 2º    | `POST /api/importar/responsaveis/`         | `responsaveis.xlsx`        |
| 3º    | `POST /api/importar/ambientes/`            | `ambientes.xlsx`           |
| 4º    | `POST /api/importar/microcontroladores/`   | `microcontroladores.xlsx`  |
| 5º    | `POST /api/importar/sensores/`             | `sensores.xlsx`            |
| 6º    | `POST /api/importar/historicos/`           | `historicos.xlsx`          |

**Como importar no Postman/Insomnia:**

1. Obtenha o token em `POST /api/token/` com `{ "username": "senai", "password": "123" }`
2. Adicione o header: `Authorization: Bearer <access_token>`
3. Body → `form-data` → chave `file`, tipo `File` → selecione a planilha
4. Envie para o endpoint correspondente

**Se precisar reimportar do zero**, limpe as tabelas respeitando as FK:

```sql
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM api_historicos;
DELETE FROM api_sensores;
DELETE FROM api_microcontroladores;
DELETE FROM api_ambientes;
DELETE FROM api_responsaveis;
DELETE FROM api_locais;
ALTER TABLE api_historicos          AUTO_INCREMENT = 1;
ALTER TABLE api_sensores            AUTO_INCREMENT = 1;
ALTER TABLE api_microcontroladores  AUTO_INCREMENT = 1;
ALTER TABLE api_ambientes           AUTO_INCREMENT = 1;
ALTER TABLE api_responsaveis        AUTO_INCREMENT = 1;
ALTER TABLE api_locais              AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;
```

---

## 🔌 Endpoints da API

### Autenticação

| Método | Endpoint          | Descrição                        |
|--------|-------------------|----------------------------------|
| POST   | `/api/token/`     | Obtém o par de tokens JWT        |
| POST   | `/api/refresh/`   | Renova o access token            |
| POST   | `/api/register/`  | Cadastra novo usuário            |
| GET    | `/api/me/`        | Dados do usuário autenticado     |

### Recursos principais (CRUD completo)

| Método          | Endpoint                      | Descrição                      |
|-----------------|-------------------------------|--------------------------------|
| GET / POST      | `/api/sensores/`              | Lista / cria sensores          |
| GET/PUT/DELETE  | `/api/sensores/{id}/`         | Detalhe / edita / exclui       |
| GET / POST      | `/api/microcontroladores/`    | Lista / cria microcontroladores|
| GET/PUT/DELETE  | `/api/microcontroladores/{id}/` | Detalhe / edita / exclui     |
| GET / POST      | `/api/ambientes/`             | Lista / cria ambientes         |
| GET/PUT/DELETE  | `/api/ambientes/{id}/`        | Detalhe / edita / exclui       |
| GET / POST      | `/api/locais/`                | Lista / cria locais            |
| GET/PUT/DELETE  | `/api/locais/{id}/`           | Detalhe / edita / exclui       |
| GET / POST      | `/api/responsaveis/`          | Lista / cria responsáveis      |
| GET/PUT/DELETE  | `/api/responsaveis/{id}/`     | Detalhe / edita / exclui       |
| GET / POST      | `/api/historicos/`            | Lista / registra medições      |
| GET/PUT/DELETE  | `/api/historicos/{id}/`       | Detalhe / edita / exclui       |
| GET             | `/api/historicos/recentes/`   | Medições das últimas 24h       |
| GET / POST      | `/api/usuarios/`              | Lista / cria usuários          |
| GET/PUT/DELETE  | `/api/usuarios/{id}/`         | Detalhe / edita / exclui       |

### Filtros disponíveis

```
# Filtrar histórico por tipo de sensor
GET /api/historicos/?sensor__sensor=TEMPERATURA
GET /api/historicos/?sensor__sensor=UMIDADE
GET /api/historicos/?sensor__sensor=LUMINOSIDADE
GET /api/historicos/?sensor__sensor=CONTADOR

# Filtrar histórico por faixa de data
GET /api/historicos/?timestamp_min=2025-01-01T00:00:00&timestamp_max=2025-12-31T23:59:59

# Filtrar sensores por tipo e status
GET /api/sensores/?sensor=TEMPERATURA&status=true

# Filtrar microcontroladores por status
GET /api/microcontroladores/?status=true

# Medições das últimas 24h
GET /api/historicos/recentes/
```

Todos os endpoints de recursos aceitam `GET`, `POST`, `PUT` e `DELETE` (exceto `recentes/` que é somente `GET`).

### Filtros disponíveis

```
GET /api/historicos/?sensor__sensor=TEMPERATURA
GET /api/historicos/?sensor__sensor=UMIDADE
GET /api/historicos/?sensor__sensor=LUMINOSIDADE
GET /api/historicos/?sensor__sensor=CONTADOR
GET /api/historicos/?timestamp_min=2025-01-01T00:00:00
GET /api/historicos/?timestamp_max=2025-12-31T23:59:59
GET /api/sensores/?sensor=TEMPERATURA&status=true
GET /api/microcontroladores/?status=true
GET /api/historicos/recentes/
```

### Importação de planilhas

| Método | Endpoint                                  |
|--------|-------------------------------------------|
| POST   | `/api/importar/locais/`                   |
| POST   | `/api/importar/responsaveis/`             |
| POST   | `/api/importar/ambientes/`                |
| POST   | `/api/importar/microcontroladores/`       |
| POST   | `/api/importar/sensores/`                 |
| POST   | `/api/importar/historicos/`               |

---

## 🔐 Autenticação JWT

**Obter token:**

```bash
POST /api/token/
Content-Type: application/json

{ "username": "senai", "password": "123" }
```

**Usar nas requisições:**

```
Authorization: Bearer <access_token>
```

**Renovar (expira em 120 min):**

```bash
POST /api/refresh/
Content-Type: application/json

{ "refresh": "<refresh_token>" }
```

**Níveis de acesso:**

| Tipo          | Permissões                         |
|---------------|------------------------------------|
| ADMINISTRADOR | CRUD completo em todos os recursos |
| USUARIO       | Somente leitura (GET)              |

---

## 💻 Funcionalidades do Front-end

### Fluxo de navegação

```
/login  →  /home (dashboard)
               ├── /sensores/temperatura
               ├── /sensores/umidade
               ├── /sensores/luminosidade
               ├── /sensores/contador
               ├── /crud/sensores
               ├── /crud/microcontroladores
               ├── /crud/ambientes
               ├── /crud/locais
               ├── /crud/responsaveis
               ├── /crud/usuarios
               └── /crud/historicos
```

### Páginas

| Página | Descrição |
|--------|-----------|
| Login | Autenticação JWT; token armazenado no `localStorage`; redirecionamento automático |
| Home | Dashboard com cards dos 4 tipos de sensor mostrando a última leitura de cada um |
| Temperatura / Umidade / Luminosidade / Contador | Histórico de medições em tabela, filtrado por tipo |
| CRUD Sensores | Listagem + criar/editar/excluir via modal |
| CRUD Microcontroladores | Com status ativo/inativo e FK para Ambiente |
| CRUD Ambientes | Com dropdowns para Local e Responsável |
| CRUD Locais | Gerenciamento de locais físicos |
| CRUD Responsáveis | Gerenciamento de responsáveis |
| CRUD Usuários | Criação via `/api/register/`; edição de perfil via PATCH |
| CRUD Medições | Filtro por tipo de sensor; validação de sensor inativo |

### Comportamentos

- **Proteção de rotas** — sem token válido redireciona para `/login`
- **Erro 401** — token expirado faz logout automático e redireciona para login
- **Logout** — remove token do `localStorage` e redireciona
- **Selects dinâmicos** — dropdowns de FK populados via chamadas à API

### Identidade visual

- **Nome:** SmartSENAI
- **Tema:** claro (fundo `#F7F9FC`, superfícies `#FFFFFF`)
- **Cor primária:** `#0057B8` — contraste **4.6:1** sobre branco (WCAG AA)
- **Acessibilidade para daltônicos:** todas as cores semânticas com contraste mínimo 4.5:1
- **Tipografia:** DM Sans (interface) + DM Mono (código/monospace)

---

## ⚙️ Regras de Negócio

1. **Sensor inativo não aceita medições** — ao registrar um histórico para sensor com `status = false`, a API retorna 400:
   ```json
   { "erro": "Não é possível registrar medições para um sensor inativo." }
   ```

2. **Níveis de usuário** — `ADMINISTRADOR` tem CRUD completo; `USUARIO` tem somente leitura.

3. **Normalização na importação** — valores da planilha como `Temperatura` e `ºC` são automaticamente convertidos para `TEMPERATURA` e `°C` (choices do model).

4. **Ordem de importação** — ambientes dependem de locais e responsáveis; microcontroladores dependem de ambientes; sensores dependem de microcontroladores; históricos dependem de sensores.

---

## 📦 Dependências

**Back-end (`requirements.txt`):**

```
asgiref==3.11.1
Django==6.0.4
django-cors-headers==4.9.0
django-filter==25.2
djangorestframework==3.17.1
djangorestframework_simplejwt==5.5.1
mysqlclient==2.2.8
numpy==2.4.4
openpyxl==3.1.5
pandas==3.0.2
PyJWT==2.12.1
PyMySQL==1.1.2
python-dateutil==2.9.0.post0
six==1.17.0
sqlparse==0.5.5
tzdata==2026.1
```

**Front-end (`package.json` — dependências principais):**

```json
"dependencies": {
  "axios": "^1.15.0",
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "react-router-dom": "^7.14.1"
}
```

---

## 📝 Observações

- Trabalho individual — PWBE, SENAI "Roberto Mange"
- Banco de dados configurado para **MySQL** — não compatível com SQLite sem alterar `settings.py`
- Token JWT expira em **120 minutos** — use `/api/refresh/` para renová-lo
- Em produção, altere o `SECRET_KEY` e configure `DEBUG = False` no `settings.py`
- Todas as URLs da API terminam com `/` — requisições sem barra final retornam erro 500
