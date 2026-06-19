const db = require('../db/connection');

const getMention = (moyenne) => {
  if (moyenne >= 16) return 'Excellent';
  if (moyenne >= 14) return 'Très Bien';
  if (moyenne >= 12) return 'Bien';
  if (moyenne >= 10) return 'Passable';
  return 'Insuffisant';
};

exports.generer = async (req, res) => {
  try {
    const { eleve_id, semestre_id } = req.params;

    // Récupérer les notes
    const [notes] = await db.query(
      `SELECT n.note, n.type_evaluation, m.coefficient, m.nom as matiere, m.id as matiere_id
       FROM notes n
       JOIN matieres m ON n.matiere_id = m.id
       WHERE n.eleve_id = ? AND n.semestre_id = ?`,
      [eleve_id, semestre_id]
    );

    if (notes.length === 0) {
      return res.status(404).json({ message: 'Aucune note trouvée' });
    }

    // Récupérer la classe de l'élève
    const [eleves] = await db.query(
      'SELECT * FROM eleves WHERE id = ?',
      [eleve_id]
    );
    const classe_id = eleves[0].classe_id;

    // Grouper par matière et calculer
    const matieres = {};
    notes.forEach(n => {
      if (!matieres[n.matiere_id]) {
        matieres[n.matiere_id] = {
          nom: n.matiere,
          coefficient: n.coefficient,
          devoirs: [],
          examen: null
        };
      }
      if (n.type_evaluation === 'examen') {
        matieres[n.matiere_id].examen = parseFloat(n.note);
      } else if (n.type_evaluation.startsWith('devoir')) {
        matieres[n.matiere_id].devoirs.push(parseFloat(n.note));
      }
    });

    let totalPoints = 0;
    let totalCoeff = 0;
    const details = [];

    Object.values(matieres).forEach(matiere => {
      const moyenne_devoirs = matiere.devoirs.length > 0
        ? matiere.devoirs.reduce((sum, d) => sum + d, 0) / matiere.devoirs.length
        : null;

      let moyenne_matiere = null;
      if (moyenne_devoirs !== null && matiere.examen !== null) {
        moyenne_matiere = (moyenne_devoirs * 0.4) + (matiere.examen * 0.6);
      } else if (moyenne_devoirs !== null) {
        moyenne_matiere = moyenne_devoirs;
      } else if (matiere.examen !== null) {
        moyenne_matiere = matiere.examen;
      }

      if (moyenne_matiere !== null) {
        totalPoints += moyenne_matiere * matiere.coefficient;
        totalCoeff += matiere.coefficient;
      }

      details.push({
        matiere: matiere.nom,
        coefficient: matiere.coefficient,
        moyenne_devoirs: moyenne_devoirs ? moyenne_devoirs.toFixed(2) : 'N/A',
        examen: matiere.examen ?? 'N/A',
        moyenne_matiere: moyenne_matiere ? moyenne_matiere.toFixed(2) : 'N/A'
      });
    });

    const moyenne_generale = totalCoeff > 0
      ? parseFloat((totalPoints / totalCoeff).toFixed(2))
      : 0;

    // Calculer le rang dans la classe
    const [tousEleves] = await db.query(
      'SELECT id FROM eleves WHERE classe_id = ?',
      [classe_id]
    );

    const moyennes = await Promise.all(tousEleves.map(async (e) => {
      const [n] = await db.query(
        `SELECT n.note, n.type_evaluation, m.coefficient
         FROM notes n
         JOIN matieres m ON n.matiere_id = m.id
         WHERE n.eleve_id = ? AND n.semestre_id = ?`,
        [e.id, semestre_id]
      );

      if (n.length === 0) return { id: e.id, moyenne: 0 };

      const mat = {};
      n.forEach(note => {
        if (!mat[note.matiere_id]) {
          mat[note.matiere_id] = { coefficient: note.coefficient, devoirs: [], examen: null };
        }
        if (note.type_evaluation === 'examen') {
          mat[note.matiere_id].examen = parseFloat(note.note);
        } else if (note.type_evaluation.startsWith('devoir')) {
          mat[note.matiere_id].devoirs.push(parseFloat(note.note));
        }
      });

      let tp = 0, tc = 0;
      Object.values(mat).forEach(m => {
        const md = m.devoirs.length > 0
          ? m.devoirs.reduce((s, d) => s + d, 0) / m.devoirs.length
          : null;
        let mm = null;
        if (md !== null && m.examen !== null) mm = (md * 0.4) + (m.examen * 0.6);
        else if (md !== null) mm = md;
        else if (m.examen !== null) mm = m.examen;
        if (mm !== null) { tp += mm * m.coefficient; tc += m.coefficient; }
      });

      return { id: e.id, moyenne: tc > 0 ? parseFloat((tp / tc).toFixed(2)) : 0 };
    }));

    const rang = moyennes
      .sort((a, b) => b.moyenne - a.moyenne)
      .findIndex(e => e.id === parseInt(eleve_id)) + 1;

    // Sauvegarder ou mettre à jour le bulletin
    const [existing] = await db.query(
      'SELECT id FROM bulletins WHERE eleve_id = ? AND semestre_id = ?',
      [eleve_id, semestre_id]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE bulletins SET moyenne_generale = ?, rang = ? WHERE eleve_id = ? AND semestre_id = ?',
        [moyenne_generale, rang, eleve_id, semestre_id]
      );
    } else {
      await db.query(
        'INSERT INTO bulletins (eleve_id, classe_id, semestre_id, moyenne_generale, rang) VALUES (?, ?, ?, ?, ?)',
        [eleve_id, classe_id, semestre_id, moyenne_generale, rang]
      );
    }

    const mention = getMention(moyenne_generale);
    const alerte = moyenne_generale < 10 ? 'Moyenne insuffisante, élève en difficulté !' : null;

    res.json({ eleve_id, semestre_id, moyenne_generale, rang, mention, alerte, details });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getBulletin = async (req, res) => {
  try {
    const { eleve_id, semestre_id } = req.params;

    const [bulletins] = await db.query(
      `SELECT b.*, e.name as eleve_nom, s.nom as semestre, c.nom as classe
       FROM bulletins b
       JOIN eleves e ON b.eleve_id = e.id
       JOIN semestres s ON b.semestre_id = s.id
       JOIN classes c ON b.classe_id = c.id
       WHERE b.eleve_id = ? AND b.semestre_id = ?`,
      [eleve_id, semestre_id]
    );

    if (bulletins.length === 0) {
      return res.status(404).json({ message: 'Bulletin non trouvé, générez le dabord' });
    }

    res.json(bulletins[0]);

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};