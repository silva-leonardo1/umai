from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
import os
from dotenv import load_dotenv
import base64
import requests
import time
import re # Usado para limpar o cabeçalho do base64

load_dotenv()

# --- CONFIGURAÇÕES ---
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = 'chave_super_secreta_mudeme'

# Chaves
IMGBB_API_KEY = os.getenv("IMGBB_API_KEY")
HF_API_KEY = os.getenv('HF_API_KEY') 

# Inicialização
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
CORS(app)
login_manager = LoginManager(app)
login_manager.login_view = 'home'

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# --- MODELOS ---
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    password = db.Column(db.String(80), nullable=False)
    recipes = db.relationship('Recipe', backref='author', lazy=True)
    avatar_index = db.Column(db.Integer, default=0)

class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    ingredients = db.Column(db.Text, nullable=False)
    instructions = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# --- FUNÇÕES AUXILIARES ---

def upload_to_imgbb(image_data, is_base64_string=False):
    """
    Sobe imagem para o ImgBB.
    Aceita tanto bytes brutos quanto string base64 pura.
    """
    try:
        # Se recebemos bytes (da IA), convertemos para string b64
        if not is_base64_string:
            b64_image = base64.b64encode(image_data).decode('utf-8')
        else:
            # Se já é string (do upload manual), usamos ela direto
            b64_image = image_data

        payload = {
            "key": IMGBB_API_KEY,
            "image": b64_image,
        }
        response = requests.post("https://api.imgbb.com/1/upload", data=payload)
        
        if response.status_code == 200:
            return response.json()['data']['url']
        return None
    except Exception as e:
        print(f"Erro Upload ImgBB: {e}")
        return None

def gerar_bytes_huggingface(titulo):
    """Gera a imagem na IA e retorna os bytes."""
    API_URL = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    prompt = f"professional food photography of {titulo}, 8k, highly detailed, appetizing, cinematic lighting, centered"

    for i in range(3):
        try:
            response = requests.post(API_URL, headers=headers, json={"inputs": prompt})
            if response.status_code == 200:
                return response.content
            elif response.status_code == 503:
                time.sleep(3)
            else:
                break
        except Exception:
            time.sleep(1)
    return None

# --- ROTAS (FRONTEND) ---

@app.route("/")
def home():
    return render_template('index.html') 

@app.route("/receitas")
def receitas_page():
    return render_template('receitas.html')

@app.route("/enviar_receita")
def enviar_receita():
    return render_template('enviar_receita.html') 

@app.route('/user/<username>')
def profile(username):
    usuario_do_perfil = User.query.filter_by(username=username).first_or_404()
    return render_template('user.html', usuario=usuario_do_perfil)

@app.route('/pagina_receita/<id>')
def pagina_receita(id):
    receita_escolhida = Recipe.query.get_or_404(id)
    return render_template('pagina_receita.html', receita=receita_escolhida)

# Rota de atalho para O MEU perfil
@app.route('/user')
@login_required
def user():
    # Renderiza o mesmo template, mas usando o usuário logado (current_user)
    return render_template('user.html', usuario=current_user)

