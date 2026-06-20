const db = require('../db/connection');

exports.assigner = async (req, res) => {
  try {
    const { user_id, matiere_id, classe_id } = req.body;

    // Vérifier que le user est bien un enseignant
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ? AND role = ?',
      [user_id, 'enseignant']
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Enseignant introuvable' });
    }

    // Vérifier si l'assignation existe déjà
    const [existing] = await db.query(
      'SELECT * FROM enseignant_matieres WHERE user_id = ? AND matiere_id = ? AND classe_id = ?',
      [user_id, matiere_id, classe_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Assignation déjà existante' });
    }

    await db.query(
      'INSERT INTO enseignant_matieres (user_id, matiere_id, classe_id) VALUES (?, ?, ?)',
      [user_id, matiere_id, classe_id]
    );

    res.status(201).json({ message: 'Matière assignée avec succès' });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [enseignants] = await db.query(
      `SELECT em.id, u.name as enseignant, u.email, 
              m.nom as matiere, c.nom as classe, c.niveau
       FROM enseignant_matieres em
       JOIN users u ON em.user_id = u.id
       JOIN matieres m ON em.matiere_id = m.id
       JOIN classes c ON em.classe_id = c.id`
    );
    res.json(enseignants);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getMatieres = async (req, res) => {
  try {
    const [matieres] = await db.query(
      `SELECT em.id, m.nom as matiere, m.coefficient,
              c.nom as classe, c.niveau, c.id as classe_id
       FROM enseignant_matieres em
       JOIN matieres m ON em.matiere_id = m.id
       JOIN classes c ON em.classe_id = c.id
       WHERE em.user_id = ?`,
      [req.params.user_id]
    );
    res.json(matieres);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getListe = async (req, res) => {
  try {
    const [enseignants] = await db.query(
      'SELECT id, name, email FROM users WHERE role = ?',
      ['enseignant']
    );
    res.json(enseignants);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.supprimer = async (req, res) => {
  try {
    await db.query('DELETE FROM enseignant_matieres WHERE id = ?', [req.params.id]);
    res.json({ message: 'Assignation supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};