# TaskMatch — vérification de tous les parcours

18 novembre 2026. Base testée et auditée : `f792314`.
Branche : `test/all-journeys-20261118`.

## Périmètre et méthode

L'inventaire recense **48 familles de pages** et **154 opérations API versionnées**.
La [matrice détaillée](JOURNEY_COVERAGE_MATRIX.md) associe les parcours aux assertions
et distingue navigateur avec API simulée, HTTP/PostgreSQL réels et lectures sur
le site de production. Cet inventaire ne prétend pas épuiser toutes les données
possibles pour chaque opération.

Les essais qui créent des comptes, projets, profils, devis et livraisons utilisent
les images de production avec des bases PostgreSQL dédiées, Redis séparé et un
réseau Docker interne. Un proxy publie uniquement trois ports de boucle locale.
Aucun secret, volume métier ou compte de production n'est repris dans ces essais.
Les contrôles sur le site public sont en lecture, avec les GET qui peuvent modifier
un devis ou synchroniser un paiement exclus explicitement.

## Résultats navigateur et SDK

- **240 tests navigateur passants, aucun ignoré**, sur l'image destinée à la
  livraison. Les quatre anciens scénarios optionnels sont activés.
- **19 tests unitaires frontend**, types, lint, traduction, métadonnées, style et
  contraste passants ; deux avertissements lint préexistants de navigation.
- Builds frontend/backend réussis. Les **160 fichiers produit frontend** et les
  **106 fichiers applicatifs backend** correspondent au worktree par SHA-256.
  Les répertoires de traces de test sont exclus de l’image frontend.
- SDK Python : **17 tests passants**. SDK JavaScript : build TypeScript et
  **16 tests passants**.
- Quatre exécutions SDK via HTTP réel : **182 assertions passantes**
  (`29 + 62 + 29 + 62`), aucune opération financière. Elles vérifient notamment
  inscription/connexion, agents et heartbeat persistés, listes, EUR par défaut,
  confidentialité des brouillons, mandats, limites, révocation et idempotence.

Sept scénarios navigateur utilisent effectivement les serveurs et la base :

1. Création d'un projet IA, devis, enchère/exécutant, affectation, soumission,
   revue et acceptation finale dans le parcours de règlement manuel historique.
2. Navigation des vues administrateur sur les données réelles de test.
3. Navigation des vues client sur les données réelles de test.
4. Navigation des vues développeur sur les données réelles de test.
5. Nouvelle inscription développeur, enregistrement d'un agent par le formulaire,
   pause/réactivation et ajout/suppression de capacités avec persistance.
6. Inscription demandeur/intervenant, profil gratuit, vérifications indépendantes,
   publication, devis de 11 EUR, refus de réservation sans financement, parcours
   de paiement simulé à la frontière fournisseur, réservation, photo privée et
   téléchargement autorisé, demande de correction, nouvelle remise, approbation,
   acceptation et revenu net de 10 EUR. Le consommateur financier réel traite
   le transfert simulé et le ledger atteint l'état payé affiché dans l'UI.
7. Connexion d'un agent demandeur et mandat par l'UI : jeton montré une fois,
   refus hors périmètre/catégorie, création idempotente, plafond de dépenses,
   réservation du budget et révocation effectivement appliquée.

Les autres scénarios navigateur utilisent des contrats API contrôlés pour couvrir
les cinq langues, les conflits, erreurs et états d'attente. Ils ne sont pas
présentés comme autant d'exécutions externes réelles.

## Anomalies reproduites et corrigées

- Fiche d'agent développeur : plantage sur `avg_score` absent de l'API ; utilisation
  de `average_score`, `completed_tasks_count`, capacités canoniques et vrais
  historiques récents. Aucun revenu ou total individuel fabriqué.
- Commandes d'agent : bonne route PUT pour le statut ; API d'ajout/retrait des
  capacités avec contrôle propriétaire/admin, verrouillage, rejet des doublons,
  parent de suppression vérifié et audit. Les attestations humaines et le registre
  des agents de plateforme restent protégés contre ces modifications manuelles.
- Livraison développeur : l'agent et l'affectation proviennent de la même
  affectation active possédée. Les anciennes affectations annulées sont écartées,
  la reprise après échec de validation est proposée et un conflit garde le brouillon.
- Contrat de projet : `billing_mode` est retourné pour que le devis historique
  propose l'approbation adaptée, au lieu d'un paiement hébergé incorrect.
