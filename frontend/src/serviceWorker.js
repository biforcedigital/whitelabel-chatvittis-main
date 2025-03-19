export function register() {
  console.log("Registrando service worker", navigator);
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      const urlVersion = `${process.env.PUBLIC_URL}/version.json`;
      console.log("swUrl", swUrl);
       // Verificação periódica a cada 5 segundos
       setInterval(() => checkForUpdate(urlVersion), 5000);
      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('Service worker registrado com sucesso!', registration);
        })
        .catch((error) => {
          console.error('Erro durante o registro do service worker:', error);
        });
    });
  }
}

// Função para verificar atualizações de versão
function checkForUpdate(urlVersion) {
  fetch(urlVersion)
    .then((response) => response.json())
    .then((data) => {
      

      const currentVersion = window.localStorage.getItem("version-app");

      if(!currentVersion) {
        window.localStorage.setItem("version-app", data.version);
        return
      }
      if (data.version !== currentVersion) {
        // Salva a nova versão no localStorage
        window.localStorage.setItem("version-app", data.version);

        // Mostra mensagem para o usuário
        showUpdateNotification(() => {
          // Desregistra o Service Worker, limpa dados e recarrega a página
          unregister().then(() => clearAppDataAndReload());
        });
      }
    })
    .catch((error) => {
      console.error('Erro ao obter a versão do frontend:', error);
    });
}

