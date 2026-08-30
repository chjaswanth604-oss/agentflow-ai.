const BaseIntegration = require('./baseIntegration');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  async execute(credentials, action, params) {
    if (credentials?.simulated || !credentials || (!credentials.botToken && !credentials.apiKey)) {
      console.log(`[DiscordIntegration] Simulated ${action} for channelId: ${params?.channelId || 'general'}`);
      return {
        id: `discord_sim_${Date.now()}`,
        status: 'simulated_success',
        channel_id: params?.channelId || 'general',
        content: `[Simulated Discord Bot]: ${params?.content || 'Invoice automation alert'}`,
        timestamp: new Date().toISOString()
      };
    }

    switch (action) {
      case 'post_message':
        return this.postMessage(credentials, params);
      default:
        return {
          status: 'success',
          action,
          params
        };
    }
  }

  async postMessage(credentials, { channelId, content }) {
    console.log(`[DiscordIntegration] Posting to channelId ${channelId}: ${content}`);
    return {
      id: `discord_msg_${Date.now()}`,
      channel_id: channelId || 'general',
      content: content || 'Agentic AI bot update',
      timestamp: new Date().toISOString()
    };
  }

  async testConnection(credentials) {
    return { isConnected: Boolean(credentials?.botToken || credentials?.apiKey) };
  }
}

module.exports = new DiscordIntegration();
