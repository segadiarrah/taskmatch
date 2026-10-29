# Taskmatch — préparation du lancement commercial

Date : 2026-10-26. Statut : approuvé par l’utilisateur le 2026-10-29 ; implémentation vérifiée et déployée le 2026-10-29.

## Demande

Actualiser les modèles des fournisseurs, empêcher qu'une tâche arrête tout le
workflow, attribuer à Sega les tâches humaines sans exécutant, et rendre le
modèle économique et les paiements cohérents avant le lancement commercial.

## Constats vérifiés

- Révision du dépôt : `2e4f9f6`. Des travaux mobiles et une modification du README
  sont déjà présents ; ils doivent être préservés.
- Le backend, le worker de facturation et PostgreSQL sont actuellement sains.
  L'environnement est déjà `production`, `PAYMENT_MODE=stripe`, `STRIPE_MODE=live`.
- Lecture directe de Stripe : encaissements et versements autorisés, compte FR,
  devise EUR. Les deux webhooks Taskmatch sont actifs en live, API `2024-06-20`.
  Aucun débit, transfert ou remboursement réel n'a été déclenché pendant l'audit.
- La base contient 33 missions, toutes `legacy_manual`, et aucune opération de
  facturation. Cela ne démontre pas un parcours client Stripe de bout en bout.
- Sega est le compte administrateur actif `sega@taskmatch.ai` ; aucun profil
  d'exécutant humain Sega n'existe dans les agents administrateurs consultés.
- `_execute_job` traite les tâches dans une transaction commune. Une exception
  provenant de `_deliver_task` provoque son rollback : les résultats antérieurs
  peuvent être perdus et les appels IA répétés.
- `_auto_execute` ignore les routes humaines et hybrides. Il s'arrête également
  lorsque la clé LLM globale manque, même si des fournisseurs sont configurés.
- `_deliver_task` appelle le LLM global, pas le fournisseur de l'agent gagnant.
  Actuellement ce LLM est `deepseek/deepseek-chat-v3-0324` via OpenRouter.
- Le catalogue administrateur et les tarifs sont statiques et anciens. Le devis
  utilise le premier fournisseur activé, sans garantir qu'il exécutera la tâche.
- La page publique affiche Starter à 9 EUR/mois et Pro à 19 EUR/mois, tandis que
  le parcours Stripe implémenté encaisse un devis de mission.
- Le moteur calcule en EUR mais accepte une étiquette de devise arbitraire.
  Reproduction : une même tâche d'écriture donne 1,65 EUR, 1,65 USD et 1,65 GBP,
  sans conversion des montants.
- Les validations automatiques actuelles vérifient la présence de champs ; elles
  ne prouvent pas l'exécution réelle d'une installation ou d'une tâche humaine.

## Approches commerciales

1. **Recommandée : devis prépayé par mission.** Conserve le socle Checkout/Connect
   existant, explicite les frais et supprime les promesses d'abonnement non tenues.
2. Abonnement avec crédits : exige un registre de crédits, les renouvellements,
   quotas, impayés et règles d'expiration ; périmètre plus large pour le lancement.
3. Devis et abonnement optionnel : possible ultérieurement pour des services
   réellement distincts ; ne pas présenter un abonnement comme déjà disponible.

Proposition : option 1, nouvelles missions en EUR, frais de plateforme existants
de 10 % clairement ajoutés au sous-total. La tarification IA inclut les coûts
fournisseur, l'orchestration et la validation ; les 10 % ne représentent donc pas
à eux seuls toute la marge. Aucune modification rétroactive d'un devis accepté.

## Lot A — modèles et routage réels

- Catalogue actualisé à partir des références officielles et des listes de
  modèles accessibles aux clés configurées. Distinguer disponibilité publiée,
  accès du compte, statut preview et compatibilité du protocole.
- Vérification administrateur explicite du catalogue, avec date, erreurs lisibles
  et conservation du dernier catalogue valide lors d'une panne. Les clés restent
  privées. Une liste de modèles accessible ne prouve pas qu'une génération réussit.
- Le modèle choisi est validé ; un choix invalide n'est plus ignoré silencieusement.
- Chaque agent plateforme utilise effectivement son fournisseur, sa clé, son
  protocole et son modèle. Adapter les paramètres pour les modèles de raisonnement
  et le protocole natif Anthropic si nécessaire.
- Conserver les fournisseurs désactivés. Un fournisseur sans clé ou non accessible
  ne devient pas candidat à l'exécution simplement parce que son modèle est récent.
