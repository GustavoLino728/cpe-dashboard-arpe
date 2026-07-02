# ARPE - CPE Dashboard (Monorepo)

Este repositório contém  o **CPE Dashboard**, um sistema desenvolvido para a **ARPE** (Agência de Regulação de Pernambuco) projetado para automatizar a carga, extração e visualização de projetos, atividades e prazos a partir de planilhas Excel.

## 📌 Sobre o Projeto

O objetivo principal desta aplicação é receber planilhas de mapeamento cronológico de atividades, extrair seus dados de forma automatizada e estruturá-los em um banco de dados relacional para posterior visualização em um painel (dashboard).

### Como funciona a extração:
- **Abas como Projetos**: Cada aba (worksheet) da planilha Excel representa um **Projeto** diferente, e o nome da aba se torna o nome do projeto no sistema.
- **Linhas como Atividades**: Cada linha da aba é extraída como uma **Atividade** vinculada àquele projeto.
- **Substituição inteligente (Overwrite)**: A cada nova carga de planilha, o sistema limpa as atividades antigas daquele projeto e insere as novas, garantindo sincronia total com o arquivo Excel e permitindo que linhas duplicadas (ex: múltiplas tarefas de "Ciência" para setores diferentes) coexistam perfeitamente.

## 🛠️ Tecnologias Utilizadas

### Backend (`/backend`)
- **Python 3.12** com **FastAPI** (Framework web de alta performance)
- **SQLAlchemy 2.0** (ORM assíncrono para mapeamento de banco de dados)
- **Alembic** (Controle de versionamento e migrações do banco de dados)
- **openpyxl** (Leitura e processamento de arquivos Excel `.xlsx` / `.xls`)
- **PostgreSQL 16** (Banco de dados relacional)
- **Uvicorn** (Servidor ASGI para rodar a aplicação com live-reload)

### Frontend (`/frontend`)
- **Next.js 16** (Framework React com suporte a Turbopack)
- **React 19** & **TypeScript**
- **TailwindCSS v4** (Estilização moderna e responsiva)

### DevOps & Infraestrutura
- **Docker** & **Docker Compose** (Orquestração de contêineres para desenvolvimento facilitado)

## 🚀 Como Rodar o Projeto

Toda a infraestrutura é orquestrada via Docker Compose, o que significa que você não precisa instalar Python, Node.js ou PostgreSQL localmente para rodar a aplicação.

### 1. Pré-requisitos
- Ter o [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados na máquina.

### 2. Configurar as Variáveis de Ambiente
Crie um arquivo `.env` dentro da pasta `/backend` (baseando-se no [backend/.env.example](file:///c:/Users/gustavo.lino/git_projects/arpe-cpe-dashboard-api/backend/.env.example)) com as credenciais do banco:
```env
DATABASE_URL=postgresql+asyncpg://arpe:arpe@db:5432/cpe-dashboard
POSTGRES_USER=arpe
POSTGRES_PASSWORD=arpe
POSTGRES_DB=cpe-dashboard
APP_ENV=development
APP_DEBUG=true
```

### 3. Iniciar os Contêineres
Na raiz do projeto (onde está o arquivo `docker-compose.yml`), execute o comando:
```bash
docker-compose up -d --build
```
Este comando irá baixar as imagens, compilar o backend e o frontend, e subir os seguintes serviços:

| Serviço | URL / Porta no Host | Descrição |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Interface gráfica em Next.js |
| **Backend (API)** | [http://localhost:8001](http://localhost:8001) | Documentação Swagger em `/docs` |
| **Banco de Dados** | `localhost:5434` | Instância do PostgreSQL |

---

## 🧬 Controle de Versão do Banco (Alembic)

O banco de dados do backend já está configurado com o Alembic para controle de versionamento das tabelas.

- **Para criar uma nova migration** (após modificar algum model em `backend/app/domain/...`):
  ```bash
  docker-compose exec api alembic revision --autogenerate -m "descricao_da_mudanca"
  ```
- **Para aplicar as migrations pendentes**:
  ```bash
  docker-compose exec api alembic upgrade head
  ```
- **Para marcar o banco como atualizado** (caso as tabelas já existam fisicamente):
  ```bash
  docker-compose exec api alembic stamp head
  ```