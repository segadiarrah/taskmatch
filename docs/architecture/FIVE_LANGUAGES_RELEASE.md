# TaskMatch — interface complète en cinq langues

Date : 17 novembre 2026. Base : `9466aa3`.
Branche : `feat/five-languages-20261117`. Code livré : `c6dba77`.

## Périmètre

Anglais, français, chinois simplifié, espagnol et portugais sont disponibles sur
les pages publiques, l'authentification et les espaces client, développeur,
intervenant et administrateur. Le portugais utilise le code générique `pt` avec
une rédaction et des formats brésiliens. Le choix est mémorisé et les préférences
régionales du navigateur sont reconnues, notamment pt-BR, pt-PT, zh-Hans-CN,
es-419 et fr-Latn-FR.

Les anciens blocs volontairement anglais sont supprimés : les seize vues admin,
les six articles complets et les six versions du changelog disposent des cinq
langues. Titres, descriptions, formulaires, accessibilité, confirmations, états,
erreurs connues, exigences de livraison, dates et montants suivent la langue.
Les titres/descriptions réinjectés par Next lors d'une navigation restent
localisés. Le sélecteur est disponible aussi dans l'en-tête de l'espace connecté.
Les missions et profils peuvent choisir le portugais comme langue de travail ;
les dix-huit catégories du catalogue ont un libellé portugais.

Les noms propres, identifiants, codes API, exemples exécutables et contenus saisis
par les utilisateurs restent intacts. La devise et les règles financières ne sont
pas modifiées. Les textes publics ne nomment pas le prestataire de paiement.
Les API conservent leurs valeurs techniques et leurs détails originaux ; la couche
UI localise les erreurs connues et garde un message générique pour les autres.

## Contrôles

- `npm run check` passe : types, lint, **18 tests unitaires**, contrat de traduction,
  métadonnées, style et contraste.
- Contrat statique étendu à cinq langues : parité des clés, validations des appels
  de traduction admin et interdiction des anciennes exemptions English-only.
  Les catalogues éditoriaux sont contrôlés comme ensembles de cinq langues ;
  les tests vérifient chaque paragraphe, puce, section, slug, date et bloc de code.
- **175 tests navigateur passants sur l'image de production**, quatre scénarios
  optionnels demandant des comptes externes ignorés. La matrice publique visite
  24 surfaces dans les cinq langues ; les scénarios admin, client, développeur,
  articles, métadonnées tardives, erreurs, consentements et brouillons sont inclus.
- **Deux scénarios portugais supplémentaires passants** : paiement/recevabilité et
  dépôt/téléchargement d'une photo privée. Aucun appel bancaire réel utilisé.
- **32 tests backend passants** sur PostgreSQL isolé : catalogue, langue pt,
  profils, éligibilité, Human Tasks et portail. L'inscription portugaise ne
  contourne pas la vérification d'identité ni l'éligibilité aux paiements.
- Les **158 fichiers produit frontend** de l'image testée ont été comparés par
  SHA-256 au worktree : aucune différence.
- Builds Docker frontend/backend réussis, dépendances inchangées ; contrôle npm
  des dépendances de production : zéro vulnérabilité connue lors du contrôle.
- Revue indépendante : locales BCP47, erreurs métier, métadonnées streamées,
  profils pt au premier chargement, seize vues admin et facteurs de matching.
  Les scores restent des valeurs sur 100 ; aucun score d'expérience n'est affiché
  comme un nombre réel de tâches réalisées.

## Mise en production

Livraison effectuée sur **https://taskmatch.ai** le **17 novembre 2026 à
21:42:54 UTC**. Images frontend et backend `five-languages-20261117`.
Les candidats ont servi les requêtes pendant le remplacement des services
principaux, puis le proxy a été rechargé vers les instances définitives.

- Sauvegarde PostgreSQL au format archive vérifiée par `pg_restore --list` ;
  configuration, anciennes images et bundle Git préservés dans un répertoire
  privé. Aucun secret dans le dépôt ni dans ce rapport.
- Deux séries de **45 sondes de disponibilité réussies sur 45**, l'une pendant
  la bascule vers les candidats, l'autre pendant le remplacement et la bascule
  définitive. Cette observation ne constitue pas une garantie générale de SLA.
- Contrôle navigateur répété sur les instances définitives : **15 pages publiques**
  réparties entre les cinq langues, métadonnées, cinq options du sélecteur,
  persistance au rechargement, absence de débordement horizontal et de nom du
  prestataire dans les textes publics contrôlés. **Zéro erreur navigateur**.
- Catalogue public : **18 catégories sur 18** disposent d'un libellé portugais.
- **10 pages connectées** visitées dans les cinq langues sur un compte actif
  existant : espace humain et tableau d'administration. Titres, attributs de
  langue et sélecteur vérifiés ; zéro erreur navigateur, zéro échec d'appel API
  et **zéro écriture**. La session temporaire de contrôle a été supprimée du disque.
- Captures mobiles portugais/chinois inspectées. API et worker financier sains ;
  PostgreSQL, Redis et découverte publique opérationnels. Candidats et conteneur
  de test arrêtés puis supprimés après la bascule.

Aucune migration SQL requise : le schéma reste en **008**. Après livraison :
**33 jobs et 135 tâches**, aucun Principal, profil d'intervenant, financement de
job, autorisation financière ou abonnement webhook créé par les contrôles.
Seuls les libellés du catalogue changent au backend ; les nouvelles instances
rechargent ce fichier lu à l'import. Les modifications mobiles et README déjà
présentes en production sont préservées.

Le site réutilise ses URL existantes et sa sélection de langue côté navigateur.
Les métadonnées dans le navigateur suivent le choix ; le HTML initial et les URL
canoniques gardent le fonctionnement anglais existant. Aucune traduction
automatique du contenu privé des utilisateurs et aucun nouveau routage SEO par
langue n'ont été introduits.

Les journaux de validation et preuves de déploiement sont archivés hors dépôt,
sous accès privé. Les résultats ci-dessus proviennent des commandes exécutées et
des contrôles navigateur ; ils ne sont pas présentés comme un résultat de CI
hébergée ni comme une validation de transactions bancaires réelles.
