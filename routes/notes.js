const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const auth = require('../middleware/auth');
const { role } = require('../middleware/auth');

router.post('/', auth, role('admin', 'enseignant'), notesController.create);
router.get('/classe/:classe_id/matiere/:matiere_id/semestre/:semestre_id', auth, role('admin', 'enseignant'), notesController.getByClasseMatiere);
router.put('/:id', auth, role('admin', 'enseignant'), notesController.update);
router.delete('/:id', auth, role('admin', 'enseignant'), notesController.delete);

module.exports = router;