const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
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

app.get('/', (req, res) => {
  res.json({ message: 'NotesPro API en marche !' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});