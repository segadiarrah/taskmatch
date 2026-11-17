# TaskMatch — parcours simplifiés et exécution agents

Date : 17 novembre 2026. Base de production : `56d35d0`.
Branche : `feat/taskmatch-complete-20261117`.

## Comportement livré

L'accueil et les pages publiques donnent trois choix : confier une mission,
trouver du travail et connecter un agent. Le choix traverse inscription/connexion
et ouvre le bon onglet d'un même compte. Navigation mobile réduite, formulaires
progressifs en quatre langues, tarifs clairs et aucun nom de prestataire de
paiement dans les textes publics TaskMatch. Les anciens écrans restent accessibles.

Le travailleur décrit ses compétences, configure son profil gratuitement puis ses
paiements lorsqu'il le souhaite, trouve et accepte une mission éligible, dépose un
résumé et des photos privées et suit ses gains. L'opérateur dispose d'une revue des
profils, des compétences attestées et des missions avant publication.

L'agent dispose du contrat neutre, des SDK Python/TypeScript, de MCP HTTP stateless
2026-07-28 et d'A2A JSON-RPC 0.3.0. Les webhooks HTTPS sont explicitement configurés,
signés, dédupliqués et retentés au plus six fois. Les cartes de découverte passent
réellement le proxy. Les protocoles réutilisent les jetons limités, sans élévation.

Le propriétaire peut consentir à des paiements ultérieurs. L'agent finance son
propre travail humain dans le montant déjà réservé et le devis approuvé. Chaque
opération durable est rapprochée avec une capture réelle avant de libérer le
travail. En cas d'authentification bancaire ou d'issue inconnue, la reprise exige le
propriétaire et rapproche la tentative précédente avant tout nouveau paiement.

Les étapes humaines et IA partagent les jobs/tasks/submissions existants. Les
prérequis doivent être approuvés ; l'IA reçoit leurs résultats validés dans le
budget d'entrée prévu. Les compléments sont des missions liées, revues et financées
séparément, sans modifier le devis ni le paiement d'origine.

## Exploitation

Voir [le runbook](HUMAN_EXECUTION_OPERATIONS.md),
[l'audit initial et son complément](TASKMATCH_2_AUDIT.md),
[les protocoles](../AGENT_PROTOCOLS.md) et
[la référence API](../API_REFERENCE.md).

Les identités et qualifications exigent une vérification indépendante réelle.
Le propriétaire configure volontairement son moyen de paiement et répond aux
éventuelles demandes de sa banque. Les organisations ont un propriétaire unique,
sans SSO multi-utilisateurs. Les SDK sont fournis en source, sans publication de
paquet annoncée. Les photos restent privées et ne constituent pas une attestation
GPS ni une preuve automatique de véracité.

## Vérifications et déploiement

- Suite backend complète sur PostgreSQL isolé : **591 tests passants**, deux
  avertissements de dépendances, 291,67 s. Une première suite de 582 tests était
  également verte avant les dernières régressions.
- Dernier contrôle ajouté après cette collecte : expiration du devis avant le
  premier débit. Régression reproduite avant correction, puis **24 tests de
  paiements/adaptateurs passants** après correction ; revue indépendante favorable.
- Revue des devis concurrents : 99 tests élargis, puis 40 tests ciblés passants ;
  timestamps de Quote/TaskQuote corrigés sans réécrire les historiques.
- Transport webhook : trois tests TLS locaux réels, dont serveur lent et handshake
  bloqué ; échéance globale et fermeture effective de la connexion vérifiées.
- Frontend : types, lint, 13 tests unitaires, langues, métadonnées, style et contraste
  passants. Build et image Docker réussis.
- **124 tests navigateur passants sur l'image de production**, dont 96 contrôles
  de pages publiques dans les quatre langues. Quatre tests d'intégration optionnels
  demandant des comptes externes restent ignorés ; aucune mission bancaire réelle
  créée pour les satisfaire.
- SDK : **16 tests Python** et **15 tests JavaScript** passants.
- npm audit production : zéro vulnérabilité connue lors du contrôle.
- Images backend/frontend construites ; sauvegardes PostgreSQL, volume privé,
  configuration et images précédentes vérifiées avant la bascule.

Déployé le **17 novembre 2026**, fonctionnalité `c171aed` et correction de
montage proxy `3009261`. Migration **005 → 008** appliquée. Les services backend,
worker, frontend, PostgreSQL, Redis et Nginx fonctionnent avec Human Tasks activé.

L'API et le frontend candidats ont servi pendant le remplacement des services
canoniques. Le worker compatible a été installé avant l'exposition des nouvelles
opérations. Les anciens fichiers mobiles et le README de production sont préservés.

Le contrôle public de la carte A2A a détecté un ancien bind mount Nginx resté sur
l'inode d'avant le checkout : réponse 404 du nouveau chemin, corrigée avant les
contrôles finaux. Le montage du répertoire a été vérifié avec remplacement atomique
réel, puis activé en production via un proxy alternatif et la bascule du seul
vhost TaskMatch. Le vhost frontal a été restauré à l'identique.

**16 contrôles réels après bascule passent**, dont readiness, contrat, carte A2A,
outils MCP, accès A2A refusé sur tâche absente, API du portail et cinq vues de
l'espace utilisateur en français ; **zéro erreur JavaScript**. Les captures mobile
ont été inspectées. Le contrôle public ne trouve pas le nom du prestataire.

Sur deux fenêtres de sondage, **157/160 requêtes readiness ont retourné HTTP 200** ;
deux timeouts et une connexion réinitialisée ont été observés. Un premier contrôle
navigateur après rechargement du frontal a aussi rencontré une réinitialisation de
connexion ; sa relance complète est verte. Ces mesures ne constituent pas une
preuve d'absence totale d'interruption ni une garantie de disponibilité continue.

SQL après bascule : **33 jobs, 135 tâches, 0 financement, 0 Principal, 0 profil
travailleur, 0 autorisation de paiement et 0 abonnement sortant**. Aucun compte,
consentement, mission ou paiement fictif n'a été ajouté à la production.

Pull request : https://github.com/segadiarrah/taskmatch/pull/2 . Le connecteur
GitHub refusait la création (403) ; la CLI configurée a créé la PR. Les branches
historiques et `main` restent conservées. Aucun débit, transfert ou remboursement bancaire réel n'est
nécessaire pour tester cette livraison ; les tests simulent la frontière du
prestataire et utilisent PostgreSQL isolé.


Les contrôles cités sont ceux exécutés sur cet environnement et sur les services
déployés. Aucun résultat GitHub Actions n’était disponible lors de la livraison,
bien que les Actions soient activées et le workflow CI présent. Ne pas les
présenter comme des checks distants passants.
