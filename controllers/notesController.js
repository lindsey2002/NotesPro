const db = require('../db/connection');

exports.create = async (req, res) => {
  try {
    const { eleve_id, matiere_id, classe_id, semestre_id, note, type_evaluation } = req.body;
    if (req.user.role === 'enseignant') {
      const [assignation] = await db.query(
        'SELECT * FROM enseignant_matieres WHERE user_id = ? AND matiere_id = ? AND classe_id = ?',
        [req.user.id, matiere_id, classe_id]
      );
    }

    if (assignation.length === 0) {
      return res.status(403).json({ 
        message: 'Vous ne pouvez pas saisir des notes pour cette matière ou classe' 
      });
    }

    const [result] = await db.query(
      'INSERT INTO notes (eleve_id, matiere_id, classe_id, semestre_id, note, type_evaluation) VALUES (?, ?, ?, ?, ?, ?)',
      [eleve_id, matiere_id, classe_id, semestre_id, note, type_evaluation]
    );

    res.status(201).json({ id: result.insertId, eleve_id, matiere_id, classe_id, semestre_id, note, type_evaluation });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getByClasseMatiere = async (req, res) => {
  try {
    const { classe_id, matiere_id, semestre_id } = req.params;

    // Si enseignant, vérifier qu'il est assigné
    if (req.user.role === 'enseignant') {
      const [assignation] = await db.query(
        'SELECT * FROM enseignant_matieres WHERE user_id = ? AND matiere_id = ? AND classe_id = ?',
        [req.user.id, matiere_id, classe_id]
      );

      if (assignation.length === 0) {
        return res.status(403).json({ 
          message: 'Accès refusé à cette matière ou classe' 
        });
      }
    }

    const [notes] = await db.query(
      `SELECT n.*, e.nom as eleve_nom, e.prenom as eleve_prenom
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

    // Si enseignant, vérifier que la note lui appartient
    if (req.user.role === 'enseignant') {
      const [existing] = await db.query(
        `SELECT n.* FROM notes n
         JOIN enseignant_matieres em ON n.matiere_id = em.matiere_id AND n.classe_id = em.classe_id
         WHERE n.id = ? AND em.user_id = ?`,
        [req.params.id, req.user.id]
      );

      if (existing.length === 0) {
        return res.status(403).json({ 
          message: 'Vous ne pouvez pas modifier cette note' 
        });
      }
    }

    await db.query('UPDATE notes SET note = ? WHERE id = ?', [note, req.params.id]);
    res.json({ message: 'Note mise à jour' });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    if (req.user.role === 'enseignant') {
      const [existing] = await db.query(
        `SELECT n.* FROM notes n
         JOIN enseignant_matieres em ON n.matiere_id = em.matiere_id AND n.classe_id = em.classe_id
         WHERE n.id = ? AND em.user_id = ?`,
        [req.params.id, req.user.id]
      );

      if (existing.length === 0) {
        return res.status(403).json({ 
          message: 'Vous ne pouvez pas supprimer cette note' 
        });
      }
    }

    await db.query('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Note supprimée' });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};