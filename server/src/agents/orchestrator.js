const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const Execution = require('../models/Execution');
const AgentMemory = require('../models/AgentMemory');

// Check if @langchain/langgraph is available
let langGraphStatus = 'not-installed';
try {
  require('@langchain/langgraph');
  langGraphStatus = 'available';
} catch (e) {
  langGraphStatus = 'not-installed';
}

class Orchestrator {
  getLangGraphStatus() {
    return langGraphStatus;
  }

  async runExecution(executionId) {
    const execution = await Execution.findById(executionId).populate('workflowId');
    if (!execution) {
      throw new Error(`Execution record ${executionId} not found`);
    }

    const workflow = execution.workflowSnapshot;
    const userId = execution.owner;
    const startTime = Date.now();

    execution.status = 'RUNNING';
    execution.startTime = new Date();
    await execution.save();

    // 1. MONITORING AGENT: Execution Started
    await monitoringAgent.logEvent({
      executionId,
      workflowId: execution.workflowId,
      userId,
      agent: 'monitoring',
      level: 'info',
      message: `Execution ${executionId} started (langGraph: ${langGraphStatus}).`,
      metadata: { langGraph: langGraphStatus }
    });

    try {
      // 2. PLANNER AGENT: Generate execution plan
      await monitoringAgent.logEvent({
        executionId,
        workflowId: execution.workflowId,
        userId,
        agent: 'planner',
        level: 'info',
        message: 'Planner Agent analyzing workflow DAG...'
      });

      const planResult = await plannerAgent.plan(workflow);

      await AgentMemory.create({
        workflowId: execution.workflowId,
        executionId,
        agentId: 'planner',
        key: 'executionPlan',
        value: planResult,
        confidenceScore: planResult.confidenceScore
      }).catch(() => {});

      await monitoringAgent.logEvent({
        executionId,
        workflowId: execution.workflowId,
        userId,
        agent: 'planner',
        level: 'success',
        message: `Plan generated: ${planResult.reasoning} (Confidence: ${Math.round(planResult.confidenceScore * 100)}%)`,
        metadata: planResult
      });

      const nodeMap = {};
      (workflow.nodes || []).forEach(n => { nodeMap[n.id] = n; });

      const outputs = {};

      // 3. Loop through planned nodes
      for (const nodeId of planResult.executionOrder) {
        // Check for manual pause / cancellation status before running node
        const currentCheck = await Execution.findById(executionId);
        if (currentCheck.status === 'PAUSED') {
          await monitoringAgent.logEvent({
            executionId,
            workflowId: execution.workflowId,
            userId,
            nodeId,
            agent: 'monitoring',
            level: 'warning',
            message: `Execution paused at node '${nodeId}'.`
          });
          return execution;
        }
        if (currentCheck.status === 'CANCELLED') {
          await monitoringAgent.logEvent({
            executionId,
            workflowId: execution.workflowId,
            userId,
            nodeId,
            agent: 'monitoring',
            level: 'warning',
            message: `Execution cancelled by operator at node '${nodeId}'.`
          });
          return execution;
        }

        const node = nodeMap[nodeId];
        if (!node) continue;

        execution.currentNode = nodeId;
        await execution.save();

        let stepSuccess = false;
        let retries = 0;

        while (!stepSuccess) {
          try {
            // EXECUTION AGENT: Run step
            await monitoringAgent.logEvent({
              executionId,
              workflowId: execution.workflowId,
              userId,
              nodeId,
              agent: 'execution',
              level: 'info',
              message: `Executing node '${node.data?.label || nodeId}' (${node.type})`
            });

            const execResult = await executionAgent.executeNode(node, userId, { outputs });

            // VALIDATION AGENT: Validate result
            await monitoringAgent.logEvent({
              executionId,
              workflowId: execution.workflowId,
              userId,
              nodeId,
              agent: 'validation',
              level: 'info',
              message: `Validating output for node '${nodeId}'...`
            });

            const valResult = await validationAgent.validate(node, execResult);

            if (!valResult.isValid) {
              throw new Error(`Validation failed: ${valResult.reason}`);
            }

            await monitoringAgent.logEvent({
              executionId,
              workflowId: execution.workflowId,
              userId,
              nodeId,
              agent: 'validation',
              level: 'success',
              message: `Validation passed for node '${nodeId}'. Output verified.`,
              metadata: valResult
            });

            outputs[nodeId] = execResult.output;
            stepSuccess = true;

            await monitoringAgent.logEvent({
              executionId,
              workflowId: execution.workflowId,
              userId,
              nodeId,
              agent: 'execution',
              level: 'success',
              message: `Node '${node.data?.label || nodeId}' executed successfully.`,
              metadata: execResult.output
            });

          } catch (error) {
            // RECOVERY AGENT: Handle error
            await monitoringAgent.logEvent({
              executionId,
              workflowId: execution.workflowId,
              userId,
              nodeId,
              agent: 'recovery',
              level: 'warning',
              message: `Step error encountered on '${nodeId}': ${error.message}`
            });

            const recoveryPlan = recoveryAgent.classifyAndPlan(error, retries);

            if (recoveryPlan.action === 'retry_with_backoff') {
              retries = recoveryPlan.retryCount;
              execution.retryCount += 1;
              execution.status = 'RETRYING';
              await execution.save();

              await monitoringAgent.logEvent({
                executionId,
                workflowId: execution.workflowId,
                userId,
                nodeId,
                agent: 'recovery',
                level: 'warning',
                message: `Recovery Agent initiating retry #${retries} after ${recoveryPlan.backoffDelayMs}ms backoff. (${recoveryPlan.reason})`
              });

              await new Promise(res => setTimeout(res, Math.min(recoveryPlan.backoffDelayMs, 2000)));
            } else {
              // Escalate & fail execution
              await monitoringAgent.logEvent({
                executionId,
                workflowId: execution.workflowId,
                userId,
                nodeId,
                agent: 'recovery',
                level: 'error',
                message: `Recovery Agent escalated failure: ${recoveryPlan.reason}`
              });

              execution.status = 'FAILED';
              execution.endTime = new Date();
              execution.duration = Date.now() - startTime;
              execution.error = { message: error.message, code: recoveryPlan.failureType };
              await execution.save();

              await monitoringAgent.logEvent({
                executionId,
                workflowId: execution.workflowId,
                userId,
                agent: 'monitoring',
                level: 'error',
                message: `Execution ${executionId} FAILED in ${execution.duration}ms.`
              });

              return execution;
            }
          }
        }
      }

      // Final Completion
      execution.status = 'COMPLETED';
      execution.currentNode = null;
      execution.endTime = new Date();
      execution.duration = Date.now() - startTime;
      
      try {
        execution.outputs = JSON.parse(JSON.stringify(outputs || {}));
      } catch (e) {
        execution.outputs = {};
      }
      
      await execution.save();

      await monitoringAgent.logEvent({
        executionId,
        workflowId: execution.workflowId,
        userId,
        agent: 'monitoring',
        level: 'success',
        message: `Workflow completed successfully in ${execution.duration}ms.`
      });

      return execution;

    } catch (fatalErr) {
      execution.status = 'FAILED';
      execution.endTime = new Date();
      execution.duration = Date.now() - startTime;
      execution.error = { message: fatalErr.message };
      await execution.save();

      await monitoringAgent.logEvent({
        executionId,
        workflowId: execution.workflowId,
        userId,
        agent: 'monitoring',
        level: 'error',
        message: `Fatal orchestrator crash: ${fatalErr.message}`
      });

      return execution;
    }
  }
}

module.exports = new Orchestrator();
