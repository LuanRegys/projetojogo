require('dotenv').config();
const mongoose = require('mongoose');

console.log('Tentando conectar ao MongoDB...');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado ao MongoDB');
  process.exit(0);
})
.catch((err) => {
  console.error('❌ Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Timeout: não conseguiu conectar ao MongoDB em 10 segundos');
  process.exit(1);
}, 10000);
