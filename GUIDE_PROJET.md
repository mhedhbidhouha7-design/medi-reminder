# 📖 Medi-Reminder : La Bible du Projet (Architecture & Fonctionnement)

Ce document est un résumé total de l'application. Il explique non seulement ce que contient chaque dossier, mais aussi comment ils communiquent entre eux.

---

## 🌟 1. Concept Global
**Medi-Reminder** est une solution de santé connectée. Elle ne se limite pas à une application mobile ; elle possède également une logique serveur pour les notifications complexes et la gestion des données en temps réel via Firebase.

---

## 🏗️ 2. Architecture : Le Modèle "MVC + Services"
Le projet suit une structure organisée pour éviter que le code ne devienne un "plat de spaghettis" :

1.  **MODEL (Données)** : Définit "Quoi" (la structure des médicaments, médecins, etc.).
2.  **VIEW (Interface)** : Affiche "Comment" (le design, les boutons, les listes).
3.  **CONTROLLER (Logique)** : Décide "Quand" (ajoute un médicament, connecte un utilisateur).
4.  **SERVICES (Outils)** : Gère le "Technique" (envoi d'email, calcul de rappels, sonneries).

---

## 📂 3. Cartographie Complète des Dossiers

### 📁 Racine (Root)
*   `app.json` : Carte d'identité de l'app (nom, icône, permissions).
*   `firebaseConfig.js` : Point d'entrée principal pour la base de données.
*   `package.json` : Liste de toutes les bibliothèques installées (Expo, Firebase, etc.).

### 📁 `app/` (La Vue - Navigation)
C'est ici que bat le cœur de l'interface. Utilise **Expo Router**.
*   `index.tsx` : Premier écran lancé (souvent la redirection vers Login ou Home).
*   `(auth)/` : Contient les écrans de connexion et d'inscription.
*   `(app)/` : Contient les écrans une fois connecté (Dashboard, Liste des médicaments, Profil).
*   `_layout.tsx` : Définit le squelette global (Menu du bas, Thème).

### 📁 `components/` (La Vue - Éléments)
Contient des petits morceaux d'interface réutilisables (ex: un bouton personnalisé, une carte de rappel) pour ne pas répéter le code.

### 📁 `controllers/` (Le Contrôleur)
C'est le cerveau. Aucun écran (`app/`) ne doit toucher directement à Firebase. Ils appellent les contrôleurs :
*   `authController.ts` : Gère les comptes.
*   `medicationController.ts` : Gère les CRUD (Ajout/Modif/Suppression) des médicaments.

### 📁 `models/` (Le Modèle)
*   `interfaces.ts` : Définit les types TypeScript. Si un jour vous ajoutez un champ "Prix" à un médicament, c'est ici qu'on le déclare.

### 📁 `services/` (Les Services techniques)
Ils gèrent les tâches lourdes ou spécifiques :
*   `notificationService.ts` : Planifie les alertes sur le téléphone.
*   `emailService.ts` : Envoie des alertes aux proches via EmailJS.
*   `audioService.ts` : Joue la voix ou le son de rappel.
*   `i18n.ts` : Gère le multilingue (Français/Arabe/Anglais).

### 📁 `hooks/` (Les Hooks personnalisés)
Contient de la logique React réutilisable, comme `use-app-theme.tsx` qui permet à n'importe quel écran de savoir si on est en mode "Clair" ou "Sombre".

### 📁 `constants/` (Le Design System)
*   `theme.ts` : Contient toutes les couleurs et polices officielles de l'app.
*   `locales/` : Contient les fichiers JSON avec toutes les phrases traduites.

### 📁 `utils/` (Les outils d'aide)
Petites fonctions utilitaires, comme `dateHelpers.ts` qui transforme une date complexe en format lisible (ex: "14:30").

### 📁 `assets/` (Les Ressources)
Images, logos, icônes et fichiers audio pour les rappels.

### 📁 `functions/` & `server/` (Le Backend)
*   `functions/` : Scripts qui s'exécutent sur les serveurs de Firebase (Cloud Functions).
*   `server/` : Un serveur Node.js séparé (souvent utilisé pour des tests ou des notifications poussées).

---

## 🔄 4. Les Relations : Qui parle à qui ?

Voici le chemin d'une action type (ex: Prendre un médicament) :

1.  **L'Utilisateur** clique sur le bouton "Pris" dans **`app/(app)/medications/index.tsx`** (VIEW).
2.  **La Vue** appelle la fonction `toggleMedicationDose` dans **`controllers/medicationController.ts`** (CONTROLLER).
3.  **Le Contrôleur** regarde la structure dans **`models/interfaces.ts`** (MODEL) pour vérifier que la donnée est correcte.
4.  **Le Contrôleur** met à jour **Firebase**.
5.  **Le Contrôleur** appelle **`services/notificationService.ts`** (SERVICE) pour annuler le rappel car le médicament a été pris.
6.  **Le Service** utilise **`constants/locales/`** pour afficher un message de succès dans la bonne langue.

---

## 💡 5. Pourquoi cette structure ?

*   **TSX (TypeScript)** : Indispensable pour éviter les bugs. Si vous oubliez une donnée obligatoire, le code refuse de compiler.
*   **Expo** : Permet de tester l'app instantanément sur votre propre téléphone via un QR Code, sans passer par des câbles complexes.
*   **Séparation des dossiers** : Si vous avez un bug dans les notifications, vous savez exactement qu'il faut regarder dans `services/` et non dans `app/`.

---

## 🛠️ 6. Guide de survie du Développeur

*   **Ajouter une page ?** Créez un fichier `.tsx` dans `app/(app)/`.
*   **Modifier une couleur ?** Allez dans `constants/theme.ts`.
*   **Ajouter une traduction ?** Allez dans `constants/locales/`.
*   **Changer la logique de sauvegarde ?** Modifiez le fichier correspondant dans `controllers/`.
