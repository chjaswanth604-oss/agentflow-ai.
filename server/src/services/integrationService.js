const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Integration = require('../models/Integration');
const env = require('../config/env');

const ALGORITHM = 'aes-256-cbc';

// Helper to normalize 32-byte key
const getSecretKey = () => {
  const rawKey = env.CREDENTIAL_ENCRYPTION_KEY || '12345678901234567890123456789012';
  return crypto.createHash('sha256').update(rawKey).digest();
};

const encryptToken = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decryptToken = (encryptedData) => {
  if (!encryptedData) return null;
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = getSecretKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
};

const CREDENTIALS_FILE = path.join(__dirname, '../../data/credentials.json');

const readDiskCredentials = () => {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
      return JSON.parse(data) || {};
    }
  } catch (e) {
    console.warn(`[IntegrationService] Failed to read disk credentials: ${e.message}`);
  }
  return {};
};

const writeDiskCredentials = (provider, tokens) => {
  try {
    const dir = path.dirname(CREDENTIALS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const current = readDiskCredentials();
    current[provider] = {
      tokens,
      updatedAt: new Date().toISOString()
    };
    if (provider === 'gmail' || provider === 'google-sheets' || provider === 'google') {
      current['gmail'] = { tokens, updatedAt: new Date().toISOString() };
      current['google-sheets'] = { tokens, updatedAt: new Date().toISOString() };
      current['google'] = { tokens, updatedAt: new Date().toISOString() };
    }
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(current, null, 2), 'utf8');
    console.log(`[IntegrationService] Credentials for '${provider}' persisted to server/data/credentials.json`);
  } catch (e) {
    console.warn(`[IntegrationService] Failed to write disk credentials: ${e.message}`);
  }
};

const saveIntegrationCredentials = async (userId, provider, tokens, scopes = []) => {
  writeDiskCredentials(provider, tokens);

  const encryptedTokens = {
    accessToken: encryptToken(tokens.accessToken),
    refreshToken: encryptToken(tokens.refreshToken),
    botToken: encryptToken(tokens.botToken),
    apiKey: encryptToken(tokens.apiKey)
  };

  const targetProviders = ['gmail', 'google-sheets', 'google'].includes(provider)
    ? ['gmail', 'google-sheets', 'google']
    : [provider];

  let lastIntegration = null;
  for (const p of targetProviders) {
    try {
      lastIntegration = await Integration.findOneAndUpdate(
        { owner: userId, provider: p },
        {
          owner: userId,
          provider: p,
          isConnected: true,
          scopes,
          encryptedTokens,
          expiresAt: tokens.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn(`[IntegrationService] MongoDB save warning for '${p}': ${dbErr.message}`);
    }
  }

  return lastIntegration;
};

const axios = require('axios');

const refreshGoogleTokenIfNeeded = async (integration) => {
  const refreshToken = decryptToken(integration.encryptedTokens?.refreshToken) || integration.diskRefreshToken;
  if (!refreshToken) return null;

  try {
    console.log(`[IntegrationService] Refreshing Google OAuth access token for provider '${integration.provider || 'google'}'...`);
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    if (response.data?.access_token) {
      if (integration.encryptedTokens) {
        integration.encryptedTokens.accessToken = encryptToken(response.data.access_token);
        integration.expiresAt = new Date(Date.now() + (response.data.expires_in || 3600) * 1000);
        await integration.save().catch(() => {});
      }
      writeDiskCredentials(integration.provider || 'google', {
        accessToken: response.data.access_token,
        refreshToken
      });
      console.log(`[IntegrationService] Google OAuth access token refreshed successfully!`);
      return response.data.access_token;
    }
  } catch (refreshErr) {
    console.warn(`[IntegrationService] Auto-refresh warning: ${refreshErr.response?.data?.error_description || refreshErr.message}`);
  }
  return null;
};

const getIntegrationCredentials = async (userId, provider) => {
  const isGoogleProvider = ['gmail', 'google-sheets', 'google'].includes(provider);
  const providerQuery = isGoogleProvider ? { $in: ['gmail', 'google-sheets', 'google'] } : provider;

  let integration = null;
  try {
    integration = await Integration.findOne({ owner: userId, provider: providerQuery, isConnected: true });
    if (!integration) {
      integration = await Integration.findOne({ provider: providerQuery, isConnected: true }).sort({ updatedAt: -1 });
    }
  } catch (dbErr) {
    console.warn(`[IntegrationService] MongoDB query warning: ${dbErr.message}`);
  }

  let accessToken = integration ? decryptToken(integration.encryptedTokens?.accessToken) : null;
  let refreshToken = integration ? decryptToken(integration.encryptedTokens?.refreshToken) : null;
  let apiKey = integration ? decryptToken(integration.encryptedTokens?.apiKey) : null;
  let botToken = integration ? decryptToken(integration.encryptedTokens?.botToken) : null;

  // Fallback to disk-persisted credentials if Mongo DB returns empty tokens
  const diskData = readDiskCredentials();
  const diskCreds = diskData[provider] || (isGoogleProvider ? (diskData['gmail'] || diskData['google-sheets'] || diskData['google']) : null);
  if (diskCreds?.tokens) {
    accessToken = accessToken || diskCreds.tokens.accessToken;
    refreshToken = refreshToken || diskCreds.tokens.refreshToken;
    apiKey = apiKey || diskCreds.tokens.apiKey;
    botToken = botToken || diskCreds.tokens.botToken;
  }

  if (isGoogleProvider && refreshToken) {
    const refreshedToken = await refreshGoogleTokenIfNeeded(integration || { provider, diskRefreshToken: refreshToken });
    if (refreshedToken) {
      accessToken = refreshedToken;
    }
  }

  if (!accessToken && !apiKey && !botToken) {
    const err = new Error(`Integration for provider '${provider}' is not connected. Please connect on /integrations`);
    err.code = 'INTEGRATION_NOT_CONNECTED';
    throw err;
  }

  return {
    accessToken,
    refreshToken,
    apiKey,
    botToken
  };
};

const listUserIntegrations = async (userId) => {
  const providers = ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'];
  let userIntegrations = [];
  try {
    userIntegrations = await Integration.find({ owner: userId });
    if (!userIntegrations || userIntegrations.length === 0) {
      userIntegrations = await Integration.find({ isConnected: true });
    }
  } catch (e) {
    console.warn(`[IntegrationService] DB list warning: ${e.message}`);
  }

  const map = {};
  userIntegrations.forEach((item) => {
    map[item.provider] = item;
  });

  const diskCreds = readDiskCredentials();

  return providers.map((p) => {
    const isGoogle = ['gmail', 'google-sheets', 'google'].includes(p);
    const googleFound = isGoogle ? (map['gmail'] || map['google-sheets'] || map['google']) : null;
    const found = map[p] || googleFound;
    const hasDisk = Boolean(diskCreds[p] || (isGoogle && (diskCreds['gmail'] || diskCreds['google'] || diskCreds['google-sheets'])));
    const isConnected = Boolean((found && found.isConnected) || hasDisk);
    return {
      provider: p,
      isConnected,
      expiresAt: found ? found.expiresAt : null,
      updatedAt: found ? found.updatedAt : null
    };
  });
};

const disconnectIntegration = async (userId, provider) => {
  await Integration.findOneAndUpdate(
    { owner: userId, provider },
    { isConnected: false, encryptedTokens: {} }
  );
  return { provider, isConnected: false };
};

module.exports = {
  encryptToken,
  decryptToken,
  saveIntegrationCredentials,
  getIntegrationCredentials,
  listUserIntegrations,
  disconnectIntegration
};
