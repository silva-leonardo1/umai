// ==========================================
// 1. PREVIEW DA IMAGEM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Lógica de Upload de Imagem ---
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    const placeholder = document.getElementById('placeholder-content');

    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                    placeholder.style.display = 'none';
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // --- Lógica dos Botões de Ingredientes ---
    atualizarEstadoBotoes();

    // --- Lógica de LOGIN (Corrigida) ---
    const formLoginModal = document.getElementById('login-form');
    if (formLoginModal) {
        formLoginModal.addEventListener('submit', async function(e) {
            e.preventDefault();

            const userField = document.getElementById('loginUsername').value;
            const passField = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: userField, password: passField })
                });

                if (response.ok) {
                    localStorage.setItem('umai_user', userField);
                    alert("Login successful! The page will reload.");
                    // RECARREGA A PÁGINA PARA O BOTÃO MUDAR PARA "MY ACCOUNT"
                    window.location.reload(); 
                } else {
                    alert("User or password incorrect.");
                }
            } catch (error) {
                console.error(error);
                alert("Connection error.");
            }
        });
    }

    // --- Lógica de ENVIO DA RECEITA ---
    const recipeForm = document.getElementById('recipe-form');
    if (recipeForm) {
        recipeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Tenta enviar. Se não estiver logado, o backend vai recusar ou 
            // podemos checar o localStorage, mas o ideal é tentar enviar.
            enviarReceitaParaBackend();
        });
    }
});

// ==========================================
// 2. FUNÇÕES GLOBAIS (Ingredientes e IA)
// ==========================================

const MAX_INGREDIENTES = 30;

function adicionarCampo() {
    const container = document.getElementById('ingredients-list');
    const totalAtual = document.querySelectorAll('.ingredient-row').length;

    if (totalAtual >= MAX_INGREDIENTES) {
        alert("Maximum ingredients reached! (Max 30)");
        return;
    }
    
    const div = document.createElement('div');
    div.className = 'd-flex gap-2 mb-2 ingredient-row';
    div.innerHTML = `
      <input type="text" class="form-control bg-dark text-white border-secondary ingredient-input" placeholder="Next ingredient...">
    `;
    
    container.appendChild(div);
    const novoInput = div.querySelector('input');
    novoInput.focus();
    atualizarEstadoBotoes();
}

window.removerCampo = function(botao) {
    const divPai = botao.parentElement;
    divPai.remove();
    atualizarEstadoBotoes();
}
// Torna global para o botão HTML acessar
window.adicionarCampo = adicionarCampo; 

function atualizarEstadoBotoes() {
    const linhas = document.querySelectorAll('.ingredient-row');
    const total = linhas.length;

    linhas.forEach((linha, index) => {
        const botoesAntigos = linha.querySelectorAll('button');
        botoesAntigos.forEach(btn => btn.remove());

        const btnPlus = `<button type="button" class="btn btn-success btn-add-step" onclick="adicionarCampo()">+</button>`;
        const btnX = `<button type="button" class="btn btn-outline-danger btn-add-step" onclick="removerCampo(this)">×</button>`;

        if (total === 1) {
            if (total < MAX_INGREDIENTES) linha.insertAdjacentHTML('beforeend', btnPlus);
        } else {
            if (index === total - 1) {
                if (total < MAX_INGREDIENTES) linha.insertAdjacentHTML('beforeend', btnPlus);
                linha.insertAdjacentHTML('beforeend', btnX);
            } else {
                linha.insertAdjacentHTML('beforeend', btnX);
            }
        }
    });
}

// ==========================================
// 3. FUNÇÕES DE ENVIO E IA
// ==========================================

async function gerarImagemIA() {
    const tituloInput = document.getElementById('titulo');
    const titulo = tituloInput.value;
    const btnIA = document.querySelector('button[onclick="gerarImagemIA()"]');
    const imagePreview = document.getElementById('image-preview');
    const placeholder = document.getElementById('placeholder-content');

    if (!titulo || titulo.length < 3) {
        alert("Type the dish title first. We need to know what to draw.");
        tituloInput.focus();
        return;
    }

    btnIA.innerText = "🎨 Generating image... (can take a while)";
    btnIA.disabled = true;

    try {
        const response = await fetch('/api/gerar_imagem', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ title: titulo })
        });

        // Verificação segura de JSON
        const textoResposta = await response.text();
        try {
            const data = JSON.parse(textoResposta);
            if (response.ok) {
                imagePreview.src = data.imagem_url;
                imagePreview.style.display = 'block';
                placeholder.style.display = 'none';
            } else {
                alert(data.message || "Error generating image");
            }
        } catch (e) {
            console.error("Erro ao ler JSON:", textoResposta);
            alert("Server error when generating image.");
        }

    } catch (error) {
        console.error(error);
        alert("Connection error.");
    } finally {
        btnIA.innerText = "✨ Generate AI image";
        btnIA.disabled = false;
    }
}

async function enviarReceitaParaBackend() {
    // 1. Ingredientes
    const inputsIngredientes = document.querySelectorAll('.ingredient-input');
    let listaIngredientes = [];
    inputsIngredientes.forEach(input => {
        const valor = input.value.trim();
        if (valor !== "") listaIngredientes.push(valor);
    });

    if (listaIngredientes.length === 0) {
        alert("Add at least one ingredient!");
        return;
    }

    const textoIngredientes = listaIngredientes.join('\n');

    // 2. Imagem
    const imagePreview = document.getElementById('image-preview');
    const imagemVisivel = imagePreview.style.display === 'block';
    const conteudoImagem = imagePreview.src;

    if (!imagemVisivel || !conteudoImagem) {
        alert("Error: Dish image is required! Upload or generate AI image.");
        return;
    }

    // 3. Monta Dados
    const dadosParaEnviar = {
        title: document.getElementById('titulo').value,
        ingredients: textoIngredientes,
        instructions: document.getElementById('instrucoes').value,
        image_url: conteudoImagem
    };

    // 4. Envia
    try {
        const response = await fetch('/api/criar_receita', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaEnviar)
        });
        
        const resultado = await response.json();

        if (response.ok) {
            alert("Recipe published successfully! 🥘");
            window.location.href = "/receitas";
        } else {
            // Se o erro for "Não autorizado" (401 ou 403), abre o modal de login
            if (response.status === 401 || response.status === 403) {
                const modalElement = document.getElementById('modallogin');
                const modalInstance = new bootstrap.Modal(modalElement);
                modalInstance.show();
                alert("Please log in to publish.");
            } else {
                alert("Error: " + resultado.message);
            }
        }
    } catch (error) {
        console.error(error);
        alert("Connection error.");
    }
}