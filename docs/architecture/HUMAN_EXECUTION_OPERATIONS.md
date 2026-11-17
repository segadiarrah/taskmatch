# Human Execution Layer — exploitation et limites

## Activation et contrat

Migration additive Alembic 005, puis API/worker compatibles, puis frontend.
`HUMAN_TASKS_ENABLED=true` active les créations et actions humaines. Le flag est
false par défaut. Les routes historiques continuent de fonctionner.

- `GET /api/v1/human-tasks/schema` : JSON Schema Draft 2020-12, nom `tm.human-task.v1`.
- Copie exportée : `backend/app/contracts/tm.human-task.v1.schema.json` (test de parité).
- `GET /api/v1/human-tasks/taxonomy` : catégories configurables par version de fichier.
- Les budgets sont des **plafonds TTC en centimes EUR**, incluant 10 % de frais.
  Le devis effectif est arrondi sans dépasser le plafond ; aucune conversion implicite.
- `expected_duration` est en minutes. Deadline avec fuseau horaire obligatoire.
- Le contrat est immuable. `status`, `policy_status` et `actions` sont des projections
  de l'API, pas des champs à renvoyer dans un contrat de création.

## Demandeur et agent mandaté

1. Session utilisateur : `POST /principals` avec kind individual/organization et
   display_name. Un Principal de chaque kind au maximum par compte. Le compte reste
   responsable ; organization n'est pas une preuve d'identité juridique ni un tenant SSO.
2. Agent existant actif, détenu par ce même compte. Un développeur peut également
   créer un Principal et commander du travail humain sans changer de compte.
3. `POST /principals/{id}/delegations` : agent_id, max_amount_minor, categories et
   expires_at (90 jours maximum). La réponse contient un jeton limité à Human Tasks.
   Ne jamais journaliser ce jeton. Le jeton est refusé par les API de session générale.
4. Avec ce jeton, `POST /human-tasks`, en-tête `Idempotency-Key`, requester_type
   AGENT_REQUESTER, principal_id, requesting_agent_id et delegation_id concordants.
5. Rejeu du même contenu et de la même clé : même tâche. Contenu différent : 409.
   Deux créations concurrentes partagent le même plafond ; verrou Principal puis
   Delegation puis Job puis Task. Les réservations restent conservatrices : aucune
   libération automatique en cas de rejet ou d'incident de paiement.
6. `DELETE /principals/{id}/delegations/{id}` révoque immédiatement les futurs accès
   du jeton. L'expiration et l'état de l'agent sont vérifiés à chaque requête.
7. `GET /human-tasks/{id}/result` retourne ready=false jusqu'à une soumission
   approuvée. Le résultat peut être réinjecté par l'agent dans son propre workflow.
   `/events?skip=0&limit=30` fournit des enveloppes tm.event.v1 sans notes privées.

Un agent mandaté crée et suit les missions. Le financement utilise encore le
Checkout hébergé existant, confirmé par webhook Stripe signé. Cette livraison ne
prétend pas effectuer un débit off-session autonome : il faut une autorisation de
paiement adaptée et un lot supplémentaire pour supprimer cette interaction.

## Travailleur

L'écran `/human-tasks`, onglet Trouver une mission, est disponible aux trois rôles.
L'inscription est gratuite via l'inscription existante. `PUT /workers/me` associe
un profil au compte existant et réutilise son unique profil humain historique, ou
crée un executor Agent interne sans compte supplémentaire. Plusieurs profils
historiques exigent une consolidation opérateur, sans fusion automatique dangereuse.

L'identité reste pending jusqu'à vérification indépendante. Le travailleur peut
configurer Stripe plus tard avec `/billing/connect/onboarding`, puis `/sync`.
Aucun accès à une mission rémunérée avant vérification, consentement, disponibilité,
compétences déclarées **et attestées**, langue et capacité Stripe transfers/payouts.
Le pays changé remet la vérification en attente. De nouvelles compétences déclarées
ne deviennent pas attestées. Le statut disponible peut changer après une affectation
sans bloquer la livraison ni la rémunération déjà acquise.

