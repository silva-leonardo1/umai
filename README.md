# 🍜 Umai - Plataforma de Receitas com IA

> Uma aplicação web moderna para compartilhamento de receitas, integrando Inteligência Artificial para geração de imagens culinárias.

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple.svg)](https://getbootstrap.com/)
[![Status](https://img.shields.io/badge/Status-Online-success.svg)](https://leonardosilva016.pythonanywhere.com/)

---

## 🌐 Demonstração Online
Acesse o projeto rodando em produção:
👉 **[https://leonardosilva016.pythonanywhere.com/](https://leonardosilva016.pythonanywhere.com/)**

---

## 📸 Screenshots


| Home Page | Página de Receita |
|:---:|:---:|
| ![Image](https://github.com/user-attachments/assets/4fe1995e-f413-4f09-b950-d48070513ed5) | ![Image](https://github.com/user-attachments/assets/7fac356a-43ec-44ce-b9e5-a37f192d59da) |

---

## 🚀 Funcionalidades Principais

* **Autenticação Completa:** Sistema de Login e Registro de usuários seguro (com hash de senhas via Bcrypt).
* **Gestão de Receitas (CRUD):** Usuários podem criar, visualizar e listar receitas.
* **🎨 Geração de Imagens com IA:** Integração com a API **Hugging Face (Stable Diffusion)**. Se o usuário não tiver foto do prato, a IA gera uma imagem realista baseada no título da receita.
* **☁️ Upload de Imagens:** Integração com a API do **ImgBB** para hospedagem de imagens enviadas manualmente.
* **🔄 Consumo de API Externa:** Integração com **TheMealDB** utilizando o padrão de projeto *Adapter* para normalizar dados externos e exibi-los na mesma interface das receitas locais.
* **Design Responsivo:** Interface moderna construída com **Bootstrap 5**, modo escuro (Dark Mode) e componentes interativos.

---

## 🛠️ Tecnologias Utilizadas

* **Backend:** Python 3, Flask.
* **Banco de Dados:** SQLite (com SQLAlchemy ORM).
* **Frontend:** HTML5, CSS3, JavaScript, Bootstrap 5.3, Jinja2 Templates.
* **Segurança:** Flask-Login (Sessão), Flask-Bcrypt (Criptografia).
* **APIs & Serviços:**
    * Hugging Face Inference API (IA Generativa).
    * ImgBB API (Hospedagem de Imagens).
    * TheMealDB (Dados externos).
* **Deploy:** PythonAnywhere (WSGI).

---

## 📦 Como rodar localmente

Se você quiser clonar e rodar este projeto na sua máquina:

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/silva-leonardo1/umai.git
    cd umai
    ```

2.  **Crie um ambiente virtual:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux/Mac
    venv\Scripts\activate     # Windows
    ```

3.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto e adicione suas chaves (você pode pegar chaves gratuitas nos sites respectivos):
    ```env
    SECRET_KEY=sua_chave_secreta_aleatoria
    IMGBB_API_KEY=sua_chave_do_imgbb
    HF_API_KEY=sua_chave_hugging_face
    ```

5.  **Rode o servidor:**
    ```bash
    flask run
    ```
    Acesse `http://127.0.0.1:5000` no seu navegador.

---

## 📂 Estrutura do Projeto

```text
/
├── static/          # Arquivos CSS, JS e Imagens
├── templates/       # Arquivos HTML (Jinja2)
├── instance/        # Banco de dados SQLite
├── app.py           # Código principal (Rotas e Configurações)
├── requirements.txt # Dependências do projeto
└── README.md        # Documentação
