const ExecutionLog = require('../models/ExecutionLog');
const Notification = require('../models/Notification');
const { emitAgentEvent, emitNotification } = require('../config/socket');

class MonitoringAgent {
  async logEvent({ executionId, workflowId, userId, nodeId, agent, level = 'info', message, metadata = {} }) {
    console.log(`[MonitoringAgent][${agent.toUpperCase()}][${level.toUpperCase()}] ${message}`);

    let cleanMetadata = {};
    try {
      cleanMetadata = JSON.parse(JSON.stringify(metadata || {}));
    } catch (e) {
      cleanMetadata = { summary: 'Metadata contains unserializable data' };
    }

    const logEntry = {
      executionId,
      workflowId,
      nodeId,
      agent,
      level,
      message,
      metadata: cleanMetadata,
      timestamp: new Date().toISOString()
    };

    // 1. Persist to MongoDB (if DB available)
    try {
      await ExecutionLog.create({
        executionId,
        workflowId,
        nodeId,
        agent,
        level,
        message,
        metadata: cleanMetadata
      });
    } catch (err) {
      console.warn(`[MonitoringAgent] Log persistence warning: ${err.message}`);
    }

    // 2. Broadcast live event via Socket.IO
    try {
      emitAgentEvent(executionId, logEntry);
    } catch (err) {
      console.warn(`[MonitoringAgent] Socket emission warning: ${err.message}`);
    }

    // 3. Create notification if error or escalation
    if (['error', 'escalation'].includes(level) && userId) {
      try {
        const notif = await Notification.create({
          owner: userId,
          workflowId,
          executionId,
          type: level === 'escalation' ? 'escalation' : 'error',
          title: `Execution Alert: ${agent}`,
          message
        });
        emitNotification(userId, notif);
      } catch (err) {
        console.warn(`[MonitoringAgent] Notification creation warning: ${err.message}`);
      }
    }

    return logEntry;
  }
}

module.exports = new MonitoringAgent();
