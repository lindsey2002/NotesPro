const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');
const { role } = require('../middleware/auth');

router.get('/classe/:classe_id/semestre/:semestre_id', auth, role('admin', 'enseignant'), statsController.getStatsClasse);

module.exports = router;