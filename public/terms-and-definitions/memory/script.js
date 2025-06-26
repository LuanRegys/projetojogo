let gameData = [];
let timeElapsed = 0;
let selectedCards = [];
let matchedCards = 0;
let totalMatches = 0;
let errors = 0;
let gameStarted = false;

const fileDropdown = document.getElementById("file-dropdown");
const gameBoard = document.getElementById("game-board");
const timerDisplay = document.getElementById("timer");
const feedbackDisplay = document.getElementById("feedback");
const restartBtn = document.getElementById("restart-btn");

const correctSound = new Audio("../sounds/bell.wav");
const wrongSound = new Audio("../sounds/caught.wav");
const flipSound = new Audio("../sounds/select.wav");
const endSound = new Audio('../sounds/win.wav');

// Função para carregar os dados do arquivo selecionado
function loadGameData(fileName) {
    fetch(fileName)
        .then(response => response.json())
        .then(data => {
            gameData = createUniquePairs(data);
            totalMatches = gameData.length;
            matchedCards = 0;
            errors = 0;
            gameStarted = false;
            timeElapsed = 0;
            timerDisplay.textContent = `00:00`;
            feedbackDisplay.textContent = '';
            createGameBoard();
        });
}

// Função para criar os pares únicos de termos e definições
function createUniquePairs(data) {
    const pairs = [];
    
    data.forEach(item => {
        // Criar um par único de termo e definição
        pairs.push({ term: item.term, definition: item.definition });
    });

    // Embaralhar os pares
    return shuffleData(pairs);
}

// Função para embaralhar os dados
function shuffleData(data) {
    return data.sort(() => Math.random() - 0.5);
}

// Função para criar o tabuleiro do jogo
function createGameBoard() {
    gameBoard.innerHTML = ''; // Limpar tabuleiro anterior
    const cards = [];

    // Criar cards de termos e definições
    gameData.forEach((item, index) => {
        // Card de Termo
        const cardTerm = createCard(item, "term", index);
        // Card de Definição
        const cardDefinition = createCard(item, "definition", index);

        cards.push(cardTerm);
        cards.push(cardDefinition);
    });

    // Embaralhar os cards e adicioná-los ao tabuleiro
    shuffleData(cards).forEach(card => gameBoard.appendChild(card));
}

// Função para criar um card
function createCard(item, type, index) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.index = index;
    card.dataset.type = type;
    card.dataset.term = item.term;
    card.dataset.definition = item.definition;
    card.textContent = type === "term" ? item.term : item.definition;
    card.addEventListener("click", onCardClick);
    return card;
}

// Função para gerenciar o clique nas cartas
function onCardClick(event) {
    if (!gameStarted) {
        startGame();
    }

    const card = event.target;
    if (selectedCards.length < 2 && !card.classList.contains("selected") && !card.classList.contains("matched")) {
        flipSound.play();
        card.classList.add("selected");
        // card.textContent = card.dataset.content; // Mostrar o conteúdo da carta
        selectedCards.push(card);

        if (selectedCards.length === 2) {
            checkMatch();
        }
    }
}

// Função para verificar se as cartas selecionadas são um match
function checkMatch() {
    const [card1, card2] = selectedCards;
    if (card1.dataset.type !== card2.dataset.type && card1.dataset.term === card2.dataset.term) {
        correctSound.play();
        card1.classList.add("matched");
        card2.classList.add("matched");
        matchedCards++;
    } else {
        wrongSound.play();
        errors++;
        setTimeout(() => {
            card1.classList.remove("selected");
            card2.classList.remove("selected");
            // card1.textContent = '';
            // card2.textContent = '';
        }, 1000);
    }

    selectedCards = [];
    updateFeedback();
    if (matchedCards === totalMatches) {
        endGame();
        alert(`Parabéns! Você terminou o jogo! Acertos: ${matchedCards} | Erros: ${errors}`);
    }
}

// Função para atualizar o feedback de acertos e erros
function updateFeedback() {
    feedbackDisplay.textContent = `Acertos: ${matchedCards} | Erros: ${errors}`;
}

// Função para iniciar o cronômetro
function startGame() {
    gameStarted = true;
    startTimer(timerDisplay);
}

// Função para finalizar o jogo
function endGame() {
    resetTimer();
    // Tocar som de fim de jogo
    endSound.play();
    feedbackDisplay.textContent += ` | Tempo final: ${timerDisplay.textContent}`;
    
}

// Função para reiniciar o jogo
function restartGame() {
    selectedCards = [];
    matchedCards = 0;
    errors = 0;
    gameStarted = false;
    timerDisplay.textContent = `00:00`;
    resetTimer();
    feedbackDisplay.textContent = '';
    loadGameData(fileDropdown.value);
}

// Evento para carregar o arquivo selecionado
fileDropdown.addEventListener("change", () => {
    if (fileDropdown.value) {
        loadGameData(fileDropdown.value);
    }
});

// Evento de reiniciar o jogo
restartBtn.addEventListener("click", restartGame);

// Carregar a lista de arquivos ao carregar a página
window.onload = loadFileList(fileDropdown);
// Função para pegar parâmetro da URL
function getGameIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('gameId');
}

async function carregarDadosDoJogo() {
  const gameId = getGameIdFromUrl();
  if (!gameId) {
    alert('ID do jogo não informado.');
    return;
  }

  try {
    const res = await fetch(`/games/${gameId}`);
    if (!res.ok) throw new Error('Jogo não encontrado');
    const game = await res.json();

    // game.data deve conter os pares {term, definition}
    iniciarJogoComDados(game.data);
  } catch (err) {
    alert('Erro ao carregar o jogo: ' + err.message);
  }
}

// Exemplo da função que monta o jogo usando os dados recebidos
function iniciarJogoComDados(pares) {
  // Aqui você adapta seu código para montar o tabuleiro do jogo com os pares
  // Por exemplo, definir a variável global que seu jogo usa para os pares
  gameData = pares;

  // O resto do código que cria o tabuleiro, etc.
  createGameBoard();
}

// No carregamento da página, chama essa função:
window.onload = carregarDadosDoJogo;

