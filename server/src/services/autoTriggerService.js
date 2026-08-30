const Workflow = require('../models/Workflow');
const { triggerWorkflowExecution } = require('./executionService');

let isPolling = false;
let pollingInterval = null;

const startAutoTriggerPolling = (intervalMs = 60000) => {
  if (pollingInterval) return;

  console.log(`[AutoTriggerService] Initialized background real-time email listener (Polling interval: ${intervalMs / 1000}s)...`);

  pollingInterval = setInterval(async () => {
    if (isPolling) return;
    isPolling = true;

    try {
      // Find only active published workflows
      const activeWorkflows = await Workflow.find({ isPublished: true });
      if (activeWorkflows && activeWorkflows.length > 0) {
        for (const wf of activeWorkflows) {
          if (wf.name.toLowerCase().includes('invoice') || wf.name.toLowerCase().includes('email') || wf.name.toLowerCase().includes('sheets')) {
            console.log(`[AutoTriggerService] Auto-checking background email workflow: ${wf.name} (${wf._id})`);
            await triggerWorkflowExecution(wf.owner, wf._id.toString(), { autoTriggered: true });
          }
        }
      }
    } catch (err) {
      console.warn(`[AutoTriggerService] Polling warning: ${err.message}`);
    } finally {
      isPolling = false;
    }
  }, intervalMs);
};

const stopAutoTriggerPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log(`[AutoTriggerService] Stopped background email listener.`);
  }
};

module.exports = { startAutoTriggerPolling, stopAutoTriggerPolling };
