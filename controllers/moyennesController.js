const db = require('../db/connection');

exports.getMoyenneEleve = async (req, res) => {
  try {
    const { eleve_id, semestre_id } = req.params;

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

    // Grouper les notes par matière
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

    // Calculer moyenne par matière
    let totalPoints = 0;
    let totalCoeff = 0;
    const details = [];

    Object.values(matieres).forEach(matiere => {
      let moyenne_matiere = null;

      const moyenne_devoirs = matiere.devoirs.length > 0
        ? matiere.devoirs.reduce((sum, d) => sum + d, 0) / matiere.devoirs.length
        : null;

      if (moyenne_devoirs !== null && matiere.examen !== null) {
        // 2 composantes : devoirs 40% + examen 60%
        moyenne_matiere = (moyenne_devoirs * 0.4) + (matiere.examen * 0.6);
      } else if (moyenne_devoirs !== null) {
        // Seulement des devoirs
        moyenne_matiere = moyenne_devoirs;
      } else if (matiere.examen !== null) {
        // Seulement un examen
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
      ? (totalPoints / totalCoeff).toFixed(2)
      : 0;

    res.json({ eleve_id, semestre_id, moyenne_generale, details });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getRangsClasse = async (req, res) => {
  try {
    const { classe_id, semestre_id } = req.params;

    const [eleves] = await db.query(
      'SELECT * FROM eleves WHERE classe_id = ?',
      [classe_id]
    );

    const resultats = await Promise.all(eleves.map(async (eleve) => {
      const [notes] = await db.query(
        `SELECT n.note, n.type_evaluation, m.coefficient, m.id as matiere_id
         FROM notes n
         JOIN matieres m ON n.matiere_id = m.id
         WHERE n.eleve_id = ? AND n.semestre_id = ?`,
        [eleve.id, semestre_id]
      );

      if (notes.length === 0) return { ...eleve, moyenne: 0 };

      // Grouper par matière
      const matieres = {};
      notes.forEach(n => {
        if (!matieres[n.matiere_id]) {
          matieres[n.matiere_id] = { coefficient: n.coefficient, devoirs: [], examen: null };
        }
        if (n.type_evaluation === 'examen') {
          matieres[n.matiere_id].examen = parseFloat(n.note);
        } else {
          matieres[n.matiere_id].devoirs.push(parseFloat(n.note));
        }
      });

      let totalPoints = 0;
      let totalCoeff = 0;

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
      });

      const moyenne = totalCoeff > 0
        ? parseFloat((totalPoints / totalCoeff).toFixed(2))
        : 0;

      return { ...eleve, moyenne };
    }));

    const rangs = resultats
      .sort((a, b) => b.moyenne - a.moyenne)
      .map((eleve, index) => ({ ...eleve, rang: index + 1 }));

    res.json(rangs);

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};