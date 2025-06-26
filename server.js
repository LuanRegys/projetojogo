require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

const User = require('./models/User');  // Confirme o caminho e nome do model
const Game = require('./models/game');  // Confirme o caminho e nome do model

const app = express();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// Configurar sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo-super-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 dia
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para verificar autenticação (se quiser proteger rotas)
function checkAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'Não autenticado' });
}

// Rotas de autenticação

app.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).send('Usuário e senha são obrigatórios');

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).send('Usuário já existe');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role: role || 'player' });
    await user.save();

    res.send('Cadastro realizado com sucesso.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send('Usuário não encontrado.');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send('Senha incorreta.');

    req.session.user = { _id: user._id, username: user.username, role: user.role };
    res.send('Login efetuado com sucesso.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.send('Logout efetuado.');
});

app.get('/me', checkAuth, (req, res) => {
  res.json(req.session.user);
});

// Rotas de jogos

// Criar novo jogo - precisa estar logado
app.post('/games', checkAuth, async (req, res) => {
  try {
    const { title, data, type } = req.body;
    if (!title || !data || !type) return res.status(400).send('Campos obrigatórios');

    const game = new Game({ title, data, type, userId: req.session.user._id, public: false });
    await game.save();

    res.send('Jogo criado com sucesso');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
});

// Listar jogos do usuário logado (privado)
app.get('/games', checkAuth, async (req, res) => {
  try {
    const games = await Game.find({ userId: req.session.user._id });
    res.json(games);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
});

// Listar jogos públicos para frontend jogar
app.get('/public-games', async (req, res) => {
  try {
    const games = await Game.find({ public: true }, '_id title type');
    res.json(games);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao listar jogos públicos');
  }
});

// Buscar jogo público por id para jogar
app.get('/public-games/:id', async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, public: true });
    if (!game) return res.status(404).send('Jogo não encontrado ou não está público.');
    res.json(game);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar jogo');
  }
});

// Tornar jogo público (só dono)
app.post('/games/:id/public', checkAuth, async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, userId: req.session.user._id });
    if (!game) return res.status(404).send('Jogo não encontrado');

    game.public = true;
    await game.save();

    res.send('Jogo agora é público. Compartilhe o link!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
