# Spec — Moteur de prix TaskMatch & livraison des livrables

Date : 2026-08-10
Statut : implémenté (lot 1 + lot 2)

## Problème

Deux manques bloquent la commercialisation :

1. **Le prix n'est pas décidé par TaskMatch.** `decompose_job` divise simplement
   `budget_max / nombre_de_tâches` (`backend/app/services/mcp_service.py:483`), et les
   auto-bids des agents plateforme sont arbitraires : `budget × (0.62 + 0.06 × idx)`
   (`backend/app/api/v1/endpoints/jobs.py:122`). C'est le modèle marketplace classique :
   le client pose un budget, l'offre s'y adapte. Aucun devis n'est présenté avant
   exécution — `_generate_plan` enchaîne format → décompose → match → exécute sans point
   d'arrêt.
2. **Le livrable n'a pas de mode de livraison.** `Submission.artifact_urls_json` existe
   mais `_deliver_task` le remplit toujours avec `[]` : le livrable est du markdown dans
   un champ JSON. Rien ne couvre l'installation chez le client, ni l'échange d'accès.

## Décisions

| Sujet | Décision |
|---|---|
| Prix des tâches LLM | **Cost-plus** : coût token réel × multiplicateur + forfait d'orchestration + coût de validation/retry |
| Prix des tâches humaines | **Fourchette** basée sur des taux blended remote en EUR, par discipline et séniorité |
| Gate | **Validation explicite obligatoire** : nouveau statut `quoted`, rien ne s'exécute avant acceptation |
| Devise de référence | EUR (cohérent avec le site public) |

## 1. Moteur de prix

`backend/app/services/pricing_service.py` — pur, déterministe, sans I/O ni DB, donc
testable et auditable. Aucune dépendance au budget saisi par le client : celui-ci devient
une simple *contrainte d'acceptabilité*, plus une entrée du calcul.

### 1.1 Catalogue de coûts modèles

`MODEL_RATES_USD` : USD par million de tokens (entrée, sortie) pour chaque modèle du
catalogue `providers.CATALOG`. Tarifs first-party constatés au `RATES_AS_OF`
(2026-08-10). `resolve_model_rate()` normalise les slugs (`anthropic/claude-sonnet-5`,
`claude-sonnet-4.5` → `claude-sonnet-4-5`) et retombe sur `DEFAULT_RATE` pour un modèle
inconnu, plutôt que d'échouer.

**Ces tarifs sont des données, pas de la logique** : ils doivent être revérifiés auprès
des fournisseurs avant chaque campagne commerciale.

### 1.2 Estimation du volume de tokens

```
input_tokens  = CONTEXT_OVERHEAD + len(description)/CHARS_PER_TOKEN + spec du job
output_tokens = profil du type de tâche × facteur de palier
attempts      = 1 + RETRY_RATE            (échecs de validation amortis)
validation    = passe de validation LLM (entrée = livrable, sortie courte)
```

### 1.3 Paliers de complexité

`S / M / L / XL`, dérivés de façon déterministe : longueur de la description, nombre de
livrables et de critères d'acceptation, type de tâche, signaux lexicaux
(`migration`, `architecture`, `audit`…). Le palier pilote à la fois le volume de sortie
attendu, le forfait d'orchestration et les heures humaines estimées.

### 1.4 Formule cost-plus (route LLM)

```
compute       = coût_token_EUR × COMPUTE_MULTIPLIER
orchestration = ORCHESTRATION_FEE_EUR[palier]
validation    = coût_validation_EUR × VALIDATION_MULTIPLIER
prix          = compute + orchestration + validation
prix          = max(prix, MIN_TASK_PRICE_EUR)
prix          = min(prix, borne_basse_humaine × COMPETITIVE_CEILING)
```

Le plafond de compétitivité est la garantie que le prix reste défendable : une tâche LLM
ne peut jamais être facturée plus d'une fraction de son équivalent humain. C'est aussi ce
qui alimente l'économie affichée au client.

### 1.5 Fourchette humaine

```
heures          = heures_de_base[palier] × facteur_type_de_tâche
(bas, haut)     = BLENDED_REMOTE_RATES_EUR[discipline][séniorité]
fourchette      = (heures × bas, heures × haut)
```

