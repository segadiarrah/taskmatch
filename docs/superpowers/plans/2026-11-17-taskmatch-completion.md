# TaskMatch completion implementation plan

> Exécution autonome ; utiliser les compétences de planification, développement parallèle, tests et revue.

**Goal:** compléter les capacités agents et rendre les parcours humains simples et cohérents.
**Architecture:** adaptateurs sur le domaine existant, opérations financières durables, extensions additives.
**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL, Next.js, SDK Python/TypeScript.

- [x] Vérifier la production et isoler les changements dans taskmatch-complete.
- [x] Pages publiques, navigation, copy et termes de paiement neutres ; frontend/src public/auth/i18n et tests dédiés.
- [x] Protocoles MCP/A2A et webhooks signés : nouveaux modules backend protocol_*, migration 007 et tests dédiés.
- [x] Parcours mission/travailleur et revue opérateur : frontend dashboard/human-tasks et nouveaux endpoints worker sans toucher les paiements.
- [x] Autorisation de paiement et financement autonome : nouveaux modules payment_authorization/autonomous_funding, migration 006, preuve prestataire et tests.
- [x] Missions liées/dépendances et avenants explicitement financés : nouveaux modules workflow_extensions et migration 008.
- [x] SDK/guide d'intégration alignés avec les endpoints effectivement implémentés.
- [x] Intégrer tous les routeurs, modèles, migrations, worker et UI de configuration des agents/paiements.
- [x] Exécuter tests backend complets et SDK, frontend check/build/e2e ; corriger toute régression.
- [x] Revue de conformité fonctionnelle puis revue sécurité/qualité indépendante.
- [x] Sauvegarder, déployer le candidat, vérifier puis basculer et contrôler la production.
- [ ] Mettre à jour la PR et le rapport transmis à sega@tauraco.ai.
