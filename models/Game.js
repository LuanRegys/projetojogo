// models/Game.js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  data:    { type: Array,  required: true },
  type:    { type: String, required: true },
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  public:  { type: Boolean, default: false }
});

module.exports = mongoose.model('Game', gameSchema);
