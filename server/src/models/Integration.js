const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
    required: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  scopes: [{ type: String }],
  encryptedTokens: {
    accessToken: { type: String },
    refreshToken: { type: String },
    botToken: { type: String },
    apiKey: { type: String }
  },
  expiresAt: {
    type: Date
  }
}, { timestamps: true });

// Ensure one provider per user
integrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Integration', integrationSchema);