// Função para exibir a notificação de atualização
function showUpdateNotification() {
  // Cria o container principal do popup
  const updateDiv = document.createElement('div');
  updateDiv.id = 'updatePopup';
  updateDiv.style.position = 'fixed';
  updateDiv.style.top = '0';
  updateDiv.style.left = '0';
  updateDiv.style.width = '100vw';
  updateDiv.style.height = '100vh';
  updateDiv.style.background = 'rgba(0, 0, 0, 0.6)';
  updateDiv.style.display = 'flex';
  updateDiv.style.alignItems = 'center';
  updateDiv.style.justifyContent = 'center';
  updateDiv.style.zIndex = '1000';

  // conteúdo do popup
  updateDiv.innerHTML = `
    <div style="
      background: linear-gradient(145deg, #ffffff, #f3f4f6);
      z-index: 9999999999999;
      padding: 30px;
      width: 350px;
      max-width: 90%;
      border-radius: 15px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      text-align: center;
      position: relative;
      animation: fadeIn 0.3s ease-out;
    ">
      <div style="width: 120px; height: auto; margin-bottom: 20px; display: inline-flex" >
      <?xml version="1.0" encoding="UTF-8"?>
        <svg version="1.1" viewBox="0 0 2048 215" width="1538" height="162" xmlns="http://www.w3.org/2000/svg">
        <path transform="translate(602,28)" d="m0 0h18l17 3 13 5 14 8 10 9 9 10 8 14 5 14v2h-39l-8-13-9-8-11-5-8-2h-18l-13 4-10 7-8 9-5 11-2 8v19l3 12 6 11 5 6 11 7 12 4h19l13-4 10-6 7-7 6-11 1-2h39l-2 10-5 12-6 10-10 12-12 9-16 8-13 4-14 2h-18l-20-4-14-6-13-9-11-11-7-11-6-13-4-16-1-8v-17l3-17 5-13 7-13 12-13 9-7 10-6 18-6z" fill="#024644"/>
        <path transform="translate(737,22)" d="m0 0h36l1 4v50l-1 5 7-4 10-5 17-3 15 1 10 3 11 6 8 8 5 8 4 11 2 13v77l-1 1h-35l-1-71-2-11-5-8-8-5-4-1h-10l-9 3-7 6-4 8-2 13v65l-1 1h-35l-1-1z" fill="#024644"/>
        <path transform="translate(1180,31)" d="m0 0h39l4 8 16 43 19 50 3 8 2-3 16-42 23-61 2-3h39l-1 6-21 55-38 98-3 7h-37l-5-11-16-42-38-98-5-14z" fill="#30105D"/>
        <path transform="translate(118,82)" d="m0 0h297l10 4 7 8 3 7v11l-4 9-7 7-7 3-193 1h-65l-42-1-10-5-6-8-2-4v-14l4-8 7-7zm11 16-9 1-4 3-1 7 4 5 2 1h292l5-5v-7l-4-4z" fill="#07817F"/>
        <path transform="translate(962,69)" d="m0 0 17 1 13 3 12 6 10 9 6 9 4 11 1 6v83h-27l-3-10v-4l-13 9-13 5-11 2h-17l-14-3-10-5-7-6-6-10-2-8v-14l4-11 7-9 11-7 12-3h53v-7l-3-10-6-5-8-3h-13l-8 3-4 2-4 8h-35l2-9 5-10 9-10 9-6 13-5zm-10 76-9 3-5 6v10l5 6 7 3h16l10-4 7-5 5-8 2-11z" fill="#024644"/>
        <path transform="translate(1836,69)" d="m0 0 17 1 13 3 11 6 7 6 6 10 3 10v5h-34l-4-8-5-4-13-2-9 2-5 4-1 7 3 5 12 5 28 7 16 8 7 6 5 8 2 6v16l-4 9-6 8-9 6-10 4-17 3h-16l-16-3-12-5-9-7-7-9-4-11v-8h35l4 9v2l5 2 6 2h14l8-4 2-5-1-6-5-5-11-4-26-6-12-5-9-7-6-8-3-11v-9l3-10 6-9 9-7 10-4 10-2z" fill="#2F0F5C"/>
        <path transform="translate(1604,41)" d="m0 0h28v32h34v29h-34l1 49 3 8 6 4 3 1 23 2v30l-1 1h-27l-13-2-12-5-8-7-5-6-5-12-1-5v-58h-24l-1-29 17-1 7-2 4-5 3-14z" fill="#2E0F5C"/>
        <path transform="translate(1480,41)" d="m0 0h28v32h35v28l-1 1h-34l1 45 2 9 5 6 5 2 23 2v31h-28l-16-3-12-6-7-7-7-14-2-12v-53h-24v-29l17-1 8-3 3-5z" fill="#2F0F5C"/>
        <path transform="translate(1090,41)" d="m0 0h28v32h35v28l-1 1h-34l1 45 2 9 5 6 5 2 23 2v31h-27l-14-2-12-5-10-9-7-14-2-11v-54h-24v-29l17-1 8-3 3-5z" fill="#024644"/>
        <path transform="translate(120,24)" d="m0 0h141l8 4 7 8 2 10-2 9-6 8-7 4-4 1h-137l-8-3-5-5-4-6-1-3v-11l4-8 7-6zm4 16-3 3 1 7 2 1h134l3-4-1-5-3-2z" fill="#310F5C"/>
        <path transform="translate(297,146)" d="m0 0h119l9 4 8 9 2 6v11l-5 10-7 6-7 3h-119l-8-3-5-4-5-8-1-3v-13l4-8 5-5 6-4zm7 16-7 2-3 5 1 6 3 3 3 1h110l6-3 1-2v-7l-4-4-17-1z" fill="#31125E"/>
        <path transform="translate(122,146)" d="m0 0h118l8 4 7 8 2 5v14l-4 8-8 7-9 3h-111l-9-3-8-7-4-9v-12l5-10 8-6zm4 16-5 4v8l4 4 61 1 50-1 4-4 1-6-4-5-2-1z" fill="#B31B72"/>
        <path transform="translate(309,20)" d="m0 0h108l10 5 5 6 3 7v11l-5 10-7 6-5 2h-110l-6-3-6-5-4-8-1-3v-8l3-9 5-6zm4 16-5 5 1 7 4 3h100l5-4v-7l-5-4z" fill="#B2176F"/>
        <path transform="translate(1376,73)" d="m0 0h37v123l-1 1h-35l-1-1z" fill="#350F5D"/>
        <path transform="translate(1708,73)" d="m0 0h37v123l-1 1h-35l-1-1z" fill="#351560"/>
        <path transform="translate(1723,10)" d="m0 0h7l9 3 7 6 4 10v7l-3 9-7 7-8 3h-11l-8-3-5-4-4-7-1-4v-9l3-8 7-7z" fill="#300F5C"/>
        <path transform="translate(1391,10)" d="m0 0h7l9 3 8 7 3 8v9l-3 8-4 5-8 4-3 1h-11l-8-3-7-7-3-9v-7l3-8 6-7 6-3z" fill="#300F5C"/>
        </svg>
      </div>
      <h2 style="font-size: 22px; font-weight: bold; color: #171717; margin-bottom: 10px;">Atualização necessária!</h2>
      <p style="font-size: 16px; color: #666; line-height: 1.5; margin-bottom: 20px;">
        Adicionamos novos recursos e corrigimos bugs para tornar sua experiência ainda melhor.
      </p>
      <button id="updateButton" style="
        background: #08c2c2;
        color: white;
        font-size: 16px;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.3s, box-shadow 0.3s;
        box-shadow: 0 5px 15px rgba(90, 95, 237, 0.4);
      ">
        Atualizar Sistema
      </button>
    </div>
  `;

  // Adiciona o popup ao corpo da página
  document.body.appendChild(updateDiv);

  // Animação CSS para o popup
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    #updateButton:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(90, 95, 237, 0.5);
    }
  `;
  document.head.appendChild(style);

  // Adiciona o evento de clique ao botão para confirmar a atualização
  document.getElementById('updateButton').onclick = confirmUpdate;
}

// Função para confirmar atualização e fechar o popup
function confirmUpdate() {
  document.getElementById('updatePopup').remove();
  unregister().then(() => clearAppDataAndReload());
}
// Função para limpar todos os dados e recarregar a página
function clearAppDataAndReload() {

  clearCookies();

  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      caches.delete(cacheName);
    });
  });

  // Recarrega a página
  window.location.reload();
}

// Função para limpar todos os cookies
function clearCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}

// Função para desregistrar o Service Worker
export function unregister() {
  return new Promise((resolve, reject) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.unregister().then(resolve).catch(reject);
        })
        .catch((error) => {
          console.error('Erro durante o desregistro do service worker:', error);
          reject(error);
        });
    } else {
      resolve();
    }
  });
}
