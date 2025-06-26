require('dotenv').config();
const mongoose = require('mongoose');

console.log('🚀 test-model.js iniciado');
console.log('Usando MONGO_URI =', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Mongo conectado para teste de modelo');

    const User = require('./models/User');
    console.log('User.findOne é função?', typeof User.findOne === 'function');

    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar para teste de modelo:', err);
  });
