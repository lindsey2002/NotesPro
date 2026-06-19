const express = require('express');
const router = express.Router();
const matiereController = require('../controllers/matiereController');
const auth = require('../middleware/auth');

router.get('/', auth, matiereController.getAll);
router.post('/', auth, matiereController.create);
router.put('/:id', auth, matiereController.update);
router.delete('/:id', auth, matiereController.delete);

module.exports = router;