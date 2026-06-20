const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:8000', 'http://localhost:8000'],
  credentials: true
}));

app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const matiereRoutes = require('./routes/matieres');
app.use('/api/matieres', matiereRoutes);

const classeRoutes = require('./routes/classes');
app.use('/api/classes', classeRoutes);

const notesRoutes = require('./routes/notes');
app.use('/api/notes', notesRoutes);

const moyennesRoutes = require('./routes/moyennes');
app.use('/api/moyennes', moyennesRoutes);

const bulletinsRoutes = require('./routes/bulletins');
app.use('/api/bulletins', bulletinsRoutes);

const consultationRoutes = require('./routes/consultation');
app.use('/api/consultation', consultationRoutes);

const enseignantRoutes = require('./routes/enseignants');
app.use('/api/enseignants', enseignantRoutes);

const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);

const db = require('./db/connection');
app.get('/api/semestres', async (req, res) => {
  try {
    const [semestres] = await db.query('SELECT * FROM semestres ORDER BY id DESC');
    res.json(semestres);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.post('/api/semestres', async (req, res) => {
  try {
    const { nom, annee_scolaire, date_debut, date_fin } = req.body;
    const [result] = await db.query(
      'INSERT INTO semestres (nom, annee_scolaire, date_debut, date_fin) VALUES (?, ?, ?, ?)',
      [nom, annee_scolaire, date_debut, date_fin]
    );
    res.status(201).json({ id: result.insertId, nom, annee_scolaire, date_debut, date_fin });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'NotesPro API en marche !' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});