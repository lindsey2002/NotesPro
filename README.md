# NotesPro — API de Gestion des Notes Scolaires

NotesPro est une API RESTful développée avec **Node.js / Express** pour la gestion
des notes, moyennes, rangs et bulletins scolaires. Elle s'intègre à la base de données
de l'établissement pour exploiter les données existantes (élèves, classes, utilisateurs).

---

## Technologies utilisées

- **Runtime** : Node.js
- **Framework** : Express.js
- **Base de données** : MySQL
- **Authentification** : JWT (JSON Web Token)
- **Hashage mot de passe** : bcryptjs
- **ORM** : mysql2 (requêtes natives)

---

## Prérequis

- Node.js v18+
- MySQL 5.7+
- npm

---

## Installation

### 1. Cloner le projet
```bash
git clone https://github.com/lindsey2002/NotesPro.git
cd NotesPro
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
Créer un fichier `.env` à la racine :
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gestion_depense_scolaire
JWT_SECRET=notepro_secret_key_2024
```

### 4. Créer les tables nécessaires
Exécuter le script SQL suivant dans votre base de données :

```sql
CREATE TABLE semestres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  annee_scolaire VARCHAR(20) NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matieres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  coefficient INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  eleve_id BIGINT UNSIGNED NOT NULL,
  matiere_id INT NOT NULL,
  classe_id BIGINT UNSIGNED NOT NULL,
  semestre_id INT NOT NULL,
  note DECIMAL(5,2) NOT NULL,
  type_evaluation ENUM('devoir1','devoir2','devoir3','examen') NOT NULL DEFAULT 'devoir1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eleve_id) REFERENCES eleves(id),
  FOREIGN KEY (matiere_id) REFERENCES matieres(id),
  FOREIGN KEY (classe_id) REFERENCES classes(id),
  FOREIGN KEY (semestre_id) REFERENCES semestres(id)
);

CREATE TABLE bulletins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  eleve_id BIGINT UNSIGNED NOT NULL,
  classe_id BIGINT UNSIGNED NOT NULL,
  semestre_id INT NOT NULL,
  moyenne_generale DECIMAL(5,2),
  rang INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eleve_id) REFERENCES eleves(id),
  FOREIGN KEY (classe_id) REFERENCES classes(id),
  FOREIGN KEY (semestre_id) REFERENCES semestres(id)
);
```

### 5. Lancer le serveur
```bash
node index.js
```
Le serveur démarre sur **http://localhost:3000**

---

## Structure du projet

NotesPro/
├── controllers/
│   ├── authController.js        # Authentification
│   ├── matiereController.js     # CRUD matières
│   ├── classeController.js      # Consultation classes
│   ├── notesController.js       # Saisie des notes
│   ├── moyennesController.js    # Calcul moyennes et rangs
│   ├── bulletinsController.js   # Génération bulletins
│   └── consultationController.js # Consultation parent/élève
├── routes/
│   ├── auth.js
│   ├── matieres.js
│   ├── classes.js
│   ├── notes.js
│   ├── moyennes.js
│   ├── bulletins.js
│   └── consultation.js
├── middleware/
│   └── auth.js                  # Vérification token JWT
├── db/
│   └── connection.js            # Connexion MySQL
├── index.js                     # Point d'entrée
├── .env                         # Variables d'environnement
└── package.json

---

## Endpoints de l'API

### Authentification
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/login | Connexion utilisateur |

### Matières
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /api/matieres | Liste des matières |
| POST | /api/matieres | Créer une matière |
| PUT | /api/matieres/:id | Modifier une matière |
| DELETE | /api/matieres/:id | Supprimer une matière |

### Classes
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /api/classes | Liste des classes |
| GET | /api/classes/:id/eleves | Élèves d'une classe |

### Notes
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/notes | Saisir une note |
| GET | /api/notes/classe/:classe_id/matiere/:matiere_id/semestre/:semestre_id | Notes par classe et matière |
| PUT | /api/notes/:id | Modifier une note |
| DELETE | /api/notes/:id | Supprimer une note |

### Moyennes & Rangs
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /api/moyennes/eleve/:eleve_id/semestre/:semestre_id | Moyenne d'un élève |
| GET | /api/moyennes/classe/:classe_id/semestre/:semestre_id | Rangs d'une classe |

### Bulletins
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/bulletins/generer/:eleve_id/:semestre_id | Générer un bulletin |
| GET | /api/bulletins/:eleve_id/:semestre_id | Consulter un bulletin |

### Consultation Parent/Élève
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /api/consultation/parent/:parent_id | Enfants d'un parent |
| GET | /api/consultation/eleve/:eleve_id | Dossier complet d'un élève |

---

## Calcul des moyennes

### Moyenne par matière
La moyenne par matière est calculée dynamiquement selon le nombre de devoirs saisis :

moyenne_devoirs = somme(devoirs) / nombre(devoirs)
moyenne_matière = (moyenne_devoirs × 40%) + (examen × 60%)

> Si seulement des devoirs sont saisis : moyenne = moyenne_devoirs
> Si seulement un examen est saisi : moyenne = note_examen

### Moyenne générale

moyenne_generale = somme(moyenne_matière × coefficient) / somme(coefficients)

---

## Authentification

Toutes les routes sont protégées par JWT sauf `/api/auth/login`.
Ajouter le token dans le header de chaque requête :

---

## Intégration base de données

NotesPro partage la base de données du système **Gestion Dépense Pension Scolaire**
et exploite les tables existantes suivantes :

- `users` — authentification des utilisateurs
- `eleves` — données des élèves
- `classes` — données des classes
- `parents` — données des parents

Les tables `semestres`, `matieres`, `notes` et `bulletins` sont propres à NotesPro.

---

## Auteur

- **Nom** : Koumba Mombo Heredia
- **Projet** : NotesPro — Gestion des Notes Scolaires
- **Technologie** : Node.js / Express / MySQL