const express = require('express');
const workflowController = require('../controllers/workflowController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', workflowController.getDashboardStats);
router.post('/generate', workflowController.generateFromPrompt);

router.route('/')
  .get(workflowController.getAll)
  .post(workflowController.create);

router.route('/:id')
  .get(workflowController.getById)
  .put(workflowController.update)
  .delete(workflowController.remove);

router.post('/:id/duplicate', workflowController.duplicate);
router.post('/:id/execute', workflowController.execute);

module.exports = router;
