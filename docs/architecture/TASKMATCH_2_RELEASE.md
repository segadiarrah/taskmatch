# TaskMatch 2 — livraison progressive du 17 novembre 2026

Audit avant code : [TASKMATCH_2_AUDIT.md](TASKMATCH_2_AUDIT.md).
Exploitation et limites : [HUMAN_EXECUTION_OPERATIONS.md](HUMAN_EXECUTION_OPERATIONS.md).

Cette livraison ajoute le domaine Human Tasks à l'existant : Principal, mandat
borné/révocable, contrat tm.human-task.v1, taxonomie versionnée, profil travailleur
sans duplication de compte, revue indépendante avant publication, claim atomique,
livrables et résultats interopérables par polling. Le frontend commun aux rôles
simplifie la demande, l'inscription et la livraison humaines en EN/FR/ES/ZH.

Les contrôles d'éligibilité et de financement sont appliqués aussi aux routes
historiques. La facturation réutilise Quote/TaskQuote et le ledger Stripe ; un
compte client ou admin possédant un profil travailleur éligible peut être rémunéré.
Les limites du premier lot (Checkout interactif, organisations simples, absence de
MCP/A2A et webhooks sortants, avenants/DAG futurs) restent explicites.

Next.js a été mis à jour de 16.4.3 à 16.4.6 : advisory officiel
https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h .
Le contrôle npm de dépendances de production retourne zéro vulnérabilité après mise à jour.

## Vérifications avant déploiement

- Référence avant modification : 468 tests backend passants.
- Suite backend finale sur PostgreSQL isolé : **498 passed**, 2 avertissements de
  dépendances, 227,44 secondes. Aucune base de production réinitialisée.
- SDK : **12 tests Python**, **11 tests TypeScript** passants.
- Frontend `npm run check` : types, lint, 10 tests unitaires, langues, métadonnées,
  style et contraste passants ; avertissements de navigation historiques conservés.
- Suite navigateur complète : **101 passants, 4 optionnels ignorés**. Après le
  changement de positionnement, mise à jour des quatre assertions d'accueil et
  vérification de **48 scénarios langues/Human Tasks**, tous passants.
- Build Next.js 16.4.6 local et images Docker backend/frontend réussis.
- npm audit production : zéro vulnérabilité connue au moment du contrôle.
- Migration réelle 003 → head, alembic check, downgrade à vide puis upgrade
  exercés dans les tests ; refus de détruire les historiques financiers.
- Revue indépendante : sept cas corrigés avec régressions (paiement multi-rôle,
  compétences attestées, parent legacy, preuves vides, replanification, échéance,
  ancien résultat en révision). Avis final favorable à ce périmètre.
- Inspection visuelle des écrans mobile et desktop en français.

Ces validations utilisent un simulateur à la frontière Stripe. Aucun débit,
transfert ou remboursement bancaire réel n'a été effectué pour cette livraison.

## Déploiement

Statut à compléter après vérification effective du candidat et de la bascule.
