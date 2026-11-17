# TaskMatch — cinq langues sur tout le site

## Demande et choix

L'utilisateur demande que tout le site soit disponible en anglais, français,
chinois, espagnol et portugais. L'exécution et le déploiement autonomes restent
explicitement autorisés dans cette conversation. Conserver les pages et parcours
existants, ajouter `pt` et « Português », compléter toutes les surfaces, y compris
les anciennes exceptions anglaises de l'administration, du blog et du changelog.
Utiliser un portugais naturel et cohérent sous le code générique `pt`.

## Architecture

Réutiliser LanguageProvider, localStorage, détection navigateur et HTML lang. Les
cinq dictionnaires et chaque paquet de textes possèdent des clés de même forme,
sans héritage anglais silencieux. Les contenus longs utilisent les paquets locaux
existants. Les articles et actualités ont une version dans chaque langue ; leurs
slugs, dates et identifiants restent stables. Les métadonnées visibles suivent la
langue sélectionnée sans ajouter de nouveaux préfixes d'URL ni casser les liens.

Traduire navigation, titres, boutons, labels, accessibilité, formulaires, messages
de validation/erreur, chargement/vide, états connus, confirmations, textes légaux,
explications API/SDK et contenus éditoriaux. Conserver codes exécutables, valeurs
API, noms propres et textes saisis par les utilisateurs. Les nombres et dates
suivent la locale ; la devise et les plafonds financiers restent inchangés.
Le nom du prestataire de paiement reste absent des textes publics.

Le portugais doit aussi être proposé comme langue de travail des missions et des
intervenants ; les catégories du catalogue disposent de libellés portugais.
Aucune modification du ledger, des permissions ou des données de production.

## Vérification et livraison

Supprimer les exceptions english-only du contrôle des surfaces demandées, étendre
les tests de parité et les fixtures à cinq langues, vérifier les traductions dans
le navigateur sur toutes les familles de routes et tous les rôles. Tester le
changement de langue, sa persistance, la détection pt-BR/pt-PT, les messages, les
articles et les vues admin. Contrôler les débordements mobiles et conserver les
tests métier existants. Tests statiques, types, lint, build et régressions frontend
avant bascule avec candidat frontend et sauvegarde. Aucun consentement ni paiement
réel créé pour les tests. Rapport de validation et contrôles publics après livraison.
