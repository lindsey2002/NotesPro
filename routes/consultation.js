const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const auth = require('../middleware/auth');

router.get('/parent/:parent_id', auth, consultationController.getEnfants);
router.get('/eleve/:eleve_id', auth, consultationController.getDossierEleve);

module.exports = router;