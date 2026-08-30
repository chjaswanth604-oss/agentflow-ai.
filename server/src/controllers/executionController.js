const executionService = require('../services/executionService');

const getAll = async (req, res, next) => {
  try {
    const result = await executionService.getUserExecutions(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const execution = await executionService.getExecutionById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: execution });
  } catch (err) {
    next(err);
  }
};

const getTimeline = async (req, res, next) => {
  try {
    const logs = await executionService.getExecutionTimelineLogs(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

const pause = async (req, res, next) => {
  try {
    const execution = await executionService.pauseExecution(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: execution });
  } catch (err) {
    next(err);
  }
};

const resume = async (req, res, next) => {
  try {
    const execution = await executionService.resumeExecution(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: execution });
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const execution = await executionService.cancelExecution(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: execution });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  getTimeline,
  pause,
  resume,
  cancel
};
