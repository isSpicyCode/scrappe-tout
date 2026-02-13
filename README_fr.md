# Scrappe-Tout

[![English Version](https://img.shields.io/badge/🇬🇧_Version-English-red)](./README.md)
[![Licence: MIT](https://img.shields.io/badge/Licence-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![npm version](https://img.shields.io/github/package-json/v/isSpicyCode/scrappe-tout)](https://github.com/isSpicyCode/scrappe-tout)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](./tests/)

Scraper web ultra-rapide avec Playwright qui convertit les pages HTML en format Markdown propre. Conçu pour l'archivage de documentation et les workflows RAG (Retrieval-Augmented Generation).

**Fonctionne parfaitement dans :**
- Terminaux interactifs (bash, zsh, fish, etc.) avec menu TUI
- Claude Code / assistants de codage IA (détection automatique du mode non-interactif)
- Pipelines CI/CD et workflows automatisés

## Fonctionnalités

- **Haute Performance** : Moyenne de 0,8-1,2 secondes par URL avec Playwright
- **Sortie Propre** : Supprime les menus de navigation, tables des matières dupliquées et éléments inutiles
- **Noms de Fichiers Intelligents** : Génère des noms de fichiers courts et lisibles à partir des chemins d'URL
- **Mode Hybride** : Détection automatique du mode terminal interactif vs non-interactif
- **Blocage de Ressources** : Bloque plus de 10 patterns de ressources (pubs, analytics, tracking) pour un scraping plus rapide
- **Optimisation Markdown** : Table des matières unique préservée pour les applications RAG
- **Traitement par Lots** : Traite plusieurs URLs séquentiellement avec suivi de progression

## Prérequis

- **Node.js 18+** - [Télécharger depuis nodejs.org](https://nodejs.org/) ou installer via gestionnaire de paquets :
  ```bash
  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  
  # macOS (avec Homebrew)
  brew install node
  
  # Ou utiliser nvm (recommandé)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 18
  ```
- npm ou yarn (inclus avec Node.js)

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/isSpicyCode/scrappe-tout.git
cd scrappe-tout

# Installer les dépendances
npm install

# Installer les navigateurs Playwright
npx playwright install chromium
```

## Utilisation

### Démarrage Rapide

1. Ajoutez vos URLs à scraper dans le fichier `urls.txt` (une URL par ligne) :
```
https://example.com/docs/getting-started
https://example.com/docs/installation
https://example.com/docs/architecture
```

2. Lancez le scraper :
```bash
npm start
```

**Affichage de la progression :**
```
[1/30] [100%] [████████████████████████████] https://example.com/docs/getting-started (1s)
[2/30] [100%] [████████████████████████████] https://example.com/docs/installation (1s)
[3/30] [100%] [████████████████████████████] https://example.com/docs/architecture (1s)
```
Chaque URL affiche sa propre barre de progression atteignant 100%, puis passe à la ligne suivante.

### Mode Interactif (Terminal)

Lors de l'exécution dans un terminal interactif, le comportement dépend de l'existence d'un fichier `scrap-folder-name.txt` :

**Si `scrap-folder-name.txt` existe :**
- Le nom du dossier depuis le fichier est utilisé automatiquement
- Le menu est contourné

**Si pas de fichier `scrap-folder-name.txt` :**
- Un menu TUI apparaît pour la sélection du dossier :

```
============================================================
  FOLDER MENU - Select an option
============================================================
  Existing folders:
    1. my-files-docs
    2. scrap [default]

  Options:
    N - Create new folder (default: "scrap")
    D - Use default folder
    X - Delete existing folder
    Q - Quit
============================================================
Your choice:
```

Options :
- **N** : Créer un nouveau dossier avec nom personnalisé
- **D** : Utiliser le dossier par défaut "scrap"
- **1, 2, ...** : Utiliser un dossier existant
- **X** : Supprimer un dossier existant
- **Q** : Quitter

### Mode Non-Interactif (Claude Code, CI)

Dans les environnements non-interactifs (Claude Code, CI/CD), le nom du dossier est déterminé automatiquement :

**Ordre de priorité :**
1. **Fichier `scrap-folder-name.txt`** (s'il existe)
   ```bash
   # Créer le fichier avec le nom du dossier
   echo "my-documentation" > scrap-folder-name.txt
   
   # Lancer le scraper
   npm start
   ```

2. **Timestamp automatique** (si aucun fichier n'existe)
   - Crée automatiquement un dossier horodaté (ex: `scrap-2026-02-13T10-49-30`)
   - Garantit l'absence de conflits entre les exécutions

### Priorité du Nom de Dossier

Le scraper détermine le nom du dossier dans cet ordre :
1. 🥇 **Flag `--name`** (si fourni) - Priorité la plus haute
2. 🥈 **Fichier `scrap-folder-name.txt`** (s'il existe) - Fonctionne en mode interactif et non-interactif
3. 🥉 **Menu interactif** (si le terminal est interactif ET qu'aucun fichier n'existe)
4. ⏰ **Timestamp** (solution de repli si rien d'autre n'est disponible)

### Options en Ligne de Commande

```bash
# Spécifier un répertoire de sortie personnalisé
npm start -- --output-dir /chemin/vers/sortie

# Afficher l'aide
npm start -- --help
```

## Structure de Sortie

```
captures/
├── my-files-docs/
│   ├── inspector.md
│   ├── memory.md
│   ├── performance.md
│   └── ...
└── scrap-2026-02-13T10-49-30/
    ├── ui.md
    ├── components.md
    └── ...
```

Chaque URL génère un seul fichier Markdown avec :
- Contenu propre (sans navigation, publicités ou encombrement)
- Table des matières préservée pour les applications RAG
- Nom de fichier court basé sur le dernier segment du chemin URL

## Configuration

### Blocage de Ressources

Le scraper bloque automatiquement ces patterns de ressources pour un chargement plus rapide :
- Scripts d'analytics et de tracking
- Réseaux publicitaires
- Widgets de réseaux sociaux
- Polices et feuilles de style depuis les CDN
- Images (peut être activé dans la config)

### Personnaliser les Ressources Bloquées

Éditez `src/core/scraper.js` pour modifier le tableau `RESOURCE_PATTERNS`.

## Performance

| Métrique | Valeur |
|----------|--------|
| Moyenne par URL | 0,8-1,2 secondes |
| Compression HTML | Réduction de taille de 80-95% |
| Vitesse de conversion | 10-20x plus rapide que les scripts à fichier unique |
| Traitement parallèle | Séquentiel (prévient la limitation de débit) |

## Structure du Projet

```
scrappe-tout/
├── src/
│   ├── core/
│   │   ├── scraper.js          # Logique de scraping Playwright
│   │   ├── converter.js        # Conversion HTML vers Markdown
│   │   ├── writer.js           # Écriture de fichiers avec nommage intelligent
│   │   ├── postprocessor.js    # Nettoyage de contenu
│   │   ├── logger.js           # Utilitaires de logging
│   │   └── navigation-cleaner.js   # Patterns de navigation et suppression
│   ├── services/
│   │   ├── config.js           # Gestion de configuration
│   │   ├── retry.js            # Logique de retry avec backoff exponentiel
│   │   ├── error.js            # Gestion d'erreurs
│   │   ├── urls.js             # Lecture et validation d'URLs
│   │   ├── pipeline.js         # Orchestration du pipeline de scraping
│   │   └── path.js             # Gestion des répertoires de sortie
│   ├── utils/
│   │   ├── cli.js              # Parsing d'arguments en ligne de commande
│   │   ├── menu.js             # Menu TUI interactif
│   │   ├── display.js          # Formatage de durée et barre de progression
│   │   ├── stats.js            # Génération de statistiques
│   │   ├── timestamp.js        # Utilitaires de timestamp
│   │   └── constants.js        # Constantes de l'application
│   └── index.js                 # Point d'entrée principal (orchestration uniquement)
├── tests/
│   ├── e2e/
│   │   └── scraping.test.js     # Tests de workflow end-to-end
│   ├── unit/
│   │   ├── cli.test.js         # Tests du parseur CLI
│   │   ├── display.test.js     # Tests des utilitaires d'affichage
│   │   └── stats.test.js       # Tests des statistiques
│   └── fixtures/
│       └── test-urls.txt       # Exemples d'URLs pour les tests
├── urls.txt                     # URLs à scraper (une par ligne)
├── scrap-folder-name.txt        # Nom de dossier de sortie personnalisé
└── package.json
```

## Remerciements

Construit avec :
- [Playwright](https://playwright.dev/) - Automatisation web rapide et fiable
- [mdream](https://www.npmjs.com/package/mdream) - Conversion HTML vers Markdown
- [Biome](https://biomejs.dev/) - Linting et formatage

## Dépannage

### Navigateurs Playwright non installés
```bash
npx playwright install chromium
```

### Erreurs de permissions sur Linux
```bash
# Installer les dépendances requises
sudo npx playwright install-deps chromium
```

### Scraping vide ou échoué
- Vérifiez que les URLs dans `urls.txt` sont accessibles
- Certains sites peuvent nécessiter une authentification ou bloquer l'accès automatisé
- Essayez d'ajouter des délais ou de réduire la concurrence pour les sites avec limitation de débit

### Erreurs de modules non trouvés
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

## Licence

Licence MIT - voir le fichier LICENSE pour les détails.

Copyright (c) 2026 Spicycode - Contributeurs Scrappe-Tout
