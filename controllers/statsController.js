const db = require('../db/connection');

const getMention = (moyenne) => {
  if (moyenne >= 16) return 'Excellent';
  if (moyenne >= 14) return 'Très Bien';
  if (moyenne >= 12) return 'Bien';
  if (moyenne >= 10) return 'Passable';
  return 'Insuffisant';
};

exports.getStatsClasse = async (req, res) => {
  try {
    const { classe_id, semestre_id } = req.params;

    // Récupérer tous les élèves de la classe
    const [eleves] = await db.query(
      'SELECT * FROM eleves WHERE classe_id = ?',
      [classe_id]
    );

    if (eleves.length === 0) {
      return res.status(404).json({ message: 'Aucun élève dans cette classe' });
    }

    // Calculer la moyenne de chaque élève
    const resultats = await Promise.all(eleves.map(async (eleve) => {
      const [notes] = await db.query(
        `SELECT n.note, n.type_evaluation, m.coefficient, m.id as matiere_id
         FROM notes n
         JOIN matieres m ON n.matiere_id = m.id
         WHERE n.eleve_id = ? AND n.semestre_id = ?`,
        [eleve.id, semestre_id]
      );

      if (notes.length === 0) return { ...eleve, moyenne: null };

      const matieres = {};
      notes.forEach(n => {
        if (!matieres[n.matiere_id]) {
          matieres[n.matiere_id] = { coefficient: n.coefficient, devoirs: [], examen: null };
        }
        if (n.type_evaluation === 'examen') {
          matieres[n.matiere_id].examen = parseFloat(n.note);
        } else if (n.type_evaluation.startsWith('devoir')) {
          matieres[n.matiere_id].devoirs.push(parseFloat(n.note));
        }
      });

      let totalPoints = 0, totalCoeff = 0;
      Object.values(matieres).forEach(m => {
        const md = m.devoirs.length > 0
          ? m.devoirs.reduce((s, d) => s + d, 0) / m.devoirs.length
          : null;
        let mm = null;
        if (md !== null && m.examen !== null) mm = (md * 0.4) + (m.examen * 0.6);
        else if (md !== null) mm = md;
        else if (m.examen !== null) mm = m.examen;
        if (mm !== null) { totalPoints += mm * m.coefficient; totalCoeff += m.coefficient; }
      });

      const moyenne = totalCoeff > 0 ? parseFloat((totalPoints / totalCoeff).toFixed(2)) : null;
      return { ...eleve, moyenne };
    }));

    // Filtrer les élèves avec des notes
    const avecNotes = resultats.filter(e => e.moyenne !== null);

    if (avecNotes.length === 0) {
      return res.status(404).json({ message: 'Aucune note saisie pour cette classe' });
    }

    // Calculs statistiques
    const moyennes = avecNotes.map(e => e.moyenne);
    const moyenneClasse = parseFloat((moyennes.reduce((s, m) => s + m, 0) / moyennes.length).toFixed(2));
    const moyenneMax = Math.max(...moyennes);
    const moyenneMin = Math.min(...moyennes);
    const nbReussi = avecNotes.filter(e => e.moyenne >= 10).length;
    const tauxReussite = parseFloat(((nbReussi / avecNotes.length) * 100).toFixed(2));

    // Meilleur élève
    const meilleurEleve = avecNotes.sort((a, b) => b.moyenne - a.moyenne)[0];

    // Distribution des mentions
    const mentions = {
      Excellent: avecNotes.filter(e => e.moyenne >= 16).length,
      'Très Bien': avecNotes.filter(e => e.moyenne >= 14 && e.moyenne < 16).length,
      Bien: avecNotes.filter(e => e.moyenne >= 12 && e.moyenne < 14).length,
      Passable: avecNotes.filter(e => e.moyenne >= 10 && e.moyenne < 12).length,
      Insuffisant: avecNotes.filter(e => e.moyenne < 10).length,
    };

    res.json({
      classe_id,
      semestre_id,
      nombre_eleves: eleves.length,
      nombre_avec_notes: avecNotes.length,
      moyenne_classe: moyenneClasse,
      moyenne_max: moyenneMax,
      moyenne_min: moyenneMin,
      taux_reussite: `${tauxReussite}%`,
      meilleur_eleve: {
        nom: meilleurEleve.nom,
        prenom: meilleurEleve.prenom,
        moyenne: meilleurEleve.moyenne,
        mention: getMention(meilleurEleve.moyenne)
      },
      distribution_mentions: mentions,
      alertes: avecNotes.filter(e => e.moyenne < 10).map(e => ({
        eleve: `${e.prenom} ${e.nom}`,
        moyenne: e.moyenne,
        message: 'Élève en difficulté !'
      }))
    });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};