# Deafissance – Base de connaissances interactive

Cette application front-end fournit une interface élégante pour structurer une base de connaissances orientée parcours décisionnels (A → B → C, etc.). Elle est prête pour GitHub Pages : il suffit de publier le contenu du dépôt pour obtenir un site statique interactif.

## Fonctionnalités principales

- ✨ **Mode administration** activable via l'icône "utilisateur" : permet d'ajouter/modifier les catégories, connaissances et étapes.
- 📁 **Gestion des catégories et des connaissances** avec listes hiérarchiques.
- 🌳 **Construction de parcours** en arbre avec embranchements illimités.
- ✅ **Marqueur "Fin de chemin"** pour repérer les réponses finales.
- 📊 **Suivi de progression** : calcul automatique du pourcentage de chemins finalisés et liste des parcours à compléter.
- 💾 **Sauvegarde automatique** dans le `localStorage` du navigateur.

## Démarrage rapide

1. Ouvrez `index.html` dans un navigateur moderne (Chrome, Edge, Firefox, Safari).
2. Activez/désactivez le mode administration via l'icône d'utilisateur en haut à gauche.
3. Créez vos catégories, connaissances et étapes directement depuis l'interface.

> 💡 Les données sont stockées localement dans votre navigateur. Pour repartir d'une base vierge, videz le stockage du site dans les outils de développement.

## Déploiement sur GitHub Pages

1. Activez GitHub Pages sur la branche contenant ces fichiers.
2. Choisissez la racine du dépôt (`/`) comme source.
3. Après quelques minutes, votre base de connaissances sera accessible depuis l'URL GitHub Pages fournie.

## Développement

Aucune dépendance externe ni étape de build n'est nécessaire. Le projet est composé de trois fichiers :

- `index.html` – structure de la page
- `styles.css` – mise en forme
- `app.js` – logique interactive

Vous pouvez personnaliser librement ces fichiers pour adapter l'outil à vos besoins métiers.