- Enregistrer fournisseur, modèle, usage et erreur par tentative. Prix inconnus :
  modèle non éligible aux nouveaux devis automatiques plutôt qu'un coût inventé.
- Chaque ligne de devis fige une route exécutable : fournisseur, modèle, version
  des tarifs, conversion USD/EUR et budget d'exécution. Supprimer le choix implicite
  du premier fournisseur activé. Une route de secours doit rester dans le budget
  réservé, sinon demander une intervention sans refacturer le client.
- Prévoir des budgets de tokens et délais cohérents avec la complexité ; le plafond
  actuel de 1 400 tokens ne couvre pas les estimations des tâches L/XL.

### Disponibilité observée le 26 octobre

| Fournisseur | Résultat de lecture |
|---|---|
| OpenAI | API 200 ; `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna` visibles |
| Google | API 200 ; `gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.5-flash-lite` visibles ; normaliser le préfixe `models/` |
| Anthropic | API 400 `invalid_request_error` avec la configuration actuelle ; reste désactivé |
| Mistral | API 200 ; Medium 3.5 et Small 4 accessibles ; Large 4 publié mais absent de cette liste de compte |
| DeepSeek | Pas de clé directe configurée ; documentation et accès OpenRouter à distinguer |
| xAI | API 200 ; `grok-4.7` visible ; reste désactivé comme dans la configuration existante |
| OpenRouter | API 200 ; variantes récentes OpenAI, Anthropic, Gemini, DeepSeek, Mistral et Grok visibles |

## Lot B — poursuite et reprise du workflow

- Découper l'exécution durable par tâche et tentative/génération, en conservant
  la file financière séparée. Le lancement du job distribue du travail court ;
  il ne garde plus une transaction globale pendant les appels IA.
- Réserver une tâche avec un verrou, enregistrer la tentative puis libérer la
  transaction avant l'appel réseau. Vérifier à nouveau financement, affectation
  et génération avant de persister le résultat.
- Chaque réservation possède un bail expirant et un identifiant de tentative qui
  empêche un ancien worker d'écraser une reprise. Après un crash suivant un succès
  fournisseur mais précédant la sauvegarde, conserver le coût incertain réservé :
  les fournisseurs ne garantissent pas tous l'idempotence de génération. Les
  reprises restent bornées par le nombre de tentatives et le budget restant.
- Sauvegarder chaque résultat indépendamment. Les reprises et workers concurrents
  ne doivent produire ni double soumission acceptée ni double affectation active.
- Erreur temporaire : reprise bornée avec délai. Erreur durable : intervention
  visible et tentative manuelle possible. Les autres tâches indépendantes avancent.
- Les tâches actuellement planifiées sont censées être indépendantes. Toute
  dépendance explicite future doit être respectée ; ne pas assimiler une priorité
  ou une relation parent/enfant à une autorisation de contourner un prérequis.
- Une erreur définitive nécessite une résolution opérateur : réparer/réattribuer,
  ou annuler la mission et utiliser le remboursement intégral existant. Livraison
  et remboursement partiels sont exclus du lancement ; l'interface explique ce
  choix et affiche les travaux déjà accomplis sans les présenter comme acceptés.
- Une attente humaine conserve la mission en cours. La livraison globale attend
  les résultats requis ; aucune tâche n'est déclarée terminée pour débloquer le flux.
- Conserver les contrôles de devis accepté et de financement, ainsi que le gel
  lors d'un remboursement ou d'un litige. Une reprise ne contourne aucun de ces états.

## Lot C — tâches humaines attribuées à Sega

- Identifier explicitement `sega@taskmatch.ai`, vérifier son rôle et son activation,
  puis créer ou réutiliser idempotemment son profil d'exécutant humain interne.
- Attribuer les tâches humaines sans affectation active à ce profil ; préserver
  les affectations existantes et enregistrer la raison dans le journal d'audit.
- Limiter cette attribution aux tâches humaines inachevées éligibles. Exclure les
  tâches approuvées/annulées, les affectations terminées, les réservations en cours
  et les travaux en revue. Recontrôler atomiquement leur éligibilité, le financement
  et l'absence de gel avant l'affectation.
- Ne pas conditionner cette attribution à la disponibilité d'une clé IA.
- Rendre les tâches visibles et actionnables dans l'administration : travail à
  faire, dépôt du livrable, demande de correction, validation et historique.
- Autoriser le dépôt par un administrateur propriétaire du profil humain interne
  uniquement sur sa propre affectation active, en conservant les contrôles
  d'appartenance. L'API actuelle est réservée aux `agent_developer` et doit évoluer.
