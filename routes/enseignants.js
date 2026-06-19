const express = require('express');
const router = express.Router();
const enseignantController = require('../controllers/enseignantController');
const auth = require('../middleware/auth');
const { role } = require('../middleware/auth');

// Seul l'admin peut assigner des matières aux enseignants
router.post('/assigner', auth, role('admin'), enseignantController.assigner);
router.get('/', auth, role('admin'), enseignantController.getAll);
router.get('/:user_id/matieres', auth, enseignantController.getMatieres);
router.delete('/:id', auth, role('admin'), enseignantController.supprimer);

module.exports = router;