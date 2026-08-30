const workflowService = require('../services/workflowService');
const aiService = require('../services/aiService');
const executionService = require('../services/executionService');

const create = async (req, res, next) => {
  try {
    const workflow = await workflowService.createWorkflow(req.user.id, req.body);
    res.status(201).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await workflowService.getUserWorkflows(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const workflow = await workflowService.updateWorkflow(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
};

const duplicate = async (req, res, next) => {
  try {
    const workflow = await workflowService.duplicateWorkflow(req.user.id, req.params.id);
    res.status(201).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await workflowService.deleteWorkflow(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Workflow deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const generateFromPrompt = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const generatedGraph = await aiService.generateWorkflowFromPrompt(prompt);
    res.status(200).json({ success: true, data: generatedGraph });
  } catch (err) {
    next(err);
  }
};

const execute = async (req, res, next) => {
  try {
    const execution = await executionService.triggerWorkflowExecution(
      req.user.id,
      req.params.id,
      req.body.inputs
    );
    res.status(200).json({ success: true, data: execution });
  } catch (err) {
    next(err);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await workflowService.getDashboardStats(req.user.id);
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  duplicate,
  remove,
  generateFromPrompt,
  execute,
  getDashboardStats
};