- Les tâches hybrides nécessitent une étape de revue humaine explicite ; un
  contrôle de structure JSON ne remplace pas cette revue.
- Pour l'hybride, conserver l'affectation du producteur et son bénéficiaire ;
  enregistrer séparément le réviseur Sega. Après le dépôt : attente de revue,
  correction demandée ou approbation. Seule cette approbation autorise la tâche à
  entrer dans la livraison globale. Les reprises ne suppriment pas l'historique.
- L'attribution est interne à Taskmatch. Aucun message externe n'est nécessaire.
- Pas de transfert Stripe Connect à Sega pour un travail interne plateforme ;
  distinguer recettes, coûts et rémunération des exécutants externes.
- Pour les anciennes missions, prévoir un aperçu des tâches éligibles avant une
  reprise ciblée. Ne pas exécuter automatiquement toutes les missions historiques.

## Lot D — tarification et paiements

- Une seule politique pour l'API, le devis, le site public et Checkout : EUR pour
  les nouveaux devis du lancement, ou conversion explicite si le périmètre est modifié.
  Les devis, règlements et missions historiques conservent leur devise.
- Tarifs fournisseurs datés, coût estimé traçable, arrondis monétaires explicites,
  plafond de dépenses et marge contrôlée. Un changement de modèle ne modifie pas
  silencieusement le montant déjà accepté par le client.
- Vérifier le coût des retries et des routes de secours. Un plafond commercial
  ne doit pas autoriser automatiquement une exécution à perte.
- Paiement du devis avant exécution ; preuve serveur par webhook signé ; reprise
  idempotente ; transferts aux développeurs seulement après acceptation client et
  activation du compte Connect. Ne pas confondre transfert et arrivée en banque.
- Aligner les pages de tarifs, textes d'accueil et autres surfaces concernées :
  aucune promesse d'abonnement, de quota illimité ou de séquestre non implémentée.
- Vérifier Checkout, webhook, reprise, compte Connect incomplet, acceptation,
  remboursement et litige en environnement isolé. La production se vérifie en
  lecture seule ; les scénarios monétaires utilisent Stripe test.

## Validation et livraison prévues

Travail applicatif dans un checkout isolé, car le backend de production monte
directement `/opt/taskmatch/backend`. Préserver les travaux mobiles en cours.

Tests requis : contrat des fournisseurs et erreurs d'accès ; tâche en échec entre
deux tâches qui réussissent ; redémarrage et concurrence ; attribution humaine
sans clé IA ; revue hybride ; absence de double soumission ; gel financier pendant
un appel IA ; cohérence EUR ; devis inchangé ; Checkout/Connect/remboursements ;
parcours administrateur pour accomplir la tâche humaine ; affichage public cohérent.

Baseline exécutée sur le code existant : **163 tests passent** en 48,22 secondes,
base dédiée `taskmatch_launch_20261026_test`, clés Stripe factices, LLM désactivé.
Suites : providers, pricing_service, quote_delivery, stripe_lifecycle,
billing_worker, stripe_gateway. Cette baseline ne vaut pas validation des changements
proposés ni validation d'un encaissement réel.

Avant déploiement : revue du diff, tests pertinents, build, sauvegarde, migration
vérifiée et plan de retour arrière du code sans perte de preuve de paiement.
La proposition commerciale et le périmètre ont été approuvés le 2026-10-29.

## Sources consultées

- [OpenAI — modèles](https://developers.openai.com/api/docs/models) et
  [tarifs](https://developers.openai.com/api/docs/pricing).
- [Anthropic — modèles](https://platform.claude.com/docs/en/models/overview) et
  [tarifs](https://platform.claude.com/docs/en/about-claude/pricing).
- [Google — modèles](https://ai.google.dev/gemini-api/docs/models) et
  [tarifs](https://ai.google.dev/gemini-api/docs/pricing).
- [Mistral — catalogue](https://docs.mistral.ai/models) et
  [Large 4](https://docs.mistral.ai/models/mistral-large-4-0).
- [DeepSeek — modèles et tarifs](https://api-docs.deepseek.com/quick_start/pricing/).
- [xAI — modèles](https://docs.x.ai/developers/models).
- Catalogue OpenRouter consulté directement via `GET /api/v1/models`.
- [Stripe — charges et transferts](https://docs.stripe.com/connect/separate-charges-and-transfers)
  et [fulfillment](https://docs.stripe.com/checkout/fulfillment), complétés par les
  contrats locaux de `docs/STRIPE-OPERATIONS.md` et les lectures du compte réel.
