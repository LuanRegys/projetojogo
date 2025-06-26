const fileDropdown = document.getElementById("file-dropdown");
const definitionsContainer = document.getElementById('definitions');
const termsContainer = document.getElementById('terms');
const timerDisplay = document.getElementById('timer');
const feedbackDisplay = document.getElementById("feedback");
const restartBtn = document.getElementById("restart-btn");

const titleInput = document.getElementById('title');
const pairsContainer = document.getElementById('pairs');
const resultDiv = document.getElementById('result');

const correctSound = new Audio('../sounds/bell.wav');
const wrongSound = new Audio('../sounds/caught.wav');
const endSound = new Audio('../sounds/win.wav');

let correctMatches = 0;
let wrongMatches = 0;
let timerInterval;
let startTime;

// --- Função para adicionar novo par termo-definição no painel de criação ---
function addPair() {
  const div = document.createElement('div');
  div.innerHTML = `
    <input type="text" class="term" placeholder="Termo" />
    <input type="text" class="definition" placeholder="Definição" />
  `;
  pairsContainer.appendChild(div);
}

// --- Função para salvar o jogo no backend ---
async function salvarJogo() {
  const title = titleInput.value.trim();
  const terms = document.querySelectorAll('.term');
  const definitions = document.querySelectorAll('.definition');
  const data = [];

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i].value.trim();
    const def = definitions[i].value.trim();
    if (term && def) {
      data.push({ term, definition: def });
    }
  }

  if (!title) {
    alert('Por favor, preencha o título do jogo.');
    return;
  }
  if (data.length === 0) {
    alert('Adicione ao menos um par termo-definição.');
    return;
  }

  try {
    const res = await fetch('/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type: 'associacao', data })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    resultDiv.textContent = 'Jogo salvo com sucesso!';
    // Limpar inputs para nova criação
    titleInput.value = '';
    pairsContainer.innerHTML = `
      <div>
        <input type="text" class="term" placeholder="Termo" />
        <input type="text" class="definition" placeholder="Definição" />
      </div>
    `;
    loadPublicGames();

  } catch (err) {
    alert('Erro ao salvar o jogo: ' + err.message);
  }
}

// --- Função para buscar jogos públicos e popular dropdown ---
async function loadPublicGames() {
  try {
    const res = await fetch('/games');
    if (!res.ok) throw new Error('Erro ao carregar jogos');

    const games = await res.json();

    fileDropdown.innerHTML = `<option value="">Selecione um jogo...</option>`;
    games.forEach(game => {
      if(game.type === 'associacao') { // só exibe jogos do tipo associação
        const option = document.createElement('option');
        option.value = game._id;
        option.textContent = game.title;
        fileDropdown.appendChild(option);
      }
    });

    // Limpar campo de jogo ao recarregar
    clearGame();
  } catch (err) {
    console.error(err);
  }
}

// --- Função para carregar dados de um jogo pelo ID ---
async function loadGameData(gameId) {
  try {
    const res = await fetch(`/games/${gameId}`);
    if (!res.ok) throw new Error('Jogo não encontrado');
    const game = await res.json();

    correctMatches = 0;
    wrongMatches = 0;
    feedbackDisplay.textContent = '';
    resetTimer();

    renderDefinitionsAndTerms(game.data);
    startTimer();
  } catch (err) {
    alert(err.message);
  }
}

// --- Função para embaralhar arrays ---
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// --- Renderizar termos e definições para o jogo ---
function renderDefinitionsAndTerms(data) {
  // Mapeia pares termo-definição com IDs
  const termsWithDefinitions = data.map((item, index) => ({
    term: item.term,
    definition: item.definition,
    id: index
  }));

  // Embaralha termos e definições separadamente
  const shuffledTerms = shuffleArray(termsWithDefinitions.map(item => item.term));
  const shuffledDefinitions = shuffleArray(termsWithDefinitions.map(item => item.definition));

  definitionsContainer.innerHTML = '';
  termsContainer.innerHTML = '';

  // Renderiza definições
  shuffledDefinitions.forEach((definition, index) => {
    const div = document.createElement('div');
    div.classList.add('definition');
    div.id = `definition-${index}`;
    div.textContent = definition;
    definitionsContainer.appendChild(div);
  });

  // Renderiza termos
  shuffledTerms.forEach((term, index) => {
    const div = document.createElement('div');
    div.classList.add('term');
    div.setAttribute('draggable', 'true');
    div.id = `term-${index}`;

    // Vincula o id da definição correta a cada termo
    const correctDefinition = termsWithDefinitions.find(item => item.term === term).definition;
    div.dataset.correctDefinition = `definition-${shuffledDefinitions.indexOf(correctDefinition)}`;

    div.textContent = term;
    termsContainer.appendChild(div);
  });

  enableDragAndDrop();
}

// --- Habilitar drag and drop ---
function enableDragAndDrop() {
  const definitions = document.querySelectorAll('.definition');
  const terms = document.querySelectorAll('.term');

  terms.forEach(term => {
    term.addEventListener('dragstart', e => {
      e.target.classList.add('dragging');
      e.dataTransfer.setData('termId', e.target.id);
    });
    term.addEventListener('dragend', e => {
      e.target.classList.remove('dragging');
    });
  });

  definitions.forEach(definition => {
    definition.addEventListener('dragover', e => e.preventDefault());

    definition.addEventListener('drop', e => {
      e.preventDefault();
      const termId = e.dataTransfer.getData('termId');
      const term = document.getElementById(termId);

      if (term.dataset.correctDefinition === definition.id) {
        correctMatches++;
        definition.appendChild(term);
        term.setAttribute('draggable', 'false');
        term.style.backgroundColor = '#4CAF50';
        definition.classList.add('correct');
        correctSound.play();
      } else {
        wrongMatches++;
        term.style.backgroundColor = '#f44336';
        definition.classList.add('wrong');
        wrongSound.play();
      }

      updateFeedback();

      if (correctMatches === terms.length) {
        endGame();
        alert(`Parabéns! Você terminou o jogo! Acertos: ${correctMatches} | Erros: ${wrongMatches}`);
      }
    });
  });
}

// --- Atualiza o feedback ---
function updateFeedback() {
  feedbackDisplay.textContent = `Acertos: ${correctMatches} | Erros: ${wrongMatches}`;
}

// --- Timer ---
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerDisplay.textContent = "00:00";
}

// --- Finaliza o jogo ---
function endGame() {
  resetTimer();
  endSound.play();
  feedbackDisplay.textContent += ` | Tempo final: ${timerDisplay.textContent}`;
}

// --- Reiniciar o jogo ---
function restartGame() {
  if (fileDropdown.value) {
    loadGameData(fileDropdown.value);
    feedbackDisplay.textContent = '';
    correctMatches = 0;
    wrongMatches = 0;
  } else {
    clearGame();
  }
}

function clearGame() {
  definitionsContainer.innerHTML = '';
  termsContainer.innerHTML = '';
  feedbackDisplay.textContent = '';
  resetTimer();
  correctMatches = 0;
  wrongMatches = 0;
}

// --- Eventos ---
restartBtn.addEventListener('click', restartGame);

fileDropdown.addEventListener('change', () => {
  if (fileDropdown.value) {
    loadGameData(fileDropdown.value);
  } else {
    clearGame();
  }
});

// Ao carregar a página, carregar jogos públicos
window.addEventListener('DOMContentLoaded', () => {
  loadPublicGames();
});
