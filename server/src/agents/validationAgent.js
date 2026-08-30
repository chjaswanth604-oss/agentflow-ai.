class ValidationAgent {
  async validate(node, result) {
    if (!result) {
      return {
        isValid: false,
        errorType: 'MISSING_FIELDS',
        reason: 'Execution returned empty result.'
      };
    }

    if (result.status !== 'SUCCESS') {
      return {
        isValid: false,
        errorType: 'API_FAILURE',
        reason: result.error?.message || 'Node execution failed.'
      };
    }

    // Node output field validation checks
    const output = result.output;
    if (!output) {
      return {
        isValid: false,
        errorType: 'MISSING_FIELDS',
        reason: `Node '${node.id}' did not return an output payload.`
      };
    }

    return {
      isValid: true,
      validatedFields: Object.keys(output),
      confidence: 1.0
    };
  }
}

module.exports = new ValidationAgent();
