document.addEventListener('DOMContentLoaded', () => {
      const user = localStorage.getItem('umai_user');
      if (user) {
          atualizarHeader(user);
      }
  });

  // 2. Função que troca os botões pelo nome
  function atualizarHeader(username) {
      const guestArea = document.getElementById('guest-area');
      const userArea = document.getElementById('user-area');
      const nameSpan = document.getElementById('user-name-span');

      if (username) {
          // Tem usuário: esconde botões, mostra nome
          guestArea.classList.add('d-none');
          guestArea.classList.remove('d-flex');
          
          userArea.classList.remove('d-none');
          userArea.classList.add('d-flex');
          
          nameSpan.innerText = username;
      } else {
          // Não tem usuário: mostra botões, esconde nome
          guestArea.classList.remove('d-none');
          guestArea.classList.add('d-flex');
          
          userArea.classList.add('d-none');
          userArea.classList.remove('d-flex');
      }
  }

  // 3. Intercepta o envio do formulário de Login (Para não recarregar a página)
  const loginForm = document.getElementById('login-form');
  
  loginForm.addEventListener('submit', async function(e) {
      e.preventDefault(); // Impede o formulário de recarregar a página

      const usernameInput = document.getElementById('loginUsername').value;
      const passwordInput = document.getElementById('loginPassword').value;

      try {
          const response = await fetch('/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: usernameInput, password: passwordInput })
          });

          const data = await response.json();

          if (response.ok) {
              // Sucesso!
              localStorage.setItem('umai_user', data.username); // Salva no navegador
              atualizarHeader(data.username); // Atualiza o topo
              
              // Fecha o Modal usando Bootstrap
              const modalEl = document.getElementById('modallogin');
              const modal = bootstrap.Modal.getInstance(modalEl);
              modal.hide();

          } else {
              alert(data.message); // Mostra "Senha incorreta" etc.
          }
      } catch (error) {
          console.error('Erro:', error);
          alert("Erro ao conectar com o servidor.");
      }
  });

  // 4. Função de Logout
  function fazerLogout() {
      localStorage.removeItem('umai_user');
      fetch('/logout')
        .then(() => {
            window.location.href= "/";
        });
      atualizarHeader(null); // Reseta o header
      // Opcional: window.location.reload(); // Se quiser recarregar a página
  }