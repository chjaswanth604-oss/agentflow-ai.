class RecoveryAgent {
  classifyAndPlan(error, retryCount = 0) {
    let failureType = 'TRANSIENT';
    const message = error?.message || '';
    const code = error?.code || '';

    if (code === 'INTEGRATION_NOT_CONNECTED' || code === 'AUTH_EXPIRED' || message.includes('expired') || message.includes('unauthorized')) {
      failureType = 'AUTH_EXPIRED';
    } else if (message.includes('rate limit') || message.includes('429')) {
      failureType = 'RATE_LIMIT';
    } else if (message.includes('missing') || code === 'MISSING_FIELDS') {
      failureType = 'MISSING_FIELDS';
    } else if (message.includes('API') || code === 'API_FAILURE') {
      failureType = 'API_FAILURE';
    }

    const MAX_RETRIES = 3;

    if (['AUTH_EXPIRED', 'MISSING_FIELDS'].includes(failureType) || retryCount >= MAX_RETRIES) {
      return {
        failureType,
        action: 'escalate',
        backoffDelayMs: 0,
        reason: `Failure type '${failureType}' requires operator intervention or max retries exceeded.`
      };
    }

    // Exponential backoff strategy
    const backoffDelayMs = Math.pow(2, retryCount) * 1000;

    return {
      failureType,
      action: 'retry_with_backoff',
      backoffDelayMs,
      retryCount: retryCount + 1,
      reason: `Classified as ${failureType}. Retrying with ${backoffDelayMs}ms delay.`
    };
  }
}

module.exports = new RecoveryAgent();
