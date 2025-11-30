document.addEventListener('DOMContentLoaded', function() {

  // =======================================================
  // 1. LÓGICA DE RECEITAS
  // =======================================================
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const recipeContainer = document.getElementById('recipe-container');
  const loadMoreBtn = document.getElementById('load-more-btn');

  if (searchForm) {
      searchForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        const searchTerm = searchInput.value.trim();

        if(loadMoreBtn) loadMoreBtn.style.display = 'none';

        if (searchTerm === '') {
          if(loadMoreBtn) loadMoreBtn.style.display = 'block';
          carregarNoveReceitas(true); 
        } else {
          searchRecipes(searchTerm);
        }
      });

      if (loadMoreBtn) {
          loadMoreBtn.addEventListener('click', function() {
            loadMoreBtn.innerHTML = 'Loading...';
            loadMoreBtn.disabled = true;
            carregarNoveReceitas(false); 
          });
          carregarNoveReceitas(true);
      }
  }

  // --- Funções Auxiliares ---
  function searchRecipes(term) {
    recipeContainer.innerHTML = '<div class="col-12 text-center"><h3 class="text-light">Buscando...</h3></div>';
    fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${term}`)
      .then(r => r.json())
      .then(d => {
         recipeContainer.innerHTML = '';
         if(!d.meals) {
             recipeContainer.innerHTML = '<div class="col-12 text-center"><h3 class="text-light">Nada encontrado.</h3></div>';
             return;
         }
         d.meals.forEach(r => recipeContainer.innerHTML += createCardHTML(r));
      });
  }

  function carregarNoveReceitas(clear) {
     if(clear) recipeContainer.innerHTML = '';
     let promises = [];
     for(let i=0; i<9; i++) {
         promises.push(fetch('https://www.themealdb.com/api/json/v1/1/random.php').then(r => r.json()));
     }
     Promise.all(promises).then(res => {
         if(clear) recipeContainer.innerHTML = '';
         res.forEach(d => {
             recipeContainer.innerHTML += createCardHTML(d.meals[0]);
         });
         if(loadMoreBtn) {
             loadMoreBtn.innerHTML = 'Show more';
             loadMoreBtn.disabled = false;
         }
     });
  }

function createCardHTML(receita) {
    // Certifique-se que o card inteiro seja clicável
    return `
      <div class="col">
        <div class="card shadow-sm h-100">
          
          <a href="/receita/${receita.idMeal}" target="_blank" class="text-decoration-none">
            
            <div style="overflow: hidden; height: 220px;">
                <img src="${receita.strMealThumb}" class="card-img-top w-100 h-100" style="object-fit: cover;" alt="${receita.strMeal}">
            </div>
            
            <div class="card-body">
              <h5 class="card-title fw-bold text-warning">${receita.strMeal}</h5>
            </div>
            <div class="card-footer border-top border-secondary bg-transparent">
              <small class="text-white-50">API ID: ${receita.idMeal}</small>
            </div>
          
          </a>
        </div>
      </div>
    `;
}
  
  function configurarLinkPerfil() {
    // 1. Pega o usuário salvo (ex: "Hiro")
    localStorage.setItem('usuario_do_site_receitas', data.username);
    const usuario = localStorage.getItem('umai_user');
    
    // 2. Pega o elemento HTML do link
    const link = document.getElementById('userpage');

    if (usuario && link) {
        // 3. Monta a URL dinâmica usando crases (Template String)
        // Vai virar algo como: http://127.0.0.1:5000/user/Hiro
        link.href = `http://127.0.0.1:5000/user/${usuario}`;
        
        // Opcional: Mudar o texto do link também
        link.innerText = `${usuario}' Profile`; 
    }
}

const usuario = localStorage.getItem('umai_user');
const botaoContato = document.getElementById('userpage');

// Se tiver usuário logado, muda o link para /user/NomeDoUsuario
if (usuario && botaoContato) {
    botaoContato.href = `/user/${usuario}`;
}

// Chama essa função assim que a página carregar
document.addEventListener('DOMContentLoaded', configurarLinkPerfil);
  // =======================================================
  // 2. LÓGICA DE SIGN-UP (REGISTRO)
  // =======================================================
  const signupForm = document.getElementById('signup-form');

  if (signupForm) {
      signupForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        
        // IDs DO MODAL DE SIGN-UP
        const username = document.getElementById('floatingInput').value;
        const password = document.getElementById('floatingPassword').value;

        fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message); 
        })
        .catch(error => console.error('Erro:', error));
      });
  }


  // =======================================================
  // 3. LÓGICA DE LOG-IN (CORRIGIDA)
  // =======================================================
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
      loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        
        // *** AQUI ESTAVA O ERRO ***
        // Agora pegamos os IDs corretos do modal de LOGIN
        const usernameInput = document.getElementById('loginUsername'); 
        const passwordInput = document.getElementById('loginPassword');

        const username = usernameInput.value;
        const password = passwordInput.value;

        fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                // Se a senha estiver errada, lança erro para cair no catch
                return response.json().then(err => {throw new Error(err.message)});
            }
        })
        .then(data => {
            alert("Sucess: " + data.message);
            window.location.href = "/"; 
        })
        .catch(error => {
            console.error(error);
            alert("Error: " + error.message);
        });
      });
  }
});