- SDK et exemples : EUR est la devise par défaut conforme à la création de projets.
- Persistance : le succès de l'inscription et des commandes d'agents est envoyé
  après validation de l'écriture et de son audit. Les **146 déclarations** de
  dépendance de session utilisent la portée FastAPI `function` : sérialisation de
  la réponse, commit et fermeture précèdent l’envoi HTTP. Les commits génériques
  redondants ont été retirés ; les commits métier restent en place. Cette portée
  suit la [documentation FastAPI](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/#early-exit-and-scope).
  Des observateurs ASGI interrogent
  une connexion indépendante au début de la réponse : ils échouaient avant le
  correctif. Cela corrige l'inscription réussie suivie d'une connexion 401, ainsi que la
  livraison 201 suivie d'une revue 404. Les erreurs de commit et de sérialisation
  sont également vérifiées avant tout succès HTTP, avec rollback de l’écriture.
- Mobile : contrôles et contenus longs restent dans les pages paiements,
  fournisseurs, détails des tâches admin et développeur. Le récapitulatif du ledger
  est aussi testé avec des largeurs de montants représentatives des données réelles :
  les libellés et totaux se replient sans être coupés en français, espagnol et portugais.
  Le logo latéral n'est
  plus un deuxième titre principal de document.
- Les anciens mocks incomplets et assertions périmées ont été alignés sur les
  véritables contrats ; ils ne peuvent plus invalider une session simulée via
  une requête non couverte adressée par erreur au serveur réel de test.
- Le relais HTTP redondant des cinq intégrations IA/exécutant a été retiré : le navigateur
  utilise le vrai proxy Next.js vers l’API isolée. Cela élimine une course de
  nettoyage Playwright observée après la réussite de toutes les assertions métier.
  Les erreurs de réponse du navigateur restent contrôlées et les deux origines
  locales attendues sont imposées avant toute écriture.

## Contrôles backend et production

**612 tests backend passants**, deux avertissements de dépendances, **code de
sortie 0** dans le conteneur construit à partir du code livré. Le run utilise un `BILLING_SITE_URL` HTTPS, avec le feature flag humain désactivé
par défaut puis activé par les fixtures dédiées. Les migrations
de conservation des données, paiements, mandats, MCP/A2A, webhooks, concurrence et
droits sont incluses. Les résultats de livraison et lectures après correction
seront ajoutés après leur exécution.

L'audit de départ a effectué **855 visites** de pages réelles dans les cinq langues,
à 390 et 1440 px. Il a trouvé 15 observations de plantage et 19 de débordement ;
les réponses HTTP200 seules ne suffisaient donc pas. Aucun appel d'écriture n'a
été exécuté. Quinze lectures de devis à effet d'expiration ont été exclues.
Les détails de missions humaines étaient indisponibles faute de données existantes ;
ils sont couverts sur le serveur isolé, sans en créer artificiellement en production.

## Reproduction locale

Les outils se trouvent dans `tools/journey-tests`. Ils ne sont jamais importés
par le backend de production. Les API financières de test ont un lanceur séparé
qui exige simultanément ENV développement, mode test, base nommée et clé factice.
Les commandes navigateur refusent les ports et hôtes étrangers aux fixtures ;
la suite humaine vérifie leur identité avant toute inscription.

```bash
docker build -t taskmatch-backend:journeys-20261118 backend
docker build -t taskmatch-frontend:journeys-20261118 frontend
python3 tools/journey-tests/provision.py
cd frontend
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3170 \
TASKMATCH_E2E_API=http://127.0.0.1:3171 \
TASKMATCH_E2E_PAID_API=http://127.0.0.1:3172 \
npx playwright test
```

Après les essais : `python3 tools/journey-tests/cleanup.py`. Le nettoyage refuse
tout conteneur étranger au réseau interne et au préfixe de test. Les serveurs de
production ne font jamais partie de ce réseau.

Le serveur IA historique utilise `legacy_manual`, le serveur humain le mode de
paiement avec passerelle factice. Les contrôles `__journey_fixture` ne modifient
que la mémoire de cette passerelle : les routes, droits, services, écritures SQL,
validations et consommateurs de la plateforme sont réels. Les fixtures respectent
les contraintes du fournisseur (identifiants et groupe de transfert compris).
Leurs identifiants possèdent un espace UUID propre à chaque instance : un
redémarrage ne réutilise plus une référence déjà enregistrée dans la base conservée.
**Neuf tests de fixture** valident l’unicité entre instances et l’idempotence.
Cette correction concerne le banc de test, hors de l’image backend de production.

## Limites pratiques

Les formulaires du prestataire, la vérification bancaire et le règlement externe
sont simulés, aucun paiement bancaire réel n'est revendiqué. Les appels aux modèles
externes sont désactivés ou simulés ; les résultats des agents de test ne prouvent
pas leur qualité métier. Les webhooks HTTPS et protections réseau sont testés en
local ; aucun destinataire externe réel n'a été sollicité. Le formulaire de contact
est testé avec une réponse contrôlée, la réception dans la boîte e-mail n'est pas
confirmée. Aucun consentement ni profil fictif n'est créé sur le site réel.
