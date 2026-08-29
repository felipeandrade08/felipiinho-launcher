const express = require('express');
const router = express.Router();
const { criarCheckout, portal } = require('../controllers/AssinaturaController');

router.post('/checkout', criarCheckout);
router.post('/portal', portal);

module.exports = router;