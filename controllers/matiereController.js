const db = require('../db/connection');

exports.getAll = async (req, res) => {
  try {
    const [matieres] = await db.query('SELECT * FROM matieres');
    res.json(matieres);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nom, coefficient } = req.body;
    const [result] = await db.query(
      'INSERT INTO matieres (nom, coefficient) VALUES (?, ?)',
      [nom, coefficient]
    );
    res.status(201).json({ id: result.insertId, nom, coefficient });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nom, coefficient } = req.body;
    await db.query(
      'UPDATE matieres SET nom = ?, coefficient = ? WHERE id = ?',
      [nom, coefficient, req.params.id]
    );
    res.json({ message: 'Matière mise à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM matieres WHERE id = ?', [req.params.id]);
    res.json({ message: 'Matière supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};