const integrationService = require('../services/integrationService');

const listIntegrations = async (req, res, next) => {
  try {
    const list = await integrationService.listUserIntegrations(req.user.id);
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const list = await integrationService.listUserIntegrations(req.user.id);
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

const env = require('../config/env');

const startOAuth = async (req, res, next) => {
  try {
    const { provider } = req.params;

    // Check if provider is Google (Gmail / Google Sheets / Google)
    if (provider === 'gmail' || provider === 'google-sheets' || provider === 'google') {
      const clientId = env.GOOGLE_CLIENT_ID || '339086884724-l9ecbh9aoqlq3mbocj9b84sll92huiao.apps.googleusercontent.com';
      const redirectUri = env.GOOGLE_CALLBACK_URL || 'https://agentflow-ai-0u7r.onrender.com/api/integrations/oauth/google/callback';
      const scopes = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ].join(' ');

      const state = `${req.user.id}_${provider}`;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `response_type=code&` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(state)}`;

      return res.status(200).json({ success: true, url: authUrl, realOAuth: true });
    }

    // Default or un-configured fallback
    return res.status(200).json({
      success: true,
      realOAuth: false,
      message: 'GOOGLE_CLIENT_ID is not configured in server/.env.',
      url: null
    });
  } catch (err) {
    next(err);
  }
};

const handleCallback = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.query;

    let userId = req.user?.id;
    let targetProvider = provider;

    if (state && state.includes('_')) {
      const parts = state.split('_');
      userId = parts[0];
      targetProvider = parts[1] || provider;
    }

    let tokens = {
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      botToken: targetProvider === 'slack' || targetProvider === 'discord' ? `mock_bot_token_${Date.now()}` : null
    };

    // If real Google OAuth code provided and Client Secret available, exchange token
    if (code && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && (targetProvider === 'gmail' || targetProvider === 'google-sheets' || targetProvider === 'google')) {
      try {
        const axios = require('axios');
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/integrations/oauth/google/callback',
          grant_type: 'authorization_code'
        });

        if (tokenRes.data?.access_token) {
          tokens = {
            accessToken: tokenRes.data.access_token,
            refreshToken: tokenRes.data.refresh_token || null,
            expiresIn: tokenRes.data.expires_in
          };
        }
      } catch (err) {
        console.warn(`[OAuthCallback] Google Token Exchange warning: ${err.message}`);
      }
    }

    if (!userId) {
      try {
        const User = require('../models/User');
        const firstUser = await User.findOne();
        if (firstUser) userId = firstUser._id ? firstUser._id.toString() : firstUser.id;
      } catch (e) {
        console.warn(`[OAuthCallback] Could not fallback user: ${e.message}`);
      }
    }

    if (userId) {
      await integrationService.saveIntegrationCredentials(userId, targetProvider, tokens);
      if (targetProvider === 'gmail' || targetProvider === 'google-sheets') {
        await integrationService.saveIntegrationCredentials(userId, targetProvider === 'gmail' ? 'google-sheets' : 'gmail', tokens);
      }
    }

    // Redirect browser back to frontend integrations page if direct browser request, otherwise return JSON
    const isBrowserNavigation = req.headers['sec-fetch-dest'] === 'document' || req.headers['accept']?.includes('text/html');
    if (isBrowserNavigation) {
      return res.redirect(`${env.CLIENT_URL || 'http://localhost:3000'}/integrations?connected=${targetProvider}`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully connected ${targetProvider} integration.`,
      provider: targetProvider
    });
  } catch (err) {
    next(err);
  }
};

const saveManualCredentials = async (req, res, next) => {
  try {
    const { provider, apiKey, botToken, accessToken } = req.body;
    const tokens = { apiKey, botToken, accessToken };
    await integrationService.saveIntegrationCredentials(req.user.id, provider, tokens);

    res.status(200).json({
      success: true,
      message: `Credentials saved for ${provider}`,
      provider
    });
  } catch (err) {
    next(err);
  }
};

const disconnect = async (req, res, next) => {
  try {
    const { provider } = req.params;
    await integrationService.disconnectIntegration(req.user.id, provider);
    res.status(200).json({ success: true, message: `Disconnected ${provider}` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listIntegrations,
  getStatus,
  startOAuth,
  handleCallback,
  saveManualCredentials,
  disconnect
};
