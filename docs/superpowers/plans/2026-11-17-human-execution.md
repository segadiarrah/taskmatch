# Human Execution Layer Implementation Plan

> Exécution autonome autorisée ; suivi en ligne, revue indépendante de la conception et du code.

**Goal:** un cycle agent autorisé → mission humaine → claim → livrable → validation et paiement existant.
**Architecture:** domaine additif, contrat neutre et adaptateurs vers les entités existantes.
**Tech Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, Next.js, SDK Python/TS.

- [x] Audit documenté avant code dans docs/architecture/TASKMATCH_2_AUDIT.md.
- [ ] Tests d'intégration négatifs puis positifs dans backend/tests/test_human_tasks.py.
- [ ] backend/app/models/human.py + migration 005 et Task.human_contract_json/policy_status.
- [ ] backend/app/schemas/human.py, taxonomy JSON versionnée et JSON Schema exporté.
- [ ] services/human_tasks.py, délégation bornée/idempotence et routes human-tasks/workers/principals.
- [ ] Réutiliser devis, financement, claims/submissions ; empêcher les chemins alternatifs de contourner les gates.
- [ ] SDK Python/TS et tests : create/get/result avec jeton délégué et Idempotency-Key.
- [ ] Frontend demandeur et travailleur, labels traduits, tests navigateur fonctionnels.
- [ ] Tests backend complets isolés, migration up/check, SDK, npm check et build.
- [ ] Revue indépendante, corrections, documentation d'exploitation et rapport final.
- [ ] Préparer puis vérifier le candidat ; ne pas masquer des fonctions encore manquantes.
- [ ] Envoyer le rapport autorisé à sega@tauraco.ai ; consigner le résultat réel de l'envoi.