# --- ROTAS (API) ---

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    if user and bcrypt.check_password_hash(user.password, data.get('password')):
        login_user(user)
        return jsonify({
            'message': 'Logado!',
            'username': user.username
        }), 200
    
    return jsonify({'message': 'Credenciais inválidas'}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({'message': 'Usuário já existe.'}), 409
    hashed = bcrypt.generate_password_hash(data.get('password')).decode('utf-8')
    db.session.add(User(username=data.get('username'), password=hashed))
    db.session.commit()
    return jsonify({'message': 'Criado!'}), 201

@app.route("/logout")
@login_required
def logout():
    logout_user() # <--- ISSO AQUI QUE MATA O COOKIE
    return redirect(url_for('home'))

@app.route('/api/update_avatar', methods=['POST'])
@login_required
def update_avatar():
    data = request.get_json()
    novo_index = data.get('avatar_index')
    
    # Validação simples
    if novo_index is not None and 0 <= int(novo_index) <= 20:
        current_user.avatar_index = int(novo_index)
        db.session.commit()
        return jsonify({'message': 'Avatar atualizado!'}), 200
    
    return jsonify({'message': 'Avatar inválido'}), 400

# ROTA 1: USADA PELO BOTÃO "GERAR COM IA"
@app.route('/api/gerar_imagem', methods=['POST'])
# @login_required  <-- Deixe comentado se estiver testando sem login
def gerar_imagem_ia():
    data = request.get_json()
    titulo = data.get('title')

    # 1. Gera na IA (Hugging Face)
    # Isso leva uns 3 a 5 segundos
    img_bytes = gerar_bytes_huggingface(titulo)

    if not img_bytes:
        return jsonify({'message': 'Erro na geração da IA'}), 500

    # 2. TRUQUE DE VELOCIDADE:
    # Em vez de subir pro ImgBB agora, nós transformamos a imagem em texto (Base64)
    # e mandamos direto pro navegador. É instantâneo.
    b64_string = base64.b64encode(img_bytes).decode('utf-8')
    
    # Formato que o navegador entende para exibir na tag <img>
    imagem_para_tela = f"data:image/jpeg;base64,{b64_string}"

    # Retorna para o Javascript mostrar o preview
    return jsonify({'imagem_url': imagem_para_tela}), 200

# ROTA 2: USADA PELO BOTÃO "PUBLICAR RECEITA"
@app.route('/api/criar_receita', methods=['POST'])
@login_required
def create_recipe():
    data = request.get_json()
    
    title = data.get('title')
    ingredients = data.get('ingredients')
    instructions = data.get('instructions')
    image_input = data.get('image_url') # Pode ser URL ou Base64

    if not title or not image_input:
        return jsonify({'message': 'Dados incompletos!'}), 400

    final_url = ""

    # CENÁRIO 1: O usuário fez Upload Manual (Vem como 'data:image/jpeg;base64,...')
    if image_input.startswith('data:'):
        try:
            # Remove o cabeçalho "data:image/png;base64," para pegar só o código
            # Usa Regex para garantir que pega qualquer tipo (png, jpeg, webp)
            base64_clean = re.sub(r'^data:image/.+;base64,', '', image_input)
            
            # Manda pro ImgBB avisando que é string Base64
            final_url = upload_to_imgbb(base64_clean, is_base64_string=True)
        except Exception as e:
            print(e)
            return jsonify({'message': 'Erro ao processar upload de imagem'}), 500

    # CENÁRIO 2: O usuário usou a IA (Já vem como 'https://i.ibb.co/...')
    else:
        final_url = image_input

    if not final_url:
        return jsonify({'message': 'Falha ao processar a imagem.'}), 500

    # Salva no banco
    new_recipe = Recipe(
        title=title,
        ingredients=ingredients,
        instructions=instructions,
        image_url=final_url,
        author=current_user
    )

    db.session.add(new_recipe)
    db.session.commit()

    return jsonify({'message': 'Receita criada!'}), 201

# --- NOVA ROTA PARA API EXTERNA ---
@app.route('/receita/<id>')
def receita_externa(id):
    # URL da API
    url = f"https://www.themealdb.com/api/json/v1/1/lookup.php?i={id}"
    
    try:
        response = requests.get(url, timeout=5)
        data = response.json()
    except requests.exceptions.RequestException:
        return "Erro de conexão com a API.", 503

    if not data or not data.get('meals'):
        return "Receita não encontrada.", 404
    
    # Pega os dados brutos da API
    dados_api = data['meals'][0]

    # --- O TRUQUE DA ADAPTAÇÃO ---
    
    # 1. Vamos formatar os ingredientes (A API manda 20 campos separados, nós queremos um texto só)
    lista_ingredientes = []
    for i in range(1, 21):
        ingrediente = dados_api.get(f'strIngredient{i}')
        medida = dados_api.get(f'strMeasure{i}')
        
        # Se o ingrediente existir e não for vazio
        if ingrediente and ingrediente.strip():
            texto_formatado = f"{medida} {ingrediente}" if medida else ingrediente
            lista_ingredientes.append(texto_formatado)
            
    # Junta tudo com quebra de linha para ficar igual ao seu banco
    ingredientes_texto = "\n".join(lista_ingredientes)

    # 2. Criar um objeto/dicionário que imita sua classe Recipe
    receita_adaptada = {
        'title': dados_api['strMeal'],           # Converte strMeal -> title
        'image_url': dados_api['strMealThumb'],  # Converte strMealThumb -> image_url
        'instructions': dados_api['strInstructions'], # Converte strInstructions -> instructions
        'ingredients': ingredientes_texto,       # Usa nossa lista tratada
        'author': {'username': 'TheMealDB API'}  # Cria um autor falso para não dar erro no HTML
    }

    # Agora o HTML vai receber exatamente o que espera
    return render_template('pagina_receita.html', receita=receita_adaptada)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)