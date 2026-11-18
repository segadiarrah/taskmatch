# TaskMatch — marketplace et intégration visible des missions humaines

Date : 18 novembre 2026. Base : `eb2cff1`.
Branche : `feat/product-clarity-20261118`.

## Produit et parcours

TaskMatch conserve sa marketplace de projets, agents IA, tâches et livrables
validés. Les missions humaines complètent ces fonctions. L'accueil explique la
planification, le matching et la validation des projets IA, puis présente les
interventions humaines directes et la délégation d'un agent à une personne.
Les CTA, la page de fonctionnement, les pages entreprise et les métadonnées
reprennent ce périmètre dans les cinq langues EN/FR/ZH/ES/PT.

Les nouveaux parcours `project` et `executor` rejoignent les formulaires existants
pour les projets IA et les agents exécutants. L'inscription générale choisit le
parcours projet. Une nouvelle inscription exécutant utilise le rôle développeur
existant. Les comptes existants gardent leur rôle et reçoivent une destination
compatible ; aucun privilège ni second compte n'est créé automatiquement. Les
anciens liens `mission`, `work`, `agent` conservent leurs destinations humaines.

## Backoffice

Les tableaux client et développeur affichent des actions expliquées pour les
projets IA, les missions humaines, les agents et la délégation selon le rôle.
L'administration conserve ses opérations et indicateurs globaux, auxquels s'ajoute
un panneau visible de suivi des missions humaines et des vérifications.
La navigation comporte des liens humains explicites. Les actions restent
accessibles pendant le chargement ou l'échec des indicateurs habituels.

`GET /api/v1/worker-portal/admin/overview` retourne cinq compteurs réels sans donnée
personnelle : total des missions humaines, publication en attente, missions
humaines actives, profils et vérifications en attente. L'API exige un compte
administrateur actif et le module activé. Chargement, erreur et zéro activité
sont distincts. Les données humaines sont un sous-ensemble des indicateurs de
marketplace ; elles ne doivent pas être ajoutées aux totaux existants.

Le filtre des listes humaines reconnaît le contrat canonique. Un test a reproduit
un défaut où une tâche IA comportant un JSON `null` était interprétée comme une
mission humaine et provoquait une erreur. Le correctif couvre les deux API de
liste. La file de publication et son compteur excluent les tâches terminées ou
annulées.

## Validation et livraison

- `npm run check` passe : types, lint, **19 tests unitaires**, traduction,
  métadonnées, style et contraste.
- Builds frontend et backend réussis.
- **216 tests navigateur passants** sur l'image de production, quatre scénarios
  optionnels exigeant des comptes externes ignorés. Inclut les cinq langues,
  les trois rôles, les liens réels, les inscriptions, les anciennes fonctions et
  les états chargement/erreur/zéro du nouveau panneau humain.
- Les **160 fichiers produit frontend** de l'image testée correspondent au worktree
  par SHA-256. Aucun changement de dépendance.
- **34 tests Human Tasks et portail passants**, dont les nouvelles régressions sur
  les droits des compteurs et la coexistence des tâches IA et humaines.
- Suite backend complète sur PostgreSQL et Redis isolés : **595 tests passants**,
  deux avertissements de dépendances. Aucune transaction bancaire réelle.
- Revue indépendante de la conformité et du code : aucun point bloquant.

Les contrôles de livraison et le commit seront renseignés après leur exécution. Aucun changement de schéma, de ledger ou de règles de
paiement n'est requis. Les tests de navigateur utilisent des données de test ;
les contrôles en production seront uniquement en lecture.
