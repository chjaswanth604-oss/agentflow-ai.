/**
 * Abstract Base Class for Third-Party Integrations
 */
class BaseIntegration {
  constructor(providerName) {
    if (this.constructor === BaseIntegration) {
      throw new Error("Abstract class BaseIntegration cannot be instantiated directly.");
    }
    this.providerName = providerName;
  }

  /**
   * Execute node action
   * @param {Object} credentials Decrypted credential tokens
   * @param {String} action Action name (e.g. send_email, post_message)
   * @param {Object} params Action parameters
   */
  async execute(credentials, action, params) {
    throw new Error(`Method 'execute' must be implemented in integration class ${this.constructor.name}`);
  }

  /**
   * Health check / Test connectivity
   * @param {Object} credentials Decrypted credential tokens
   */
  async testConnection(credentials) {
    throw new Error(`Method 'testConnection' must be implemented in integration class ${this.constructor.name}`);
  }
}

module.exports = BaseIntegration;
