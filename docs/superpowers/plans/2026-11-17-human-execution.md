# Human Execution Layer Implementation Plan

> Exécution autonome autorisée ; suivi en ligne, revue indépendante de la conception et du code.

**Goal:** un cycle agent autorisé → mission humaine → claim → livrable → validation et paiement existant.
**Architecture:** domaine additif, contrat neutre et adaptateurs vers les entités existantes.
**Tech Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, Next.js, SDK Python/TS.

- [x] Audit documenté avant code dans docs/architecture/TASKMATCH_2_AUDIT.md.
- [x] Tests d'intégration négatifs puis positifs dans backend/tests/test_human_tasks.py.
- [x] backend/app/models/human.py + migration 005 et Task.human_contract_json/policy_status.
- [x] backend/app/schemas/human.py, taxonomy JSON versionnée et JSON Schema exporté.
- [x] services/human_tasks.py, délégation bornée/idempotence et routes human-tasks/workers/principals.
- [x] Réutiliser devis, financement, claims/submissions ; empêcher les chemins alternatifs de contourner les gates.
- [x] SDK Python/TS et tests : create/get/result avec jeton délégué et Idempotency-Key.
- [x] Frontend demandeur et travailleur, labels traduits, tests navigateur fonctionnels.
- [x] Tests backend complets isolés, migration up/check, SDK, npm check et build.
- [x] Revue indépendante, corrections, documentation d'exploitation et rapport final.
- [x] Préparer puis vérifier le candidat ; ne pas masquer des fonctions encore manquantes.
- [x] Envoyer le rapport autorisé à sega@tauraco.ai ; consigner le résultat réel de l'envoi.
