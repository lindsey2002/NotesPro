const express = require('express');
const router = express.Router();
const bulletinsController = require('../controllers/bulletinsController');
const auth = require('../middleware/auth');

router.post('/generer/:eleve_id/:semestre_id', auth, bulletinsController.generer);
router.get('/:eleve_id/:semestre_id', auth, bulletinsController.getBulletin);

module.exports = router;