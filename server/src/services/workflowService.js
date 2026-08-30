const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const { normalizeWorkflowGraph } = require('./aiService');

const createWorkflow = async (userId, data) => {
  const normalized = normalizeWorkflowGraph(data);
  const workflow = await Workflow.create({
    ...data,
    nodes: normalized.nodes,
    edges: normalized.edges,
    owner: userId
  });
  return workflow;
};

const getUserWorkflows = async (userId, { search, status, page = 1, limit = 10 }) => {
  const query = { owner: userId };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const skip = (page - 1) * limit;
  const [workflows, total] = await Promise.all([
    Workflow.find(query).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
    Workflow.countDocuments(query)
  ]);

  return {
    workflows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  };
};

const getWorkflowById = async (userId, workflowId) => {
  const workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  return workflow;
};

const updateWorkflow = async (userId, workflowId, updateData) => {
  const workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }

  if (updateData.nodes || updateData.edges) {
    const normalized = normalizeWorkflowGraph({
      nodes: updateData.nodes || workflow.nodes,
      edges: updateData.edges || workflow.edges
    });
    updateData.nodes = normalized.nodes;
    updateData.edges = normalized.edges;
    updateData.version = (workflow.version || 1) + 1;
  }

  Object.assign(workflow, updateData);
  await workflow.save();
  return workflow;
};

const duplicateWorkflow = async (userId, workflowId) => {
  const original = await getWorkflowById(userId, workflowId);
  const clone = await Workflow.create({
    name: `${original.name} (Copy)`,
    description: original.description,
    owner: userId,
    status: 'draft',
    triggerConfig: original.triggerConfig,
    nodes: original.nodes,
    edges: original.edges,
    tags: original.tags,
    version: 1
  });
  return clone;
};

const deleteWorkflow = async (userId, workflowId) => {
  const result = await Workflow.deleteOne({ _id: workflowId, owner: userId });
  if (result.deletedCount === 0) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  return { success: true };
};

const getDashboardStats = async (userId) => {
  const totalWorkflows = await Workflow.countDocuments({ owner: userId });
  const activeWorkflows = await Workflow.countDocuments({ owner: userId, status: 'active' });
  
  const executions = await Execution.find({ owner: userId });
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(e => e.status === 'COMPLETED').length;
  const failedExecutions = executions.filter(e => e.status === 'FAILED').length;
  const runningExecutions = executions.filter(e => e.status === 'RUNNING').length;

  const successRate = totalExecutions > 0 
    ? Math.round((successfulExecutions / totalExecutions) * 100) 
    : 100;

  const recentExecutions = await Execution.find({ owner: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('workflowId', 'name');

  return {
    metrics: {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      runningExecutions,
      successRate
    },
    recentExecutions
  };
};

module.exports = {
  createWorkflow,
  getUserWorkflows,
  getWorkflowById,
  updateWorkflow,
  duplicateWorkflow,
  deleteWorkflow,
  getDashboardStats
};
