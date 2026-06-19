const db = require('../db/connection');

exports.create = async (req, res) => {
  try {
    const { eleve_id, matiere_id, classe_id, semestre_id, note } = req.body;
    const [result] = await db.query(
      'INSERT INTO notes (eleve_id, matiere_id, classe_id, semestre_id, note) VALUES (?, ?, ?, ?, ?)',
      [eleve_id, matiere_id, classe_id, semestre_id, note]
    );
    res.status(201).json({ id: result.insertId, eleve_id, matiere_id, classe_id, semestre_id, note });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getByClasseMatiere = async (req, res) => {
  try {
    const { classe_id, matiere_id, semestre_id } = req.params;
    const [notes] = await db.query(
      `SELECT n.*, e.name as eleve_nom
       FROM notes n
       JOIN eleves e ON n.eleve_id = e.id
       WHERE n.classe_id = ? AND n.matiere_id = ? AND n.semestre_id = ?`,
      [classe_id, matiere_id, semestre_id]
    );
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { note } = req.body;
    await db.query('UPDATE notes SET note = ? WHERE id = ?', [note, req.params.id]);
    res.json({ message: 'Note mise à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Note supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};