`POST /human-tasks/{id}/claim` réutilise l'offre, le bid et l'Assignment existants.
Verrouillage Job/Task et claim de l'offre : un seul gagnant. Le donneur d'ordre ne
peut pas prendre sa propre mission. Le compte interne Sega ne reçoit pas ces tâches
automatiquement. `POST /human-tasks/{id}/result` demande résumé et preuves textuelles
non vides (un lien peut référencer une photo). Aucun identifiant technique à saisir
par le travailleur. Les anciens endpoints appliquent les mêmes gates.

## Revue opérateur et validation

- `POST /workers/{user_id}/verify` (admin indépendant) : verification_status,
  attested_skills, notes. Vérifier les éléments hors plateforme avant d'attester.
  Cette API n'est pas un prestataire automatique de vérification d'identité.
- `POST /human-tasks/{id}/publish` (autre admin que le demandeur) :
  authorizations_verified=true, qualifications_verified=true, notes. L'écran admin
  Human Tasks expose l'examen de la mission et ses instructions.
- Toutes les missions restent privées/en attente jusqu'à cette revue. Refuser les
  missions illégales, trompeuses, dangereuses, intrusives et la surveillance non
  consentie. Les catégories ne constituent pas une autorisation juridique.
- Missions physiques : vérifier accord et accès au lieu, sécurité et périmètre.
  Activité réglementée : vérifier les qualifications nécessaires avant publication.
  En cas de doute, conserver en attente ; aucune publication automatique par mots clés.
- Quand toutes les tâches du job sont approuvées, le devis Quote/TaskQuote est créé.
  Le propriétaire finance via Checkout. Le financement confirmé ouvre les missions.
- Soumission : l'existence des preuves ne prouve pas leur véracité. Le demandeur ou
  un admin indépendant relit le livrable via `/submissions/{id}/reviews`.
  Pas d'auto-validation par le producteur ni d'approbation automatique par le moteur.
- Acceptation finale : `/jobs/{id}/accept`. Les transferts suivent le ledger et
  le worker Stripe existants ; la vérification/consentement sont revérifiés avant
  un nouveau transfert. Les rapprochements d'un transfert déjà parti restent possibles.

## Compatibilité et déploiement

Aucune copie des jobs, tasks, bids, assignments, submissions ou paiements.
Les Principals, mandats et profils ont des tables dédiées ; human_task_requests
est uniquement une liaison d'idempotence. Pas de migration de rôle ou d'historique
financier. Les nouveaux contrats peuvent rejoindre un job Human Tasks draft,
non devisé, en EUR/Stripe. Pas de mutation d'un devis accepté ou d'un job financé.
Le schéma 005 peut être supprimé seulement si les nouvelles tables sont vides ;
les données d'autorisation empêchent un downgrade destructif.

Avant bascule : sauvegarder PostgreSQL et les images ; appliquer 005 avec délai de
verrouillage 3 s ; tester le candidat ; déployer API/worker/frontend ensemble ;
recharger Nginx et vérifier readiness. Le code historique est compatible avec les
colonnes ajoutées. Une instance unique avec restart ne constitue pas une garantie
de zéro interruption ; une bascule proxy vers un candidat en parallèle réduit ce
risque. Conserver la source et les images précédentes pour le rollback ; ne pas
remplacer une DB contenant de nouveaux événements financiers par un ancien dump.

## Lots suivants explicites

- Mandats multi-utilisateurs d'organisation, preuve de représentation juridique,
  SSO et isolation de tenant complète.
- Paiement off-session autonome, avenants financiers aux jobs existants et
  libération auditée des réservations inutilisées.
- Orchestration DAG de missions hybrides et dépendances de validation.
- Serveur MCP réel, adaptateur A2A, webhooks sortants signés/retry et métriques.
- Vérification d'identité externalisée, stockage de preuves sécurisé avec rétention,
  géolocalisation attestée, litiges et contrôle des activités réglementées.
- Assistant de création physique dans le frontend ; API déjà disponible avec location.
- Publication des SDK sur npm/PyPI : ils restent pour l'instant distribués en source.

Les noms « MCP » historiques ne désignent pas une implémentation de protocole MCP.
Les webhooks Stripe entrants n'impliquent pas des webhooks sortants agents.
