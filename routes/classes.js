const express = require('express');
const router = express.Router();
const classeController = require('../controllers/classeController');
const auth = require('../middleware/auth');

router.get('/', auth, classeController.getAll);
router.get('/:id/eleves', auth, classeController.getEleves);

module.exports = router;