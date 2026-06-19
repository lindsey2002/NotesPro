const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const auth = require('../middleware/auth');

router.post('/', auth, notesController.create);
router.get('/classe/:classe_id/matiere/:matiere_id/semestre/:semestre_id', auth, notesController.getByClasseMatiere);
router.put('/:id', auth, notesController.update);
router.delete('/:id', auth, notesController.delete);

module.exports = router;