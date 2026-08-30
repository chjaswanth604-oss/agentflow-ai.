const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const { addExecutionJob } = require('../queues/executionQueue');

const triggerWorkflowExecution = async (userId, workflowId, inputs = {}) => {
  const workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }

  // Create immutable execution snapshot
  const execution = await Execution.create({
    workflowId,
    owner: userId,
    workflowSnapshot: {
      name: workflow.name,
      nodes: workflow.nodes,
      edges: workflow.edges,
      triggerConfig: workflow.triggerConfig,
      version: workflow.version
    },
    status: 'PENDING',
    inputs
  });

  // Enqueue job
  await addExecutionJob(execution._id.toString());

  return execution;
};

const getUserExecutions = async (userId, { status, workflowId, page = 1, limit = 10 }) => {
  const query = { owner: userId };
  if (status) query.status = status;
  if (workflowId) query.workflowId = workflowId;

  const skip = (page - 1) * limit;
  const [executions, total] = await Promise.all([
    Execution.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('workflowId', 'name description'),
    Execution.countDocuments(query)
  ]);

  return {
    executions,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  };
};

const getExecutionById = async (userId, executionId) => {
  const execution = await Execution.findOne({ _id: executionId, owner: userId }).populate('workflowId', 'name');
  if (!execution) {
    const err = new Error('Execution record not found');
    err.statusCode = 404;
    throw err;
  }
  return execution;
};

const getExecutionTimelineLogs = async (userId, executionId) => {
  // Ensure access
  await getExecutionById(userId, executionId);

  const logs = await ExecutionLog.find({ executionId }).sort({ createdAt: 1 });
  return logs;
};

const pauseExecution = async (userId, executionId) => {
  const execution = await getExecutionById(userId, executionId);
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(execution.status)) {
    const err = new Error(`Cannot pause execution in state ${execution.status}`);
    err.statusCode = 400;
    throw err;
  }

  execution.status = 'PAUSED';
  await execution.save();
  return execution;
};

const resumeExecution = async (userId, executionId) => {
  const execution = await getExecutionById(userId, executionId);
  if (execution.status !== 'PAUSED') {
    const err = new Error(`Execution is not paused (Current state: ${execution.status})`);
    err.statusCode = 400;
    throw err;
  }

  execution.status = 'RUNNING';
  await execution.save();
  await addExecutionJob(execution._id.toString());
  return execution;
};

const cancelExecution = async (userId, executionId) => {
  const execution = await getExecutionById(userId, executionId);
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(execution.status)) {
    const err = new Error(`Cannot cancel execution in state ${execution.status}`);
    err.statusCode = 400;
    throw err;
  }

  execution.status = 'CANCELLED';
  execution.endTime = new Date();
  await execution.save();
  return execution;
};

module.exports = {
  triggerWorkflowExecution,
  getUserExecutions,
  getExecutionById,
  getExecutionTimelineLogs,
  pauseExecution,
  resumeExecution,
  cancelExecution
};