L'expert voit la fourchette et décide d'accepter ou non. C'est TaskMatch qui la fixe :
l'expert n'enchérit pas, il accepte un prix dans une bande déjà arbitrée.

### 1.6 Routage

`route_for_task()` renvoie `llm`, `human` ou `hybrid`. Une tâche est routée `human` quand
son type est dans `HUMAN_ONLY_TASK_TYPES` (installation, déploiement, juridique,
signature, présence physique) ou quand la décomposition a posé `requires_human`.
`hybrid` = produit par un LLM, revu par un humain avant livraison.

## 2. Devis et gate

### 2.1 Modèle de données

- `Quote` (niveau job) : statut, devise, sous-total, frais de plateforme, total,
  `valid_until`, `pricing_version`, `breakdown_json`.
- `TaskQuote` (niveau tâche) : route, modèle, tokens estimés, coût token, compute,
  orchestration, validation, prix, fourchette humaine, heures, palier, justification.

Un devis est **immuable** : réviser un job crée un nouveau devis et passe le précédent en
`superseded`. L'historique de prix est donc auditable.

### 2.2 Cycle de vie

```
draft → submitted → formatted → decomposed → PRICING → quoted
                                                          │
                              accepté ──────────┬───────── refusé / expiré
                                                ▼
                                    escrow → bidding → in_progress → …
```

`_generate_plan` s'arrête à `quoted`. `POST /jobs/{id}/quote/accept` déclenche
`_execute_job`, qui reprend le pipeline existant (match → auto-bid → exécution).

### 2.3 Endpoints

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/jobs/{id}/quote` | Devis courant + détail par tâche |
| `POST` | `/jobs/{id}/quote/accept` | Accepte et lance l'exécution |
| `POST` | `/jobs/{id}/quote/reject` | Refuse (motif optionnel) |
| `POST` | `/jobs/{id}/quote/refresh` | Recalcule (admin, ou devis expiré) |
| `GET` | `/tasks/{id}/offer` | Fourchette proposée à l'expert humain |
| `POST` | `/tasks/{id}/offer/accept` | L'expert accepte un prix dans la fourchette |

## 3. Livraison et échange d'accès

### 3.1 Modes de livraison

`DeliveryPlan` par job : `document`, `repository`, `dataset`, `installation`, `hosted`.
Le mode est proposé par la décomposition selon les livrables, et modifiable par le client
avant acceptation du devis — parce qu'il change le prix (une installation ajoute des
tâches humaines).

### 3.2 Coffre d'accès (`AccessGrant`)

Quand le mode est `installation` ou `hosted`, le client doit transmettre des accès
(SSH, API, base, console). Exigences :

- **Chiffrement au repos** — Fernet (`cryptography`, déjà présent via
  `python-jose[cryptography]`), clé dérivée de `VAULT_SECRET_KEY`. Aucun secret en clair
  en base ni dans les logs.
- **Portée et durée** — chaque grant cible un job, porte une date d'expiration et un
  nombre maximal de révélations.
- **Révélation tracée** — `POST /access-grants/{id}/reveal` incrémente `access_count`,
  horodate `last_accessed_at` et écrit un audit. Au-delà de `max_accesses` ou après
  `expires_at`, la révélation est refusée.
- **Révocation automatique** — à la clôture du job (`accept_job`), tous les grants du job
  sont révoqués et leur chiffré effacé.
- **Sens de circulation** — `client_to_platform` (le client fournit un accès) et
  `platform_to_client` (TaskMatch livre un identifiant, ex. compte d'admin de l'instance
  installée).

### 3.3 Handover

`Handover` par job : mode retenu, artefacts, runbook, date d'installation, sign-off
client, date de révocation des accès. Le job ne passe `completed` qu'après sign-off.

## 4. Ce qui n'est pas couvert

- Passerelle de paiement réelle : l'escrow reste l'enregistrement `PaymentRecord`
  existant, sans appel Stripe.
- Le stockage d'artefacts (S3/R2) reste un TODO du README ; `artifact_urls_json` porte
  des URL, la livraison de fichiers binaires n'est pas implémentée.
- La vérification périodique des tarifs fournisseurs est manuelle.
