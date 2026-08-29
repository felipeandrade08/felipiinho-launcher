const express = require('express');
const router = express.Router();
const { receber } = require('../controllers/StripeWebhookController');

router.post('/', express.raw({ type: 'application/json' }), receber);

module.exports = router;