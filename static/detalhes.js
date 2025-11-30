// =======================================================
// ARQUIVO: detalhes.js (ou detalhe.js)
// (Substitua tudo no seu arquivo por este código)
// =======================================================

// Espera o HTML carregar 100% antes de rodar qualquer JS
document.addEventListener('DOMContentLoaded', function() {
  
  // --- PASSO 1: PEGAR O ID DA URL ---
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  let recipeId = urlParams.get('id');

  // Se não tiver ID, pare o script
  if (!recipeId) {
    console.error('Nenhum ID de receita encontrado na URL');
    document.getElementById('recipe-title').innerHTML = "Receita não encontrada (sem ID)";
    return;
  }

  // --- PASSO 2: CHAMAR A API COM ESSE ID ---
  fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`)
    .then(resposta => {
        // Se a resposta da rede falhar (ex: 404, 500)
        if (!resposta.ok) {
           throw new Error('Erro de rede ao buscar receita');
        }
        return resposta.json();
    })
    .then(dados => {
      
      // Se a API não achar a receita (ex: ID não existe)
      if (!dados.meals) {
        console.error('API não retornou receitas para este ID:', recipeId);
        document.getElementById('recipe-title').innerHTML = "Receita não encontrada";
        return;
      }
      
      
      // Se tudo deu certo, pegue a receita
      let receita = dados.meals[0];
      
      document.getElementById('titulo').innerHTML = `${receita.strMeal} - Umai`;

      // --- PASSO 3: PREENCHER A PÁGINA ---
      document.getElementById('recipe-title').innerHTML = receita.strMeal;
      document.getElementById('recipe-image').src = receita.strMealThumb;
      document.getElementById('recipe-image').alt = receita.strMeal;
      document.getElementById('recipe-instructions').innerText = receita.strInstructions;
      
      // --- PASSO 4: PREENCHER OS INGREDIENTES (O LOOP) ---
      let listaDeIngredientes = document.getElementById('recipe-ingredients');
      listaDeIngredientes.innerHTML = ''; // Limpa a lista para garantir

      for (let i = 1; i <= 20; i++) {
        let ingrediente = receita['strIngredient' + i];
        let medida = receita['strMeasure' + i];
        
        // Se o ingrediente existir (não for nulo ou "")
        if (ingrediente && ingrediente.trim() !== '') {
          let itemDaLista = document.createElement('li');
          itemDaLista.classList.add('list-group-item'); 
          itemDaLista.innerHTML = `${medida} - ${ingrediente}`;
          listaDeIngredientes.appendChild(itemDaLista);
        }
      }
      
    })
    .catch(error => {
      // *** AGORA NÓS VAMOS VER QUALQUER ERRO ***
      console.error("ERRO GRAVE no fetch:", error);
      document.getElementById('recipe-title').innerHTML = "Erro ao carregar a receita.";
    });


  // --- CÓDIGO DO MODAL (para pagina_receita.html) ---
  const imageModal = document.getElementById('recipePageModal');
  const modalImageContent = document.getElementById('modal-page-image-content');
  const modalTitle = document.getElementById('recipePageModalLabel');
  
  const mainRecipeImage = document.getElementById('recipe-image');
  const mainRecipeTitle = document.getElementById('recipe-title');

  // Ouve o evento de "abrir" do modal
  imageModal.addEventListener('show.bs.modal', event => {
    // Pega os dados que já estão na página
    const imageUrl = mainRecipeImage.src;
    const imageTitle = mainRecipeTitle.innerHTML;

    // Injeta eles no modal
    modalImageContent.src = imageUrl;
    modalTitle.innerHTML = imageTitle;
  });

});