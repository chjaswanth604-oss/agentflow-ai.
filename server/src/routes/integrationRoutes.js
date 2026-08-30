const express = require('express');
const integrationController = require('../controllers/integrationController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// OAuth callback endpoint with optional auth decoding
router.get('/oauth/:provider/callback', optionalAuth, integrationController.handleCallback);

// Protected routes
router.use(protect);

router.get('/', integrationController.listIntegrations);
router.get('/status', integrationController.getStatus);
router.get('/oauth/:provider/start', integrationController.startOAuth);
router.post('/', integrationController.saveManualCredentials);
router.delete('/:provider', integrationController.disconnect);

module.exports = router;
