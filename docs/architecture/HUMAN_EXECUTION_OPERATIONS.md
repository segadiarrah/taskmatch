# Human Execution Layer — exploitation et limites

## Activation et contrat

Migrations additives Alembic 005 à 008, puis API/worker compatibles, puis frontend.
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

Un agent mandaté crée, suit et finance ses propres missions après publication et
établissement du devis. Le propriétaire configure préalablement son moyen de
paiement dans l'onglet Connecter un agent : consentement explicite, configuration
hébergée, puis vérification côté serveur. `POST /principals/{id}/payment-method/setup`
exige `allow_agent_payments=true`; `/confirm` rapproche la preuve et `DELETE` révoque.
Un jeton limité ne peut ni consentir ni configurer ni révoquer ce moyen de paiement.

`POST /human-tasks/{id}/fund` réserve une opération durable, retourne 202, et le
worker effectue un débit hors session dans le mandat et le devis existants. `GET`
sur cette route expose l'état. Les mandats expirés/révoqués, agents désactivés et
consentements retirés bloquent une première tentative. Un résultat inconnu n'est
jamais une autorisation de répéter le débit : rapprochement par référence stable,
preuve de capture et même ledger. Une authentification bancaire peut imposer
l'intervention du propriétaire ; `/fund/recover` rapproche/annule d'abord la tentative
initiale avant d'autoriser un nouveau paiement hébergé. Aucun travail n'est ouvert
sur la seule base d'une promesse, d'une configuration ou d'un statut processing.
Les jobs contenant de l'IA exigent le paiement interactif par le propriétaire.


## Travailleur

L'écran `/human-tasks`, onglet Trouver une mission, est disponible aux trois rôles.
L'inscription est gratuite via l'inscription existante. `PUT /workers/me` associe
un profil au compte existant et réutilise son unique profil humain historique, ou
crée un executor Agent interne sans compte supplémentaire. Plusieurs profils
historiques exigent une consolidation opérateur, sans fusion automatique dangereuse.

L'identité reste pending jusqu'à vérification indépendante. Le travailleur peut
configurer ses paiements plus tard avec `/billing/connect/onboarding`, puis `/sync`.
Aucun accès à une mission rémunérée avant vérification, consentement, disponibilité,
compétences déclarées **et attestées**, langue et capacité de transfert et de versement.
Le pays changé remet la vérification en attente. De nouvelles compétences déclarées
ne deviennent pas attestées. Le statut disponible peut changer après une affectation
sans bloquer la livraison ni la rémunération déjà acquise.

`POST /human-tasks/{id}/claim` réutilise l'offre, le bid et l'Assignment existants.
Verrouillage Job/Task et claim de l'offre : un seul gagnant. Le donneur d'ordre ne
peut pas prendre sa propre mission. Le compte interne Sega ne reçoit pas ces tâches
automatiquement. `POST /human-tasks/{id}/result` demande résumé et preuves textuelles
non vides. Le formulaire accepte aussi une photo directement depuis le téléphone.
`POST /human-tasks/{id}/evidence` accepte JPEG/PNG/WebP, 10 Mo par fichier et dix
fichiers par tâche, avec contrôle du contenu et de l’affectation. Stockage privé
partagé avec le backend ; lecture authentifiée réservée au demandeur, à son agent
mandaté, à l’admin et à l’intervenant autorisé. Aucun nom original de fichier conservé.
Aucun identifiant technique à saisir
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
  Le propriétaire ou son agent autorisé finance le devis. Le financement confirmé ouvre les missions dont les prérequis sont approuvés.
- Soumission : l'existence des preuves ne prouve pas leur véracité. Le demandeur ou
  un admin indépendant relit le livrable via `/submissions/{id}/reviews`.
  Pas d'auto-validation par le producteur ni d'approbation automatique par le moteur.
- Acceptation finale : `/jobs/{id}/accept`. Les transferts suivent le ledger et
  le worker de paiement existants ; la vérification/consentement sont revérifiés avant
  un nouveau transfert. Les rapprochements d'un transfert déjà parti restent possibles.

## Compatibilité et déploiement

