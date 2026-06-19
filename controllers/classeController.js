const db = require('../db/connection');

exports.getAll = async (req, res) => {
  try {
    const [classes] = await db.query('SELECT * FROM classes');
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getEleves = async (req, res) => {
  try {
    const [eleves] = await db.query(
      'SELECT * FROM eleves WHERE classe_id = ?',
      [req.params.id]
    );
    res.json(eleves);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};