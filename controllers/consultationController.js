const db = require('../db/connection');

exports.getEnfants = async (req, res) => {
  try {
    const { parent_id } = req.params;

    const [enfants] = await db.query(
      `SELECT e.*, c.nom as classe_nom, c.niveau
       FROM eleves e
       JOIN classes c ON e.classe_id = c.id
       WHERE e.parent_id = ?`,
      [parent_id]
    );

    if (enfants.length === 0) {
      return res.status(404).json({ message: 'Aucun enfant trouvé' });
    }

    res.json(enfants);

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getDossierEleve = async (req, res) => {
  try {
    const { eleve_id } = req.params;

    // Infos élève
    const [eleves] = await db.query(
      `SELECT e.*, c.nom as classe_nom, c.niveau
       FROM eleves e
       JOIN classes c ON e.classe_id = c.id
       WHERE e.id = ?`,
      [eleve_id]
    );

    if (eleves.length === 0) {
      return res.status(404).json({ message: 'Élève introuvable' });
    }

    // Bulletins de l'élève
    const [bulletins] = await db.query(
      `SELECT b.*, s.nom as semestre_nom
       FROM bulletins b
       JOIN semestres s ON b.semestre_id = s.id
       WHERE b.eleve_id = ?`,
      [eleve_id]
    );

    // Notes de l'élève
    const [notes] = await db.query(
      `SELECT n.*, m.nom as matiere_nom, m.coefficient, s.nom as semestre_nom
       FROM notes n
       JOIN matieres m ON n.matiere_id = m.id
       JOIN semestres s ON n.semestre_id = s.id
       WHERE n.eleve_id = ?`,
      [eleve_id]
    );

    res.json({
      eleve: eleves[0],
      bulletins,
      notes
    });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};