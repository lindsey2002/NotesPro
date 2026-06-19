const express = require('express');
const router = express.Router();
const moyennesController = require('../controllers/moyennesController');
const auth = require('../middleware/auth');

router.get('/eleve/:eleve_id/semestre/:semestre_id', auth, moyennesController.getMoyenneEleve);
router.get('/classe/:classe_id/semestre/:semestre_id', auth, moyennesController.getRangsClasse);

module.exports = router;