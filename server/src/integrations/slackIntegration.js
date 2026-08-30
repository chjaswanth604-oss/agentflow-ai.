const BaseIntegration = require('./baseIntegration');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  async execute(credentials, action, params) {
    if (credentials?.simulated || !credentials || (!credentials.botToken && !credentials.accessToken)) {
      console.log(`[SlackIntegration] Simulated ${action} for channel: ${params?.channel || '#general'}`);
      return {
        ok: true,
        status: 'simulated_success',
        channel: params?.channel || '#ops-automation',
        ts: `${Date.now() / 1000}`,
        message: {
          text: `[Simulated Slack]: ${params?.message || 'Invoice alert generated'}`,
          bot_id: 'B_SIMULATED'
        }
      };
    }

    switch (action) {
      case 'post_message':
        return this.postMessage(credentials, params);
      case 'subscribe_events':
        return { status: 'subscribed', channel: params.channel };
      default:
        return {
          status: 'success',
          action,
          params
        };
    }
  }

  async postMessage(credentials, { channel, message }) {
    console.log(`[SlackIntegration] Posting to channel ${channel}: ${message}`);
    return {
      ok: true,
      channel: channel || '#general',
      ts: `${Date.now() / 1000}`,
      message: {
        text: message,
        bot_id: 'B01928374'
      }
    };
  }

  async testConnection(credentials) {
    return { isConnected: Boolean(credentials?.botToken || credentials?.accessToken) };
  }
}

module.exports = new SlackIntegration();