Aucune copie des jobs, tasks, bids, assignments, submissions ou paiements.
Les Principals, mandats et profils ont des tables dédiées ; human_task_requests
est uniquement une liaison d'idempotence. Pas de migration de rôle ou d'historique
financier. Les nouveaux contrats peuvent rejoindre un job draft,
non devisé et facturé en EUR. Pas de mutation d'un devis accepté ou d'un job financé.
Le schéma 005 peut être supprimé seulement si les nouvelles tables sont vides ;
les données d'autorisation empêchent un downgrade destructif.

Avant bascule : sauvegarder PostgreSQL et les images ; appliquer 005–008 avec délai de
verrouillage 3 s ; tester le candidat ; déployer API/worker/frontend ensemble ;
recharger Nginx et vérifier readiness. Le code historique est compatible avec les
colonnes ajoutées. Une instance unique avec restart ne constitue pas une garantie
de zéro interruption ; une bascule proxy vers un candidat en parallèle réduit ce
risque. Conserver la source et les images précédentes pour le rollback ; ne pas
remplacer une DB contenant de nouveaux événements financiers par un ancien dump.

## Missions composées et avenants

Le propriétaire peut ajouter des étapes humaines et IA à un job draft avant devis.
`POST /jobs/{id}/steps` ajoute une étape IA et `GET` décrit le plan. Les dépendances
`GET/PUT /human-tasks/{id}/dependencies` restent dans le même job et forment un DAG.
Un prérequis non approuvé bloque découverte, affectation, soumission, validation
et exécution, y compris par les routes historiques. Une approbation réveille les
étapes IA prêtes ; elles reçoivent les livrables approuvés comme données, dans la
limite d'entrée chiffrée au devis. Un rapport trop volumineux bloque avant appel
payant et demande un rapport concis ou un avenant repricé.

`POST /jobs/{id}/amendments` avec `Idempotency-Key` crée une mission liée distincte,
revue et financée séparément. Aucun devis, résultat ou financement historique
n'est réécrit. Un agent limité ne peut créer un avenant que dans son propre mandat.
Les réservations restent conservatrices ; leur libération exige un rapprochement
opérateur, pas une déduction fondée sur une erreur réseau.

## Protocoles et webhooks

Voir [AGENT_PROTOCOLS.md](../AGENT_PROTOCOLS.md) : MCP stateless 2026-07-28 et A2A
0.3.0 sont réellement montés sous `/api/v1/protocols`. La carte A2A est disponible
également sous `/.well-known/agent-card.json`. Les anciennes routes `/mcp/*`
restent des API d'orchestration et ne changent pas de protocole implicitement.

Le propriétaire configure explicitement les abonnements sous
`/principals/{id}/webhooks`. Secret affiché une fois, chiffré au repos ; HMAC
horodaté, identifiant stable à dédupliquer, snapshots d'événements immuables et six
tentatives persistantes. Le worker effectue les livraisons même sans opération de
paiement à traiter. Un endpoint doit être HTTPS public, sans redirection, avec
résolution DNS publique épinglée et vérification TLS. Le destinataire vérifie la
signature et déduplique ; livraison au moins une fois, pas exactement une fois.
Les abonnements révoqués ne reçoivent plus de nouveaux envois. Polling conservé.

## Conditions d'exploitation restantes

- La vérification d'identité et des qualifications est actuellement opérée par
  un administrateur indépendant ; elle exige des preuves réelles.
- Les organisations sont rattachées à un propriétaire ; les équipes multi-utilisateurs,
  SSO et la preuve de représentation juridique ne sont pas implémentés.
- Les photos sont privées, sans attestation GPS ni garantie d'authenticité. Inclure
  leur stockage dans les sauvegardes et appliquer une politique de conservation
  adaptée aux missions réelles. Pas de collecte de documents sensibles.
- Consentement bancaire et réponse éventuelle à une authentification forte relèvent
  du propriétaire ; aucun moyen de paiement ni consentement n'est créé par défaut.
- Les SDK restent distribués en source ; pas de publication npm/PyPI annoncée.
- Les noms du prestataire sont conservés dans les intégrations internes et sur ses
  propres pages hébergées ; ils sont absents des textes publics TaskMatch.
