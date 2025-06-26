let quizData = [];
let currentQuestion = 0;
let score = 0;
let startTime;
let timerInterval;

const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const nextBtn = document.getElementById('nextBtn');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const fileSelection = document.getElementById('file-selection');

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    timerEl.textContent = `Tempo: ${minutes}:${seconds}`;
  }, 1000);
}

function showQuestion() {
  feedbackEl.textContent = '';
  const current = quizData[currentQuestion];
  questionEl.textContent = `Pergunta ${currentQuestion + 1}: ${current.term}`;
  optionsEl.innerHTML = '';

  const options = shuffleArray([current.definition, ...generateWrongAnswers(current.definition)]);
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.classList.add('option-btn');
    btn.onclick = () => checkAnswer(option, current.definition);
    optionsEl.appendChild(btn);
  });
}

function checkAnswer(selected, correct) {
  if (selected === correct) {
    score++;
    feedbackEl.textContent = '✅ Correto!';
  } else {
    feedbackEl.textContent = `❌ Errado. Resposta certa: ${correct}`;
  }
  scoreEl.textContent = `Pontuação: ${score}`;
  nextBtn.disabled = false;
}

function nextQuestion() {
  currentQuestion++;
  nextBtn.disabled = true;
  if (currentQuestion < quizData.length) {
    showQuestion();
  } else {
    clearInterval(timerInterval);
    questionEl.textContent = 'Quiz finalizado!';
    optionsEl.innerHTML = '';
    nextBtn.style.display = 'none';
    feedbackEl.textContent = `Você acertou ${score} de ${quizData.length} perguntas.`;
  }
}

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function generateWrongAnswers(correct) {
  const others = quizData
    .map(q => q.definition)
    .filter(def => def !== correct);
  return shuffleArray(others).slice(0, 3);
}

restartBtn.addEventListener('click', () => {
  location.reload();
});

nextBtn.addEventListener('click', nextQuestion);

// --- DETECTAR SE HÁ gameId ---
(async function carregarJogo() {
  const gameId = new URLSearchParams(window.location.search).get('gameId');
  if (!gameId) {
    questionEl.textContent = 'Erro: jogo não especificado.';
    return;
  }

  // Esconde a seleção de arquivos, porque é jogo personalizado
  fileSelection.style.display = 'none';

  try {
    const res = await fetch(`/games/${gameId}`);
    if (!res.ok) throw new Error('Erro ao buscar jogo');
    const jogo = await res.json();

    if (!jogo.data || jogo.data.length === 0) {
      questionEl.textContent = 'Este jogo não tem perguntas.';
      return;
    }

    quizData = shuffleArray(jogo.data);
    showQuestion();
    startTimer();
  } catch (err) {
    console.error(err);
    questionEl.textContent = 'Erro ao carregar jogo.';
  }
})();
